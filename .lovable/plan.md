

## Plan: Didactisch-gedreven Model Router

### Kern-idee

De router zit **in de edge function** en wordt aangestuurd door een `taskType` die de **client bepaalt op basis van didactische condities**. Geen aparte edge functions, geen verstoring van de bestaande flow. De client stuurt al een `systemPrompt` en `history` — er komt simpelweg een `taskType` veld bij.

### Routing-regels (didactisch gemotiveerd)

| Conditie | taskType | Model | Waarom |
|----------|----------|-------|--------|
| Default (95% van berichten) | `chat` | `gemini-3-flash-preview` | Snel, goedkoop, goed genoeg voor standaard didactiek |
| K3 metacognitie + turn_count > 3 | `deep` | `gemini-2.5-pro` | Metacognitieve begeleiding vereist genuanceerd redeneren |
| Bericht bevat `/beeld` | `image` | `gemini-2.5-flash-image` | Beeldgeneratie |
| Geen wijziging aan streaming, error handling, of prompt-logica | — | — | Alles blijft hetzelfde behalve model-selectie |

### Wijzigingen

**1. `supabase/functions/eai-chat/index.ts`** — Model-router toevoegen

- `ChatRequest` interface krijgt optioneel veld `taskType?: 'chat' | 'deep' | 'image'`
- Router-map bepaalt model + parameters:
  - `chat` → `gemini-3-flash-preview`, stream=true, temp=0.7, max_tokens=1024
  - `deep` → `gemini-2.5-pro`, stream=true, temp=0.5, max_tokens=2048 (lager temp voor preciezer redeneren)
  - `image` → `gemini-2.5-flash-image`, stream=false, modalities=["image","text"], temp=0.8
- Voor `image`: base64 response opslaan in Supabase Storage bucket, publieke URL teruggeven als JSON (niet als SSE stream)
- Logging: `[EAI Chat] Model: ${selectedModel}, TaskType: ${taskType}`

**2. `src/services/chatService.ts`** — TaskType bepalen op basis van analyse

- Nieuwe functie `determineTaskType(message, sessionContext)`:
  - Als bericht start met `/beeld` → `'image'`
  - Als `sessionContext.knowledge_trajectory` bevat K3 **en** `turn_count > 3` → `'deep'`
  - Anders → `'chat'`
- `taskType` meesturen in de request body naar de edge function
- `MechanicalState.model` updaten met het daadwerkelijk gebruikte model (komt terug van edge function of wordt lokaal gezet)

**3. Database migratie** — Storage bucket voor gegenereerde afbeeldingen

- Bucket `eai-images` aanmaken, publiek leesbaar
- Geen nieuwe tabel nodig; de image URL wordt opgeslagen als gewoon bericht in `chat_messages`

**4. `src/components/MessageBubble.tsx`** — Afbeeldingen in chat renderen

- ReactMarkdown `img` component toevoegen met styling (max-width, rounded corners, loading state)
- Detectie van `![...](...eai-images...)` in model-berichten

### Wat NIET verandert

- De system prompt generatie (`ssotHelpers.ts`) — ongewijzigd
- De streaming logica voor `chat` en `deep` — identiek pad
- De reliability pipeline — draait na ontvangst, onafhankelijk van model
- De `SessionContext` tracker — levert input voor routing maar wordt zelf niet aangepast
- Bestaande tabellen en RLS policies

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/eai-chat/index.ts` | Router-map, taskType parameter, image-handling met storage upload |
| `src/services/chatService.ts` | `determineTaskType()` functie, taskType meesturen |
| `supabase/migrations/` | Storage bucket `eai-images` |
| `src/components/MessageBubble.tsx` | Custom `img` renderer in ReactMarkdown |

