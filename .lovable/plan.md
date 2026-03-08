

# Plan: EITL Plugin-architectuur + bijgewerkte plan.md

## Samenvatting

Twee bestanden schrijven die het volledige EITL-ontwerp documenteren als roadmap-stap, gebaseerd op het plugin/overlay-principe dat in de gesprekken is uitgewerkt en geverifieerd tegen de codebase.

---

## Wat er gebeurt

### 1. `.lovable/plan.md` — bijgewerkte roadmap

- Stap 1–7 markeren als ✅ afgerond
- Huidige architectuur-sectie bijwerken (edge-first, pipeline, auth/RLS)
- **Stap 8 — EITL** toevoegen als volgende roadmap-stap met substappen 8a–8d
- Bekende technische schuld sectie toevoegen (de 8 cross-ref bevindingen)

### 2. `.lovable/stap8-eitl.md` — gedetailleerd EITL-ontwerp

Bevat het volledige architectuurontwerp:

**Drielagenmodel:**
- **Immutable core** — band_ids, fix_ref, command keys, score ranges, mechanistic signatures, enforcement regex (`MAX_TD`/`ALLOW_TD`), learner_obs, cycle order, trace/context schema
- **Plugin-allowed layer** — labels, descriptions, didactic_principles, command descriptions, SRL labels/goals, toelichtende gate-tekst (niet de machine-enforced kern)
- **Effective runtime** — `effectiveSSOT = whitelistMerge(base, plugin)`

**Database-ontwerp:**
- `school_ssot` tabel met `plugin_json` (JSONB, alleen overrides), `based_on_version`, `effective_hash`, `is_active`, versioning
- RLS: admins beheren, docenten lezen

**Technische componenten (4 substappen):**
- **8a**: `school_ssot` tabel + `loadEffectiveSSOT()` in `ssot.ts` met whitelisted merge (geen generieke deep merge)
- **8b**: `ssotValidator.ts` — drielaags Zod-validatie (schema, referentieel, runtime/gedrag)
- **8c**: Admin EITL Wizard — 5-staps vraag-antwoord flow, alleen plugin-allowed velden bewerkbaar
- **8d**: Governance — versioning, rollback, diff-view, `based_on_version` check bij SSOT-upgrade

**Machinegevoelige velden** (expliciet gedocumenteerd):
- `enforcement` strings — regex-geparsed in `reliabilityPipeline.ts:355-360`
- `learner_obs` — gecompileerd naar regex in `ssot.ts:158-170`
- `band_id`, `fix_ref`, `trigger_band` — lookup-keys in healing en gate checks
- `COMMAND_INTENTS` in `ssotHelpers.ts:326-346` — bij EITL verplaatsen naar plugin-laag

**Whitelist-merge specificatie:**
```text
Toegestane override-paden per rubric band:
  rubrics[].bands[].label
  rubrics[].bands[].description
  rubrics[].bands[].didactic_principle
  rubrics[].bands[].fix  (beschrijvende tekst, NIET fix_ref)

Toegestane override-paden overig:
  command_library.commands[key].description  (NIET de key zelf)
  srl_model.states[].label
  srl_model.states[].goal
  interaction_protocol.logic_gates[].rationale  (nieuw veld, NIET enforcement)
```

---

## Wat NIET verandert

- Geen code-wijzigingen in deze stap — alleen documentatie
- De base SSOT (`ssot_v15.json`) wordt niet aangeraakt
- Bestaande consumers (`ssotHelpers.ts`, `chatService.ts`, `reliabilityPipeline.ts`) worden niet gewijzigd

## Geschatte omvang

- `plan.md`: ~120 regels
- `stap8-eitl.md`: ~200 regels

