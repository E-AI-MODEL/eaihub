import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLASSIFY_TOOL = {
  type: "function" as const,
  function: {
    name: "classify_10d",
    description: "Classify a student-AI interaction across 10 didactic dimensions of the EAI model",
    parameters: {
      type: "object",
      properties: {
        K: { type: "string", description: "Knowledge type: K0=Undefined, K1=Facts, K2=Procedural, K3=Metacognition" },
        P: { type: "string", description: "Process phase: P0-P5 (Orientation→Evaluation)" },
        C: { type: "string", description: "Co-regulation: C0-C5 (AI-monologue→Student-anchored)" },
        TD: { type: "string", description: "Task density: TD0-TD5 (Student-led→AI-dominant)" },
        V: { type: "string", description: "Skill potential: V0-V5 (Explore→Create)" },
        E: { type: "string", description: "Epistemic reliability: E0-E5 (Unknown→Peer-reviewed)" },
        T: { type: "string", description: "Tool awareness: T0-T5 (Invisible→Meta)" },
        S: { type: "string", description: "Social interaction: S0-S5 (Solitary→Collective)" },
        L: { type: "string", description: "Learning continuity: L0-L5 (Isolated→Durable)" },
        B: { type: "string", description: "Bias correction: B0-B5 (Unconscious→Meta)" },
        confidence: { type: "number", description: "Overall classification confidence 0.0-1.0. Most educational observations fall BETWEEN descriptors, so confidence below 0.8 is normal." },
        borderline_dimensions: {
          type: "array",
          items: { type: "string" },
          description: "Dimension keys (e.g. 'K', 'TD') where classification is uncertain/ambiguous between two bands"
        },
        secondary_bands: {
          type: "object",
          description: "For borderline dimensions: the second-most-likely band. E.g. {\"K\": \"K2\", \"TD\": \"TD3\"}",
          additionalProperties: { type: "string" }
        },
        srl_state: { type: "string", enum: ["PLAN", "MONITOR", "REFLECT", "ADJUST", "UNKNOWN"] },
        epistemic_status: { type: "string", enum: ["FEIT", "INTERPRETATIE", "SPECULATIE", "ONBEKEND"] },
        cognitive_mode: { type: "string", enum: ["ANALYTISCH", "REFLECTIEF", "SYSTEMISCH", "PRAGMATISCH", "CREATIEF", "NORMATIEF", "ONBEKEND"] },
        mastery_check: { type: "boolean", description: "True if the student demonstrates mastery-level understanding in this turn" },
        reasoning: { type: "string", description: "Brief reasoning for the classification in Dutch (max 2 sentences)" },
      },
      required: ["K", "P", "C", "TD", "V", "E", "T", "S", "L", "B", "confidence", "srl_state", "epistemic_status", "cognitive_mode", "reasoning"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, aiResponse, profile, rubricContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Je bent een didactisch classificatie-expert voor het EAI 10-Dimensionaal Didactisch Model.

Classificeer de onderstaande student-AI interactie op alle 10 dimensies.

BELANGRIJK UITGANGSPUNT:
- De meeste onderwijsobservaties vallen NIET exact binnen één descriptor, maar in de OVERGANGSRUIMTE tussen descriptoren.
- Descriptoren zijn REFERENTIEPUNTEN, niet perfecte containers.
- Geef daarom altijd een eerlijke confidence score (< 0.8 is normaal).
- Als een dimensie borderline is tussen twee bands, geef beide: primary in het hoofdveld, secondary in secondary_bands.
- Markeer borderline dimensies expliciet in borderline_dimensions.

CONTEXT:
- Vak: ${profile?.subject || 'Onbekend'}
- Niveau: ${profile?.level || 'Onbekend'}
- Leerjaar: ${profile?.grade || 'Onbekend'}

RUBRIC REFERENTIE:
${rubricContext || 'Geen rubric context beschikbaar'}`;

    console.log(`[eai-classify] Classifying interaction, subject=${profile?.subject}, level=${profile?.level}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `STUDENT INPUT:\n${userMessage}\n\nAI RESPONSE (eerste 2000 tekens):\n${(aiResponse || '').slice(0, 2000)}`
          },
        ],
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: "function", function: { name: "classify_10d" } },
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits op" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("[eai-classify] Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Classification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("[eai-classify] No tool call in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No classification returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let classification;
    try {
      classification = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("[eai-classify] Failed to parse tool call arguments");
      return new Response(JSON.stringify({ error: "Invalid classification format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[eai-classify] OK: K=${classification.K} P=${classification.P} TD=${classification.TD} conf=${classification.confidence} borderline=[${(classification.borderline_dimensions || []).join(',')}]`);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[eai-classify] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
