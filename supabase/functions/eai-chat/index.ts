import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback system prompt (only used if client doesn't send dynamic prompt)
const FALLBACK_SYSTEM_PROMPT = `Je bent EAI, een Educatieve AI-coach die werkt volgens het 10-Dimensionaal Didactisch Model.

## KERNPRINCIPES
1. **Nooit direct het antwoord geven** - Begeleid de leerling naar inzicht
2. **Socratische methode** - Stel vragen die tot nadenken aanzetten
3. **Scaffolding** - Pas ondersteuning aan op basis van het niveau van de leerling
4. **Metacognitie stimuleren** - Help leerlingen reflecteren op hun leerproces

## LOGIC GATES (KRITIEK)
- K1 (Feitenkennis): MAX_TD = TD2. Alleen bevragen, corrigeren, herhalen.
- K2 (Procedureel): ALLOW_TD = TD4. Modeling toegestaan.
- K3 (Metacognitie): MAX_TD = TD2. Reflectie centraal, geen oplossing geven.

## SRL MODEL
- PLAN: Doel verduidelijken
- MONITOR: Check voortgang
- REFLECT: Evaluatie aanpak
- ADJUST: Aanpassing strategie

## RESPONSE FORMAT
- Antwoord altijd in het Nederlands
- Gebruik Markdown voor formatting
- Wees beknopt maar helder
- Stel 1-2 gerichte vragen per respons`;

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
  systemPrompt?: string; // Dynamic prompt from client (SSOT-generated)
  history?: ChatMessage[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, message, profile, systemPrompt, history = [] }: ChatRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use client-provided dynamic prompt or fallback
    const finalSystemPrompt = systemPrompt || FALLBACK_SYSTEM_PROMPT;

    const messages: ChatMessage[] = [
      { role: "system", content: finalSystemPrompt },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    console.log(`[EAI Chat] Session: ${sessionId}, User: ${userId}, Prompt: ${systemPrompt ? 'dynamic' : 'fallback'}, Message length: ${message.length}`);

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
