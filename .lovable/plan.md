
# Strategische roadmap — EAIHUB

## Status

Stap 1–7 afgerond. Stap 8 (EITL) ontworpen en goedgekeurd — klaar voor implementatie.

---

## Huidige architectuur

1. `eai-classify` edge function — primaire 10D-classificatie via Gemini (tool-calling schema)
2. `generateAnalysis()` in `chatService.ts` — client-side fallback via regex/heuristics
3. `reliabilityPipeline.ts` — enige bron voor SSOT-healing, G-factor, logic gates, epistemic guard
4. `eaiLearnAdapter.ts` — state-/viewmodel-laag (scaffolding, TTL, history)
5. `ssot_v15.json` + `ssot.ts` — statische SSOT singleton met typed helpers
6. Auth via Supabase: `user_roles` (LEERLING/DOCENT/ADMIN), `has_role()` SECURITY DEFINER, `AuthGuard`
7. Persistentie: `chat_messages`, `student_sessions`, `mastery`, `teacher_messages`, `profiles`

---

## Afgeronde stappen

### Stap 1 — Analyse naar edge function ✅
### Stap 2 — Dubbele validatie opschonen ✅
### Stap 3 — EAIAnalysis uitbreiden met nuancevelden ✅
### Stap 4 — UI aanpassen op rijkere analyse ✅
### Stap 5 — Leerlingervaring en Leskaart-context ✅
### Stap 6 — Kwaliteitszichtbaarheid per rol ✅
### Stap 7 — Veilig rollenmodel en Auth ✅

---

## Volgende stap

### Stap 8 — EITL: School-specifieke SSOT-configuratie

Schoolspecifieke contextualisering via een controlled plugin/overlay op de base SSOT.
Gedetailleerd ontwerp: `.lovable/stap8-eitl.md`

**Substappen:**

| Sub | Omschrijving | Status |
|-----|-------------|--------|
| 8a | `school_ssot` tabel + `loadEffectiveSSOT()` met whitelisted merge | ontwerp klaar |
| 8b | `ssotValidator.ts` — drielaags Zod-validatie | ontwerp klaar |
| 8c | Admin EITL Wizard (5-staps vraag-antwoord flow) | ontwerp klaar |
| 8d | Governance: versioning, rollback, diff-view | ontwerp klaar |

---

## Bekende technische schuld

| # | Issue | Impact | Ref |
|---|-------|--------|-----|
| 1 | Dubbele healing: fuzzy-map ontbreekt in `healAnalysisToSSOT` | Medium | `reliabilityPipeline.ts:108` vs `:487` |
| 2 | E-dimensie mist SSOT learner_obs patronen | Low-Medium | `chatService.ts:782` |
| 3 | Edge classify mist `secondary_dimensions` in schema | Medium | `eai-classify/index.ts` |
| 4 | Mixed dimensions in `coregulation_bands` veld | Low | `chatService.ts:1076` |
| 5 | Logic gate check dubbel uitgevoerd in pipeline | Low | `reliabilityPipeline.ts:575-585` |
| 6 | RLS open (`true`) op 4 datatafels | High | chat_messages, student_sessions, mastery, teacher_messages |
| 7 | Token schatting is character-based proxy | Low | `chatService.ts` |
| 8 | `COMMAND_INTENTS` hardcoded in `ssotHelpers.ts` | Low | relevant bij EITL |

---

## Wat expliciet buiten scope blijft

- Volledige vervanging van de SSOT per school (alleen overlay)
- Generieke deep merge (alleen whitelisted paden)
- Structurele of machinekritische velden in de plugin-laag
- Meerdere stappen tegelijk uitvoeren

---

## Kernprincipe

Constatering → Interpretatie → Beslissing.
De base SSOT blijft constitutieve bronlaag.
De plugin annoteert, maar herdefinieert niet.
