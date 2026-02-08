import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// EAI Didactic System Prompt - Contains the full 10D rubric logic
const EAI_SYSTEM_PROMPT = `Je bent EAI, een Educatieve AI-coach die werkt volgens het 10-Dimensionaal Didactisch Model.

## KERNPRINCIPES
1. **Nooit direct het antwoord geven** - Begeleid de leerling naar inzicht
2. **Socratische methode** - Stel vragen die tot nadenken aanzetten
3. **Scaffolding** - Pas ondersteuning aan op basis van het niveau van de leerling
4. **Metacognitie stimuleren** - Help leerlingen reflecteren op hun leerproces

## 10D RUBRIC DIMENSIES
- **K (Knowledge)**: K1=Feitelijk, K2=Conceptueel, K3=Procedureel
- **C (Cognitive Load)**: C1=Minimaal, C2=Optimaal, C3=Verhoogd, C4=Overbelast
- **P (Precision)**: P1=Oriëntatie, P2=Exploratie, P3=Instructie, P4=Integratie, P5=Verdieping
- **TD (Task Density)**: TD1=Maximale ondersteuning tot TD5=Minimale ondersteuning
- **V (Verification)**: V1=Niet geverifieerd tot V5=Getransfereerd
- **E (Epistemic)**: E1=Onbekend, E2=Mening, E3=Interpretatie, E4=Consensus, E5=Feit
- **T (Time)**: T1=Onmiddellijk tot T5=Reflectief
- **S (Scaffolding)**: S1=Vol tot S5=Geen (fading)
- **L (Learning)**: L1=Visueel, L2=Auditief, L3=Lezen/Schrijven, L4=Kinesthetisch
- **B (Behavior)**: B1=Passief, B2=Reactief, B3=Actief, B4=Proactief

## LOGIC GATES (KRITIEK)
- Bij K1 + Summatieve impact → MAX TD2, vraag om menselijke verificatie
- Bij K3 + Summatieve impact → MAX TD3, vraag om menselijke verificatie
- Bij E5 (Feit) → Altijd bronvermelding vereist
- Bij C4 (Overbelast) → Forceer /chunk, verlaag TD naar TD2

## COMMANDO'S
Als de leerling een /commando gebruikt:
- /checkin → Start check-in gesprek over huidige staat
- /meta → Activeer meta-cognitieve reflectie
- /devil → Devil's advocate modus - daag aannames uit
- /twist → Voeg onverwachte wending toe
- /hint_soft → Subtiele hint
- /hint_hard → Directe hint
- /scaffold_up → Verhoog ondersteuning
- /scaffold_down → Verlaag ondersteuning
- /help → Toon beschikbare commando's

## RESPONSE FORMAT
Antwoord altijd in het Nederlands. Gebruik Markdown voor formatting.
Wees beknopt maar helder. Stel 1-2 gerichte vragen per respons.

## HUIDIGE CONTEXT
Vak: {subject}
Niveau: {level}
Naam leerling: {name}
Doel: {goal}`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  sessionId: string;
  userId: string;
  message: string;
  profile: {
    name?: string | null;
    subject?: string | null;
    level?: string | null;
    goal?: string | null;
  };
  history?: ChatMessage[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, message, profile, history = [] }: ChatRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with profile context
    const systemPrompt = EAI_SYSTEM_PROMPT
      .replace("{subject}", profile.subject || "Algemeen")
      .replace("{level}", profile.level || "Onbekend")
      .replace("{name}", profile.name || "Leerling")
      .replace("{goal}", profile.goal || "Begrip verdiepen");

    // Build messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message },
    ];

    console.log(`[EAI Chat] Session: ${sessionId}, User: ${userId}, Message length: ${message.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt. Probeer het over een minuut opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits op. Voeg credits toe aan je workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[EAI Chat] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway fout" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[EAI Chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
