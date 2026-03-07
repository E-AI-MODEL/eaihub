
# Stap 1 — Ontwerp: analyse naar edge function

## Doel

Een apart edge endpoint dat gestructureerde 10D-analyse retourneert op basis van user input + AI response, zodat de client niet langer afhankelijk is van client-side regex/heuristiek.

---

## Huidige situatie

- `eai-chat` streamt tekst via SSE (chat/deep) of retourneert JSON (image)
- Client-side `generateAnalysis()` in `chatService.ts` doet daarna losse `detect*()` calls op de response-tekst
- Resultaat: single-label classificatie per dimensie, geen confidence of nuance

---

## Gekozen mechanisme: apart endpoint

### Waarom apart endpoint (niet inline na stream)

| Criterium | Apart endpoint | Inline na `[DONE]` |
|---|---|---|
| Regressierisico chatflow | Geen — chatflow ongewijzigd | Wijziging in stream-parsing |
| Testbaarheid | Los testbaar | Alleen via volledige chatflow |
| Fallback bij falen | Chat werkt gewoon door | Stream-parsing complexer |
| Latency | Extra call, maar non-blocking | Iets sneller (één flow) |

**Keuze: apart endpoint `eai-classify`**

---

## Endpoint: `eai-classify`

### Input

```typescript
interface ClassifyRequest {
  userMessage: string;       // wat de leerling zei
  aiResponse: string;        // wat het LLM antwoordde
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
```

### Output

```typescript
interface ClassifyResponse {
  analysis: {
    process_phases: string[];
    coregulation_bands: string[];
    task_densities: string[];
    cognitive_mode: string;
    srl_state: string;
    epistemic_status: string;
    active_fix: string | null;
    active_flags: string[];
    reasoning: string;
  };
  model: string;
  source: 'edge';
}
```

**Expliciet NIET in stap 1:**
- `confidence`, `secondaryBand`, `borderline`, `gateReadiness`
- scaffolding-logica
- wijzigingen aan `EAIAnalysis` type

De output-velden zijn een subset van het bestaande `EAIAnalysis` type. Geen nieuwe velden.

### Implementatie

- Gebruikt tool calling om gestructureerde output af te dwingen
- Model: `google/gemini-2.5-flash` (snel, goedkoop, voldoende voor classificatie)
- Geen streaming nodig — standaard JSON response
- `verify_jwt = false` in config.toml

---

## Fallback

```
Client flow:
1. Chat via eai-chat (streaming, ongewijzigd)
2. Na ontvangst AI response → call eai-classify
3. Als eai-classify slaagt → gebruik backend-analyse
4. Als eai-classify faalt → val terug op generateAnalysis()
5. Pipeline (reliabilityPipeline.ts) draait daarna gewoon
```

- `generateAnalysis()` wordt NIET verwijderd
- Client krijgt `analysisSource: 'edge' | 'client'` indicator
- Dit wordt gelogd voor observability

---

## Validatiegrens

- `eai-classify` levert **ruwe analyse**
- Bestaande `reliabilityPipeline.ts` valideert/healt daarna
- `eaiLearnAdapter.ts` bouwt state/viewmodel daarna
- Geen wijzigingen aan validatielagen in stap 1

---

## Bestanden die geraakt worden

| Bestand | Wijziging |
|---|---|
| `supabase/functions/eai-classify/index.ts` | **Nieuw** — classificatie endpoint |
| `supabase/config.toml` | Entry voor `eai-classify` |
| `src/services/chatService.ts` | Na chat-response → call `eai-classify`, fallback behouden |

## Bestanden die NIET geraakt worden

- `src/types/index.ts` — geen typewijzigingen
- `src/lib/reliabilityPipeline.ts` — geen wijzigingen
- `src/utils/eaiLearnAdapter.ts` — geen wijzigingen
- `src/pages/AdminPanel.tsx` — geen UI-wijzigingen
- `src/pages/TeacherCockpit.tsx` — geen UI-wijzigingen
- `supabase/functions/eai-chat/index.ts` — geen wijzigingen

---

## Observability

- `analysisSource` ('edge' | 'client') wordt meegestuurd in `MechanicalState`
- Logline in edge function: model, latency, success/fail
- Hiermee kan later kwaliteit backend vs client vergeleken worden

---

## Acceptatiecriteria

- [ ] `eai-classify` retourneert geldige analyse bij geldige input
- [ ] Chatflow via `eai-chat` werkt ongewijzigd
- [ ] Bij falen van `eai-classify` werkt fallback naar `generateAnalysis()`
- [ ] `analysisSource` wordt gelogd
- [ ] Pipeline draait ongewijzigd na analyse
- [ ] Build blijft groen
- [ ] Geen wijzigingen aan types, UI, of validatielagen
