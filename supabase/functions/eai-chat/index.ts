import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

## RESPONSE FORMAT
- Antwoord altijd in het Nederlands
- Gebruik Markdown voor formatting
- Wees beknopt maar helder
- Stel 1-2 gerichte vragen per respons`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

type TaskType = "chat" | "deep" | "image";

interface CurriculumContext {
  title?: string;
  description?: string;
  didactic_focus?: string;
  mastery_criteria?: string;
  common_misconceptions?: string[];
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
  systemPrompt?: string;
  history?: ChatMessage[];
  taskType?: TaskType;
  curriculumContext?: CurriculumContext;
}

// ═══ MODEL ROUTER ═══
// Didactisch-gedreven: model keuze volgt uit pedagogische context
const MODEL_CONFIG: Record<TaskType, {
  model: string;
  temperature: number;
  max_tokens: number;
  stream: boolean;
  modalities?: string[];
}> = {
  chat: {
    model: "google/gemini-3-flash-preview",
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  },
  deep: {
    model: "google/gemini-2.5-pro",
    temperature: 0.5,
    max_tokens: 2048,
    stream: true,
  },
  image: {
    model: "google/gemini-2.5-flash-image",
    temperature: 0.8,
    max_tokens: 1024,
    stream: false,
    modalities: ["image", "text"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, message, profile, systemPrompt, history = [], taskType = "chat" }: ChatRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const config = MODEL_CONFIG[taskType] || MODEL_CONFIG.chat;
    const finalSystemPrompt = systemPrompt || FALLBACK_SYSTEM_PROMPT;

    console.log(`[EAI Chat] Session: ${sessionId}, TaskType: ${taskType}, Model: ${config.model}, Prompt: ${systemPrompt ? 'dynamic' : 'fallback'}`);

    // ═══ IMAGE GENERATION PATH ═══
    if (taskType === "image") {
      const imagePrompt = message.replace(/^\/beeld\s*/i, "").trim();
      const educationalPrompt = `Maak een helder, educatief diagram of illustratie van: ${imagePrompt}. Context: vak=${profile.subject || "algemeen"}, niveau=${profile.level || "onbekend"}. Stijl: clean, informatief, geschikt voor onderwijs. Gebruik duidelijke labels in het Nederlands waar relevant.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "user", content: educationalPrompt },
          ],
          modalities: config.modalities,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[EAI Chat] Image generation error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Afbeelding genereren mislukt", taskType: "image" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const textContent = data.choices?.[0]?.message?.content || "";

      if (!imageData) {
        return new Response(
          JSON.stringify({ 
            text: textContent || "Ik kon geen afbeelding genereren. Probeer een andere beschrijving.",
            taskType: "image",
            model: config.model,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upload to Supabase Storage
      let publicUrl = imageData; // fallback: return base64 directly
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Decode base64 to bytes
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `${sessionId}/${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("eai-images")
          .upload(fileName, bytes, { contentType: "image/png", upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("eai-images").getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        } else {
          console.error("[EAI Chat] Storage upload error:", uploadError);
        }
      } catch (storageErr) {
        console.error("[EAI Chat] Storage error, returning base64:", storageErr);
      }

      return new Response(
        JSON.stringify({
          text: `${textContent}\n\n![${imagePrompt}](${publicUrl})`,
          imageUrl: publicUrl,
          taskType: "image",
          model: config.model,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══ CHAT / DEEP PATH (streaming) ═══
    const messages: ChatMessage[] = [
      { role: "system", content: finalSystemPrompt },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: config.stream,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
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
