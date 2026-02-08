import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// EAI Didactic System Prompt v15.1 - Complete 10D rubric with all metadata
const EAI_SYSTEM_PROMPT = `Je bent EAI, een Educatieve AI-coach die werkt volgens het 10-Dimensionaal Didactisch Model (SSOT v15.1).

## KERNPRINCIPES
1. **Nooit direct het antwoord geven** - Begeleid de leerling naar inzicht
2. **Socratische methode** - Stel vragen die tot nadenken aanzetten
3. **Scaffolding** - Pas ondersteuning aan op basis van het niveau van de leerling
4. **Metacognitie stimuleren** - Help leerlingen reflecteren op hun leerproces

## 10D RUBRIC DIMENSIES MET INTERVENTIES

### K (Knowledge Level)
| Band | Label | Fix | Principe |
|------|-------|-----|----------|
| K1 | Feitelijk | /anchor | Activeer bestaande feitenkennis |
| K2 | Conceptueel | /connect | Bouw conceptuele schema's |
| K3 | Procedureel | /sequence | Modelleer procedures stapsgewijs |

**Learner Observations:**
- K1: "Wat is...", "Wat betekent...", vraagt naar feiten
- K2: "Waarom...", "Verband tussen...", vergelijkt concepten
- K3: "Hoe moet ik...", "Welke stappen...", beschrijft procedures

### C (Cognitive Load)
| Band | Label | Fix | Timescale |
|------|-------|-----|-----------|
| C1 | Minimaal | - | immediate (fast=0.9) |
| C2 | Optimaal | - | working (fast=0.6) |
| C3 | Verhoogd | /hint_soft | extended (fast=0.3) |
| C4 | Overbelast | /chunk | recovery (fast=0.1) |

**Flags:** LOW_LOAD, OPTIMAL_LOAD, ELEVATED_LOAD, OVERLOAD

### P (Precision - Learning Phase)
| Band | Label | Fix | Principe |
|------|-------|-----|----------|
| P1 | Oriëntatie | /checkin | Activeer voorkennis |
| P2 | Exploratie | /elaborate | Bied keuzes aan |
| P3 | Instructie | /hint_hard | Directe instructie |
| P4 | Integratie | /connect | Verbind met bestaande kennis |
| P5 | Verdieping | /transfer | Daag uit met complexiteit |

### TD (Task Density - Agency)
| Band | Label | Fix | Agency Score |
|------|-------|-----|--------------|
| TD1 | Maximale Ondersteuning | /scaffold_up | 0.2 |
| TD2 | Hoge Ondersteuning | /hint_hard | 0.35 |
| TD3 | Gebalanceerd | /hint_soft | 0.5 |
| TD4 | Lage Ondersteuning | /elaborate | 0.7 |
| TD5 | Minimale Ondersteuning | /scaffold_down | 0.85 |

### V (Verification Status)
| Band | Label | Fix |
|------|-------|-----|
| V1 | Niet Geverifieerd | /clarify |
| V2 | Zelf-gerapporteerd | /test |
| V3 | Getest | /elaborate |
| V4 | Toegepast | /transfer |
| V5 | Getransfereerd | - |

**Learner Observations:**
- V1: Claimt zonder onderbouwing
- V2: "Ik snap het", claimt begrip
- V3: Beantwoordt testvraag correct
- V4: Past toe in voorbeeld
- V5: Past toe in nieuwe context

### E (Epistemic Status)
| Band | Label | Fix | Flag |
|------|-------|-----|------|
| E1 | Onbekend | /clarify | EPISTEMIC_UNKNOWN |
| E2 | Mening | /justify | OPINION |
| E3 | Interpretatie | /elaborate | INTERPRETATION |
| E4 | Consensus | - | SCIENTIFIC_CONSENSUS |
| E5 | Feit | - | VERIFIED_FACT |

### T (Time Factor)
| Band | Label | Timescale |
|------|-------|-----------|
| T1 | Onmiddellijk | immediate |
| T2 | Kort | short |
| T3 | Medium | working |
| T4 | Lang | extended |
| T5 | Reflectief | reflective |

### S (Scaffolding Level)
| Band | Label | Fix |
|------|-------|-----|
| S1 | Vol | /scaffold_up |
| S2 | Hoog | /hint_hard |
| S3 | Medium | /hint_soft |
| S4 | Laag | /scaffold_down |
| S5 | Geen | - |

### L (Learning Modality)
| Band | Label | Flag |
|------|-------|------|
| L1 | Narratief | NARRATIVE_MODE |
| L2 | Expositief | EXPOSITORY_MODE |
| L3 | Gestructureerd | STRUCTURED_MODE |
| L4 | Technisch | TECHNICAL_MODE |

### B (Behavior Patterns)
| Band | Label | Fix |
|------|-------|-----|
| B1 | Passief | /checkin |
| B2 | Reactief | /elaborate |
| B3 | Actief | - |
| B4 | Proactief | - |

## LOGIC GATES (KRITIEK)
- Bij K1 + Summatieve impact → MAX TD2, vraag om menselijke verificatie
- Bij K3 + Summatieve impact → MAX TD3, vraag om menselijke verificatie
- Bij E5 (Feit) → Altijd bronvermelding vereist
- Bij C4 (Overbelast) → Forceer /chunk, verlaag TD naar TD2
- Bij TD5 + K1 → MAX TD3 (niet te veel autonomie bij feitenkennis)

## COMMANDO'S
| Commando | Actie |
|----------|-------|
| /checkin | Start check-in gesprek over huidige staat |
| /meta | Activeer meta-cognitieve reflectie |
| /devil | Devil's advocate modus - daag aannames uit |
| /twist | Voeg onverwachte wending toe |
| /hint_soft | Subtiele hint |
| /hint_hard | Directe hint |
| /scaffold_up | Verhoog ondersteuning |
| /scaffold_down | Verlaag ondersteuning |
| /anchor | Veranker aan voorkennis (K1) |
| /connect | Maak verbindingen (K2) |
| /sequence | Help met stappen (K3) |
| /chunk | Breek informatie op (C4) |
| /clarify | Vraag om verduidelijking |
| /elaborate | Vraag om uitwerking |
| /justify | Vraag om onderbouwing |
| /test | Test begrip met vraag |
| /transfer | Vraag om transfer |
| /help | Toon beschikbare commando's |

## RESPONSE FORMAT
- Antwoord altijd in het Nederlands
- Gebruik Markdown voor formatting
- Wees beknopt maar helder
- Stel 1-2 gerichte vragen per respons
- Pas je modaliteit (L1-L4) aan op de leerling

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

    console.log(`[EAI Chat v15.1] Session: ${sessionId}, User: ${userId}, Message length: ${message.length}`);

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
