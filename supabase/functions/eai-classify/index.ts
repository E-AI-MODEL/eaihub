import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool calling schema for structured 10D analysis extraction
const CLASSIFY_TOOL = {
  type: "function" as const,
  function: {
    name: "classify_10d",
    description: "Classificeer een leerling-AI interactie langs het 10-Dimensionaal Didactisch Model. Gebruik de conversatie-context om per dimensie de juiste band te bepalen.",
    parameters: {
      type: "object",
      properties: {
        process_phases: {
          type: "array",
          items: { type: "string", enum: ["P0", "P1", "P2", "P3", "P4", "P5"] },
          description: "Procesfase: P0=Ongedefinieerd, P1=Oriëntatie, P2=Voorkennis, P3=Instructie, P4=Toepassing, P5=Evaluatie",
        },
        knowledge_type: {
          type: "string",
          enum: ["K0", "K1", "K2", "K3"],
          description: "Kennistype: K0=Ongedefinieerd, K1=Reproductie, K2=Toepassing, K3=Metacognitie",
        },
        coregulation_bands: {
          type: "array",
          items: { type: "string", enum: ["C0", "C1", "C2", "C3", "C4", "C5"] },
          description: "Alleen co-regulatie bands (C0-C5): C0=Ongedefinieerd, C1=Directief, C2=Begeleid, C3=Gedeeld, C4=Zelfregulerend, C5=Autonoom",
        },
        task_densities: {
          type: "array",
          items: { type: "string", enum: ["TD0", "TD1", "TD2", "TD3", "TD4", "TD5"] },
          description: "Taakdichtheid: TD1=Leerling-geleid, TD2=Gedeeld, TD3=Gestuurd, TD4=AI-geleid, TD5=AI-dominant",
        },
        secondary_dimensions: {
          type: "array",
          items: { type: "string" },
          description: "Overige dimensies: V0-V5 (Vaardigheidspotentieel), E0-E5 (Epistemische betrouwbaarheid), T0-T5 (Technologische integratie), S0-S5 (Sociale interactie), L0-L5 (Leercontinuïteit), B0-B5 (Biascorrectie)",
        },
        cognitive_mode: {
          type: "string",
          enum: ["ANALYTISCH", "REFLECTIEF", "SYSTEMISCH", "PRAGMATISCH", "CREATIEF", "NORMATIEF", "ONBEKEND"],
          description: "Cognitieve modus van de leerling",
        },
        srl_state: {
          type: "string",
          enum: ["PLAN", "MONITOR", "REFLECT", "ADJUST", "UNKNOWN"],
          description: "Zelfregulerend leren fase",
        },
        epistemic_status: {
          type: "string",
          enum: ["FEIT", "INTERPRETATIE", "SPECULATIE", "ONBEKEND"],
          description: "Epistemische status van de AI-output",
        },
        active_fix: {
          type: "string",
          nullable: true,
          description: "Actieve didactische interventie of null",
        },
        active_flags: {
          type: "array",
          items: { type: "string" },
          description: "Actieve waarschuwingsvlaggen uit het model",
        },
        reasoning: {
          type: "string",
          description: "Korte onderbouwing van de classificatie in 1-2 zinnen",
        },
        confidence: {
          type: "number",
          description: "Globale zekerheid van de classificatie tussen 0 en 1",
        },
        secondary_bands: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Tweede kandidaat-band per dimensie, bv. { K: 'K3', P: 'P2' }",
        },
        borderline_dimensions: {
          type: "array",
          items: { type: "string" },
          description: "Dimensies die op of nabij een grens liggen, bv. ['K', 'P', 'TD']",
        },
      },
      required: ["process_phases", "knowledge_type", "coregulation_bands", "task_densities", "secondary_dimensions", "cognitive_mode", "srl_state", "epistemic_status", "active_flags", "reasoning"],
      additionalProperties: false,
    },
  },
};

interface ClassifyRequest {
  userMessage: string;
  aiResponse: string;
  profile: {
    name?: string | null;
    subject?: string | null;
    level?: string | null;
    grade?: string | null;
    goal?: string | null;
  };
  sessionContext?: {
    topics_covered: string[];
    turn_count: number;
    current_topic: string | null;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, aiResponse, profile, sessionContext }: ClassifyRequest = await req.json();

    if (!userMessage || !aiResponse) {
      return new Response(
        JSON.stringify({ error: "userMessage en aiResponse zijn verplicht" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const startTime = Date.now();

    const classifyPrompt = `Analyseer de volgende leerling-AI interactie volgens het 10-Dimensionaal Didactisch Model.

LEERLINGPROFIEL:
- Vak: ${profile.subject || "onbekend"}
- Niveau: ${profile.level || "onbekend"}
- Leerjaar: ${profile.grade || "onbekend"}
- Doel: ${profile.goal || "niet opgegeven"}
${sessionContext ? `- Beurtaantal: ${sessionContext.turn_count}` : ""}

LEERLING-INPUT:
${userMessage}

AI-RESPONSE:
${aiResponse.slice(0, 2000)}

Classificeer deze interactie. Let op:
- Kennistype (knowledge_type, K0-K3): wat voor kennis vraagt/toont de leerling? Dit is een APART veld, NIET in coregulation_bands.
- Procesfase (P0-P5): in welke fase van het leerproces zit dit?
- Co-regulatie (coregulation_bands, ALLEEN C0-C5): wie stuurt het gesprek? Zet hier GEEN K- of P-bands in.
- Taakdichtheid (TD0-TD5): hoeveel doet de AI vs de leerling?
- Vaardigheidspotentieel (V0-V5): welk vaardigheidsniveau?
- Epistemische betrouwbaarheid (E0-E5): hoe betrouwbaar is de AI-output?
- Technologische integratie (T0-T5): hoe bewust is de leerling van de AI?
- Sociale interactie (S0-S5): werkt de leerling alleen of samen?
- Leercontinuïteit (L0-L5): hoe verbonden is dit met eerdere/toekomstige leeractiviteiten?
- Biascorrectie (B0-B5): hoeveel kritisch bewustzijn toont de leerling?
- Cognitieve modus: hoe denkt de leerling?
- SRL-fase: zelfregulerend leren status
- Epistemische status: hoe betrouwbaar is de AI-output (FEIT/INTERPRETATIE/SPECULATIE/ONBEKEND)?
- Vul secondary_dimensions met V, E, T, S, L, B bands.
- Als een dimensie duidelijk op of nabij een grens ligt, geef dat aan via borderline_dimensions en vul secondary_bands waar relevant. Geef confidence alleen als globale schatting.`;

    console.log(`[eai-classify] Starting classification, profile: ${profile.subject}/${profile.level}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: classifyPrompt },
        ],
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: "function", function: { name: "classify_10d" } },
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[eai-classify] Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt. Probeer het over een minuut opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits op." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Classificatie mislukt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function?.name !== "classify_10d") {
      console.error("[eai-classify] No valid tool call in response");
      return new Response(
        JSON.stringify({ error: "Geen geldige classificatie ontvangen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    const latencyMs = Date.now() - startTime;

    console.log(`[eai-classify] Success in ${latencyMs}ms: ${analysis.reasoning?.slice(0, 80)}`);

    return new Response(
      JSON.stringify({
        analysis,
        model: "google/gemini-2.5-flash",
        source: "edge",
        latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[eai-classify] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
