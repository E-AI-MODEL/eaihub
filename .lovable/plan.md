
# Strategische roadmap — EAIHUB

## Status

Stap 1 en 2 zijn afgerond. Codebase is schoon en conform scope.

---

## Huidige architectuur

1. `generateAnalysis()` in `chatService.ts` — client-side analyse via losse `detect*()` functies (fallback)
2. `eai-classify` edge function — backend-classificatie via Gemini 2.5 Flash (primaire producer)
3. `reliabilityPipeline.ts` — enige bron voor SSOT-healing, G-factor, logic gates, epistemic guard
4. `eaiLearnAdapter.ts` — state-/viewmodel-laag (scaffolding, TTL, history)
5. UI toont afgeleide labels en validaties

---

## Diagnose (oorspronkelijk)

1. ~~**Analyse is client-side en single-label**~~ → opgelost in stap 1 (edge-classificatie)
2. ~~**Dubbele validatie**~~ → opgelost in stap 2 (pipeline = enige inhoudelijke waarheid)
3. **UI toont alleen afgeleide labels** — geen rijke bronconstatering of nuance
4. **Onderwijs zit tussen descriptoren** — single-label is onvoldoende als volledige representatie

---

## Afgesproken volgorde

### Stap 1 — Analyse naar edge function verplaatsen ✅

Aparte `eai-classify` edge function levert gestructureerde 10D-analyse.
Client-side `generateAnalysis()` blijft als verplichte fallback.
Observability via `analysisSource` in `MechanicalState`.

**Status: afgerond**

### Stap 2 — Dubbele validatie opschonen ✅

Alle inhoudelijke validatie (SSOT healing, G-factor, logic gates, command fuzzy-map) geconsolideerd in `reliabilityPipeline.ts`.
`eaiLearnAdapter.ts` teruggebracht tot state/viewmodel-laag.

**Status: afgerond**

### Stap 3 — EAIAnalysis uitbreiden met nuancevelden

Optionele velden: `confidence`, `secondary_bands`, `borderline_dimensions`.
Ontwerp uitgewerkt in `.lovable/stap3.md`.

**Status: ontwerp goedgekeurd — klaar voor implementatie**

### Stap 4 — UI aanpassen

Teacher/Admin/UI laten aansluiten op rijkere analyse.
Pas zinvol zodra de data echt bestaat.

**Status: nog niet gestart — wacht op stap 3**

---

## Wat expliciet buiten scope blijft

- EAIAnalysis uitbreiden zonder producer
- UI refactoren voor data die nog niet bestaat
- Terugkeer naar een centrale formule
- Meerdere stappen tegelijk uitvoeren

---

## Kernprincipe

Constatering → Interpretatie → Beslissing.
De parameterconstatering moet bronlaag blijven.
Elke stap wordt apart ontworpen, goedgekeurd en geïmplementeerd.
