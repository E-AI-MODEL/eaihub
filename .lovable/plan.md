
# Strategische roadmap — EAIHUB

## Status

Stap 1–7 afgerond. Fase 1 (stabilisatie) en Fase 2 (analyse-consistentie) afgerond. Fase 3 (EITL plugin-architectuur) afgerond. Fase 3.5–5 gedefinieerd.

---

## Huidige architectuur

1. `eai-classify` edge function — primaire 10D-classificatie via Gemini (tool-calling schema)
2. `generateAnalysis()` in `chatService.ts` — client-side fallback via regex/heuristics
3. `reliabilityPipeline.ts` — enige bron voor SSOT-healing, G-factor, logic gates, epistemic guard
4. `eaiLearnAdapter.ts` — state-/viewmodel-laag (scaffolding, TTL, history)
5. `ssot_v15.json` + `ssot.ts` — statische SSOT singleton met typed helpers, **nu via `getEffectiveSSOT()`**
6. `ssotRuntime.ts` — runtime loader + whitelist merge voor school plugin overlays
7. `ssotValidator.ts` — drielaags Zod-validatie (schema, referentieel, runtime)
8. Auth via Supabase: `user_roles` (LEERLING/DOCENT/ADMIN), `has_role()` SECURITY DEFINER, `AuthGuard`
9. Persistentie: `chat_messages`, `student_sessions`, `mastery`, `teacher_messages`, `profiles`, `school_ssot`

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

### Fase 1 — Stabilisatie (security + healing) ✅

| # | Taak | Status |
|---|------|--------|
| 1.1 | RLS verscherpen | ✅ DONE |
| 1.2 | Healing consolideren | ✅ DONE |
| 1.3 | Defensieve role-check | ✅ DONE |

### Fase 2 — Analyse-consistentie ✅

| # | Taak | Status |
|---|------|--------|
| 2.1 | Edge-classify uitbreiden met secondary_dimensions | ✅ DONE |
| 2.2 | E-dimensie aansluiten op SSOT | ✅ DONE |
| 2.3 | Logic gate check vereenvoudigen | ✅ DONE |

### Fase 3.x — Auth consolidatie & governance hardening ✅

| # | Taak | Status |
|---|------|--------|
| 3.x.1 | `useAuth()` refactor naar `AuthProvider` context (één listener, gedeelde state) | ✅ DONE |
| 3.x.2 | RLS tightening: `user_roles` en `school_ssot` van ADMIN ALL → SUPERUSER ALL + ADMIN/DOCENT SELECT | ✅ DONE |


### Fase 3 — EITL: SSOT plug-in architectuur ✅

| # | Taak | Status |
|---|------|--------|
| 3.1 | `school_ssot` tabel + RLS (admins CRUD, docenten SELECT) | ✅ DONE |
| 3.2 | `ssotValidator.ts` — drielaags Zod-validatie (schema, referentieel, runtime) | ✅ DONE |
| 3.3 | `ssotRuntime.ts` — `whitelistMerge` + `loadEffectiveSSOT` + cache | ✅ DONE |
| 3.4 | `ssot.ts` refactor — `SSOT_DATA` → `BASE_SSOT` + `getEffectiveSSOT()` | ✅ DONE |
| 3.5 | Component updates — alle directe `SSOT_DATA` refs vervangen | ✅ DONE |
| 3.6 | Read-only EITL preview tab in Admin Panel | ✅ DONE |

#### MVP Plugin Whitelist
- **Toegestaan**: band `label`, `description`, `didactic_principle`, `fix` (tekst); command descriptions; SRL `label`/`goal`; gate annotations (rationale, teacher_note)
- **Immutable**: `band_id`, `fix_ref`, `score_range`, `mechanistic`, `enforcement`, command keys, `cycle.order`, `trigger_band`, `learner_obs`, `ai_obs`, `nl_profile`, `trace_tags`, `band_weight`, `fix_type`, `band_ref`
- **Niet in MVP**: rubric `name`, rubric `goal`

### Fase 3.5 — EITL Wizard (edit-flow)

| # | Taak | Status |
|---|------|--------|
| 3.5.1 | 5-staps wizard in Admin Panel voor plugin CRUD (SUPERUSER-only) | ✅ DONE |
| 3.5.2 | Plugin versioning met `change_notes` en `based_on_version` | ✅ DONE |

### Fase 4 — Governance ✅

| # | Taak | Status |
|---|------|--------|
| 4.1 | Versioning afronden (dedup save, change_notes verplicht bij edits) | ✅ DONE |
| 4.2 | Rollback — SUPERUSER kan eerdere plugin-versie activeren via PluginVersionHistory | ✅ DONE |
| 4.3 | Audit log — `ssot_changes` tabel met SUPERUSER ALL + ADMIN SELECT | ✅ DONE |
| 4.4 | Diff-view — versiegeschiedenis + audit trail in EITL tab | ✅ DONE |

### Fase 5 — Observability

| # | Taak | Status |
|---|------|--------|
| 5.1 | Edge vs client analyse-ratio in dashboard | ✅ DONE |
| 5.2 | Plugin-usage metrics per school | ✅ DONE |
| 5.3 | Logic gate breach rate trending | ✅ DONE |
| 5.4 | Healing event frequentie | ✅ DONE |

---

## Bekende technische schuld

| # | Issue | Impact | Fase |
|---|-------|--------|------|
| 4 | Mixed dimensions in `coregulation_bands` veld | Low | documenteren of refactor bij EITL wizard |
| 7 | Token schatting is character-based proxy | Low | 5.x of labelen |
| 8 | `COMMAND_INTENTS` hardcoded in `ssotHelpers.ts` | Low | 3.5 (verplaatsen naar plugin-laag) |

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
