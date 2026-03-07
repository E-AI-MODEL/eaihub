
# Stap 1 — Ontwerp: analyse naar edge function

## Doel

De `eai-chat` edge function retourneert naast streaming tekst ook een gestructureerde 10D-analyse, zodat de client niet langer afhankelijk is van client-side regex/heuristiek.

---

## Huidige situatie

- `eai-chat` edge function streamt tekst via SSE (chat/deep) of retourneert JSON (image)
- Client-side `generateAnalysis()` in `chatService.ts` doet daarna losse `detect*()` calls op de tekst
- Resultaat: single-label classificatie per dimensie, geen confidence of nuance

---

## Gewenst resultaat

Na stap 1 levert de edge function:

1. **Streaming tekst** — ongewijzigd, zoals nu
2. **Gestructureerd analyse-blok** — als apart JSON-object na de stream

---

## Voorgesteld mechanisme

### Optie A: JSON-blok na `[DONE]` marker (aanbevolen)

Na de SSE-stream stuurt de edge function een extra `data:` event met een `analysis` payload:

```
data: {"choices":[{"delta":{"content":"..."}}]}
data: {"choices":[{"delta":{"content":"..."}}]}
data: [DONE]
data: {"eai_analysis": { ... }}
```

**Voordelen:**
- Geen apart endpoint nodig
- Client kan bestaande stream-parsing behouden
- Analyse komt pas als de volledige tekst beschikbaar is voor het LLM

**Nadelen:**
- Client moet `[DONE]` event opvangen en daarna nog één event lezen

### Optie B: Apart endpoint (`eai-classify`)

Een tweede edge function die alleen analyse retourneert.

**Voordelen:**
- Schone scheiding
- Kan los getest worden

**Nadelen:**
- Dubbele LLM-call (of caching nodig)
- Meer latency
- Extra infrastructuur

**Keuze: Optie A** — minimale wijziging, geen dubbele calls.

---

## Analyse-payload (minimaal)

Het LLM krijgt via tool calling een gestructureerd antwoord terug. Minimale velden voor stap 1:

```typescript
interface EdgeAnalysis {
  process_phases: string[];        // bestaand
  coregulation_bands: string[];    // bestaand
  task_densities: string[];        // bestaand
  cognitive_mode: string;          // bestaand
  srl_state: string;               // bestaand
  epistemic_status: string;        // bestaand
  active_fix: string | null;       // bestaand
  reasoning: string;               // korte onderbouwing van het LLM
}
```

**Expliciet NIET in stap 1:**
- `confidence`
- `secondaryBand`
- `borderline`
- `gateReadiness`
- scaffolding-logica

Die komen pas in stap 3.

---

## Fallback

- Als de edge function geen `eai_analysis` event stuurt (timeout, fout), valt de client terug op de bestaande `generateAnalysis()` in `chatService.ts`
- `generateAnalysis()` wordt NIET verwijderd in stap 1
- Client krijgt een `analysisSource: 'edge' | 'client'` indicator

---

## Bestanden die geraakt worden in stap 1

| Bestand | Wijziging |
|---|---|
| `supabase/functions/eai-chat/index.ts` | Tool calling toevoegen voor analyse na streaming |
| `src/services/chatService.ts` | Parse `eai_analysis` event na `[DONE]`, fallback behouden |

**Bestanden die NIET geraakt worden:**
- `src/types/index.ts` — geen typewijzigingen
- `src/lib/reliabilityPipeline.ts` — geen wijzigingen
- `src/utils/eaiLearnAdapter.ts` — geen wijzigingen
- `src/pages/AdminPanel.tsx` — geen UI-wijzigingen
- `src/pages/TeacherCockpit.tsx` — geen UI-wijzigingen

---

## Implementatiestappen (bij goedkeuring)

1. Tool-calling schema toevoegen aan `eai-chat` edge function
2. Na streaming response, tweede (non-streaming) call doen voor analyse
3. Analyse meesturen als extra SSE event na `[DONE]`
4. `chatService.ts` aanpassen om `eai_analysis` event te parsen
5. Fallback op `generateAnalysis()` behouden
6. Testen: edge function retourneert geldige analyse + chat blijft werken

---

## Acceptatiecriteria

- [ ] Edge function retourneert `eai_analysis` na stream
- [ ] Bestaande chatflow werkt ongewijzigd
- [ ] Bij falen van analyse werkt fallback naar client-side
- [ ] Build blijft groen
- [ ] Geen wijzigingen aan types, UI, of validatielagen
