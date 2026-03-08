
# Strategische roadmap — EAIHUB

## Status

Stap 1–7 afgerond. Fase 1–5 gedefinieerd voor stabilisatie, consistentie en EITL.

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

## Implementatieplan — 5 fasen

### Fase 1 — Stabilisatie (security + healing)

| # | Taak | Impact | Status |
|---|------|--------|--------|
| 1.1 | **RLS verscherpen** op `chat_messages`, `student_sessions`, `mastery`, `teacher_messages` | High | ✅ DONE |
|     | Student: eigen data (`auth.uid() = user_id`) | | |
|     | Docent: leesrechten via `has_role(auth.uid(), 'DOCENT')` | | |
|     | Admin: volledige toegang via `has_role(auth.uid(), 'ADMIN')` | | |
|     | _Fix: eerste migratie maakte RESTRICTIVE policies (AND-logica); gecorrigeerd naar PERMISSIVE (OR-logica)_ | | |
| 1.2 | **Healing consolideren** — `healAnalysisToSSOT()` en `validateAnalysisAgainstSSOT()` samenvoegen tot één `normalizeAnalysisToSSOT()` met fuzzy-map | Medium | TODO |
|     | Admin audit gebruikt dezelfde functie in strict mode | | |

### Fase 2 — Analyse-consistentie

| # | Taak | Impact | Status |
|---|------|--------|--------|
| 2.1 | **Edge-classify uitbreiden** — `secondary_dimensions` toevoegen aan tool-calling schema zodat alle 10D door LLM worden geclassificeerd | Medium | TODO |
| 2.2 | **E-dimensie aansluiten op SSOT** — `ePatterns` toevoegen aan `detectEpistemicStatus()` naast bestaande regex | Low-Medium | TODO |
| 2.3 | **Logic gate check vereenvoudigen** — dubbele gate-check verwijderen uit `executePipeline()` | Low | TODO |

### Fase 3 — EITL: SSOT plug-in architectuur

Gedetailleerd ontwerp: `.lovable/stap8-eitl.md`

| # | Taak | Status |
|---|------|--------|
| 3.1 | **`school_ssot` tabel** + RLS (admins CRUD, docenten SELECT) | TODO |
| 3.2 | **`ssotRuntime.ts`** — `loadEffectiveSSOT(schoolId?)` met whitelisted merge | TODO |
| 3.3 | **`ssotValidator.ts`** — drielaags Zod-validatie (schema, referentieel, runtime) | TODO |
| 3.4 | **Admin EITL Wizard** — 5-staps flow, alleen plugin-allowed velden | TODO |

### Fase 4 — Governance

| # | Taak | Status |
|---|------|--------|
| 4.1 | **Versioning** — elke plugin-save als nieuwe rij met `change_notes` en `based_on_version` | TODO |
| 4.2 | **Rollback** — admin kan eerdere plugin-versie activeren | TODO |
| 4.3 | **Audit log** — `ssot_changes` tabel (who, when, what changed) | TODO |
| 4.4 | **Diff-view** — base vs effective SSOT vergelijking in admin | TODO |

### Fase 5 — Observability

| # | Taak | Status |
|---|------|--------|
| 5.1 | Edge vs client analyse-ratio in dashboard | TODO |
| 5.2 | Plugin-usage metrics per school | TODO |
| 5.3 | Logic gate breach rate trending | TODO |
| 5.4 | Healing event frequentie | TODO |

---

## Bekende technische schuld

| # | Issue | Impact | Fase |
|---|-------|--------|------|
| 1 | Dubbele healing: fuzzy-map ontbreekt in `healAnalysisToSSOT` | Medium | 1.2 |
| 2 | E-dimensie mist SSOT learner_obs patronen | Low-Medium | 2.2 |
| 3 | Edge classify mist `secondary_dimensions` in schema | Medium | 2.1 |
| 4 | Mixed dimensions in `coregulation_bands` veld | Low | documenteren of refactor bij EITL |
| 5 | Logic gate check dubbel uitgevoerd in pipeline | Low | 2.3 |
| 6 | RLS open (`true`) op 4 datatafels | High | 1.1 |
| 7 | Token schatting is character-based proxy | Low | 5.x of labelen |
| 8 | `COMMAND_INTENTS` hardcoded in `ssotHelpers.ts` | Low | 3.x (verplaatsen naar plugin-laag) |

---

## Wat expliciet buiten scope blijft

- Volledige vervanging van de SSOT per school (alleen overlay)
- Generieke deep merge (alleen whitelisted paden)
- Structurele of machinekritische velden in de plugin-laag
- Meerdere fasen tegelijk uitvoeren
- `tiktoken` (Python-only) — indien nodig: `gpt-tokenizer` (npm) of proxy-label

---

## Kernprincipe

Constatering → Interpretatie → Beslissing.
De base SSOT blijft constitutieve bronlaag.
De plugin annoteert, maar herdefinieert niet.
Stabilisatie vóór uitbreiding.
