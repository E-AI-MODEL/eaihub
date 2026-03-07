
# Strategische roadmap — EAIHUB

## Status

Analyse en roadmap. Geen directe codewijziging.
Codebase is schoon en conform scope.

---

## Huidige architectuur

1. `generateAnalysis()` in `chatService.ts` — client-side analyse via losse `detect*()` functies
2. `reliabilityPipeline.ts` — SSOT-healing, epistemic guard, semantic validation
3. `eaiLearnAdapter.ts` — interpretatie-/toestandlaag
4. UI toont afgeleide labels en validaties

---

## Diagnose

1. **Geen centrale formule** — losse detectie per dimensie, daarna constraints, validatie, UI-afleiding
2. **Analyse is client-side en single-label** — geen confidence, geen secondary band, geen overgangsstatus
3. **Dubbele validatie** — overlap tussen `reliabilityPipeline.ts` en `eaiLearnAdapter.ts` (technische schuld)
4. **UI toont alleen afgeleide labels** — geen rijke bronconstatering of nuance
5. **Onderwijs zit tussen descriptoren** — single-label is onvoldoende als volledige representatie

---

## Afgesproken volgorde

### Stap 1 — Analyse naar edge function verplaatsen

De edge function moet naast tekst ook gestructureerde analyse retourneren.
Pas dan ontstaat een rijke bronlaag.

**Status: nog niet gestart — eerst ontwerp uitwerken**

### Stap 2 — Dubbele validatie opschonen

Overlap tussen `reliabilityPipeline.ts` en `eaiLearnAdapter.ts` terugbrengen.
Één hoofdpad voor validatie; tweede laag alleen als state-/viewmodel.

**Status: nog niet gestart — wacht op stap 1**

### Stap 3 — EAIAnalysis uitbreiden met nuancevelden

Velden als `confidence`, `secondaryBand`, `borderline`, `gateReadiness`.
Pas zinvol als de producer rijker is en validatie opgeschoond.

**Status: nog niet gestart — wacht op stap 2**

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
