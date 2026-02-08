
# EAI Hub - Fine-Tuning Plan (Micro & Nano Niveau)

## Status Check Resultaten

### ✅ Endpoints Werkend
| Endpoint | Status | Response |
|----------|--------|----------|
| `/functions/v1/eai-chat` | ✅ 200 OK | Streaming SSE actief |
| Lovable AI Gateway | ✅ Actief | `google/gemini-3-flash-preview` |
| LOVABLE_API_KEY | ✅ Geconfigureerd | Secret aanwezig |

### ✅ Core Infrastructure
- **Supabase Project**: `fmgrjsjsrbtmybdiywxf` - Operationeel
- **Edge Function Logs**: Geen errors, boot time 22ms
- **CORS Headers**: Correct geconfigureerd
- **Streaming**: SSE chunks worden correct geparsed

---

## Geïdentificeerde Verbeterpunten

### NIVEAU 1: KRITIEK (Micro)

#### 1.1 Edge Function - Token Counting Incorrect
**Locatie**: `supabase/functions/eai-chat/index.ts`
**Probleem**: Geen echte token counting - client-side schatting is onnauwkeurig
**Fix**: Token counts uit de AI Gateway response extracten (al beschikbaar in `usage` object)

#### 1.2 History Truncation Race Condition
**Locatie**: `src/services/chatService.ts` regel 99
**Probleem**: Edge function sliced naar 10 messages, client naar 20 - inconsistentie
**Fix**: Uniform maken naar 10 in beide locaties

#### 1.3 Missing Error Toast voor Rate Limits
**Locatie**: `src/services/chatService.ts`
**Probleem**: 429/402 errors worden niet als toast getoond
**Fix**: Toast integration toevoegen bij rate limit detection

### NIVEAU 2: HIGH (Micro)

#### 2.1 Analysis Generation - Hardcoded Values
**Locatie**: `src/services/chatService.ts` regel 274-299
**Probleem**: `generateAnalysis()` retourneert statische bands (K2, C2, P3)
**Fix**: AI laten returnen via structured output OF post-process analyse

#### 2.2 Dashboard - Missing Secondary Dimensions Parsing
**Locatie**: `src/components/Dashboard.tsx` regel 69-81
**Probleem**: `secondary_dimensions` worden niet volledig geparsed naar alle 10 dimensies
**Fix**: Complete dimension extraction uit alle band arrays

#### 2.3 ProfileSetup - Missing Cancel Button Visibility
**Locatie**: `src/components/ProfileSetup.tsx`
**Probleem**: `onCancel` prop bestaat maar knop is niet zichtbaar in UI
**Fix**: Cancel button toevoegen indien `onCancel` prop aanwezig

### NIVEAU 3: MEDIUM (Nano)

#### 3.1 ChatInterface - Idle Timer Memory Leak Prevention
**Locatie**: `src/components/ChatInterface.tsx` regel 53-79
**Probleem**: Timer cleanup kan beter met useRef pattern
**Fix**: Optimaliseer cleanup logic

#### 3.2 Message ID Generation
**Locatie**: `src/components/ChatInterface.tsx` regel 84, 104
**Probleem**: `Date.now()` kan duplicaten genereren bij snelle berichten
**Fix**: UUID of crypto.randomUUID() gebruiken

#### 3.3 Dashboard Agency Score Display
**Locatie**: `src/components/Dashboard.tsx` regel 156-160
**Probleem**: Gradient bar toont niet correct bij lage scores
**Fix**: Minimum width toevoegen voor visibility

### NIVEAU 4: POLISH (Nano)

#### 4.1 MessageBubble - KaTeX CSS Missing
**Locatie**: `src/components/MessageBubble.tsx`
**Probleem**: KaTeX CSS niet geïmporteerd - math formulas render niet correct
**Fix**: KaTeX CSS import toevoegen in main.tsx of MessageBubble

#### 4.2 SSOT Browser - Live Data
**Locatie**: `src/pages/AdminPanel.tsx`
**Probleem**: Hardcoded mock data i.p.v. live SSOT_DATA
**Fix**: Import en display van echte SSOT rubrics

#### 4.3 Edge Function - Model Name Hardcoded
**Locatie**: `supabase/functions/eai-chat/index.ts` regel 112
**Probleem**: Model "google/gemini-3-flash-preview" is hardcoded
**Fix**: Environment variable of request parameter maken

---

## Implementatie Plan

### Fase A: Kritieke Fixes (15 min)
1. Synchroniseer history truncation limits
2. Voeg toast errors toe voor rate limits
3. Fix token counting in chatService

### Fase B: Analyse Verbetering (20 min)
1. Verbeter `generateAnalysis()` met content-aware heuristieken
2. Fix Dashboard dimension parsing
3. Voeg cancel button toe aan ProfileSetup

### Fase C: Polish & Stability (15 min)
1. UUID voor message IDs
2. KaTeX CSS import
3. Admin Panel live SSOT data
4. Agency score minimum width

### Fase D: Optional Enhancements
1. AI-gegenereerde analysis via tool calling
2. Model selection parameter
3. Real-time telemetry in Admin

---

## Technische Wijzigingen per Bestand

```text
supabase/functions/eai-chat/index.ts
├── Lijn 112: Model naar env variable
└── Return: Usage stats doorgeven

src/services/chatService.ts
├── Lijn 20: History limit → 10 (sync met edge function)
├── Lijn 39-41: Toast import + rate limit handling
├── Lijn 116-119: Token counts uit response halen
└── Lijn 274-299: generateAnalysis() verbeteren

src/components/ChatInterface.tsx
├── Lijn 40: sessionId → crypto.randomUUID()
├── Lijn 84, 104: Message ID → crypto.randomUUID()
└── Lijn 53-79: Timer cleanup optimalisatie

src/components/Dashboard.tsx
├── Lijn 69-81: Complete dimension extraction
└── Lijn 156-160: Min-width voor agency bar

src/components/ProfileSetup.tsx
└── Lijn 244-261: Cancel button visibility fix

src/components/MessageBubble.tsx
└── Lijn 1-10: KaTeX CSS import

src/main.tsx of src/index.css
└── KaTeX CSS import toevoegen

src/pages/AdminPanel.tsx
├── Lijn 15-26: SSOT_DATA import
└── Lijn 118-145: Live rubric data rendering
```

---

## Verwacht Resultaat
Na implementatie:
- **Betrouwbaarder**: Consistente history, correcte token counts
- **Betere UX**: Toast feedback bij errors, werkende math formulas
- **Live Data**: Admin panel toont echte SSOT configuratie
- **Stabiel**: Geen memory leaks, unieke message IDs
