

# Fase 3 — Aangescherpt implementatieplan

De feedback is **correct op alle vijf punten**. Hier de bijgestelde versie.

---

## Wijzigingen t.o.v. vorig plan

| # | Feedback | Actie |
|---|----------|-------|
| 1 | Terminologie "school_ssot" → "school plugin/overlay" | Tabelnaam `school_ssot` behouden (DB-conventie), overal in code/docs spreken van "school plugin" of "overlay" |
| 2 | Whitelist strakker: rubric `name`/`goal` uit MVP | Geschrapt. MVP = band-velden + commands + SRL + gate annotations |
| 3 | Gate rationale als losse pluginsectie | `plugin_json.logic_gate_annotations[band_id]` als apart pad, niet als mutatie op `interaction_protocol.logic_gates` |
| 4 | Validator vóór runtime | Volgorde omgedraaid |
| 5 | `SSOT_DATA` volledig elimineren, geen alias-truc | `BASE_SSOT` + `getEffectiveSSOT()`, alle 178 directe refs expliciet vervangen |

---

## Implementatievolgorde (7 stappen)

### Stap 1 — Database-migratie
`school_ssot` tabel met `plugin_json` (jsonb), RLS: ADMIN full CRUD, DOCENT SELECT. `update_updated_at` trigger.

### Stap 2 — `src/lib/ssotValidator.ts`
Drielaags Zod-validatie:
1. **Schema**: alle 10 dimensies aanwezig, band_ids uniek, verplichte velden intact
2. **Referentieel**: `fix_ref` → bestaande commands, `trigger_band` → bestaande bands, `cycle.order` compleet
3. **Runtime**: `enforcement` strings parsebaar via bestaande regex, geen onbekende velden

Wordt aangeroepen vóór een plugin geactiveerd mag worden.

### Stap 3 — `src/lib/ssotRuntime.ts`
- `whitelistMerge(base, plugin)` — explicit path whitelist, **geen** generieke deep merge
- MVP whitelist:
  - Band: `label`, `description`, `didactic_principle`, `fix` (alleen beschrijvende tekst)
  - Command: descriptions (niet keys)
  - SRL: `label`, `goal`
  - Gate annotations: apart pad `plugin_json.logic_gate_annotations[band_id].rationale` / `.teacher_note` — raakt `enforcement` niet aan
- Immutable (altijd base): `band_id`, `fix_ref`, `score_range`, `mechanistic`, `enforcement`, command keys, `cycle.order`, `trigger_band`, `learner_obs`, `ai_obs`, `nl_profile`, `trace_tags`, `band_weight`, `fix_type`, `band_ref`
- **Niet in MVP**: rubric `name`, rubric `goal`
- `loadEffectiveSSOT(schoolId?)` — fetch actieve plugin, merge, validate, cache
- `getEffectiveSSOT()` — sync getter (cached of base als fallback)

### Stap 4 — `src/data/ssot.ts` refactor
- `SSOT_DATA` wordt `BASE_SSOT` (alleen voor validator/merge als input)
- `SSOT_DATA` export wordt **verwijderd**, niet ge-aliast
- Alle 17 helper functies (`getRubric`, `getBand`, `getCommands`, `getCycleOrder`, etc.) lezen uit `getEffectiveSSOT()`

### Stap 5 — Component updates
Alle 178 directe `SSOT_DATA.` referenties vervangen in 7 bestanden:
- `AdminPanel.tsx` (~30 refs): `.version`, `.rubrics`, `.command_library.commands`, `.interaction_protocol.logic_gates`
- `TeacherCockpit.tsx`: `.metadata.cycle.order`
- `BootSequence.tsx`: `.version`
- `ConceptPage.tsx`: `.version`
- `ssotHelpers.ts` (~20 refs): `.metadata.cycle.order`, `.command_library`, `.rubrics`, `.version`, `.interaction_protocol`
- `reliabilityPipeline.ts`: via helpers (al indirect, verify)
- `chatService.ts`: via helpers (al indirect, verify)

Alles gaat via `getEffectiveSSOT()` of via de bestaande helpers die nu intern `getEffectiveSSOT()` aanroepen.

### Stap 6 — Read-only admin preview
Nieuw tab in AdminPanel:
- Actieve plugin weergave (welke school, welke overrides)
- Effective SSOT preview (merged resultaat)
- Diff-view: base vs effective (welke velden zijn overschreven)
- Nog **geen** edit-functionaliteit

### Stap 7 — `plan.md` bijwerken
Fase 3 substappen markeren, wizard (edit-flow) als Fase 3.5 of 4 documenteren.

---

## Plugin JSON structuur (MVP)

```json
{
  "bands": {
    "K1": { "label": "...", "description": "...", "didactic_principle": "...", "fix": "..." },
    "K2": { "label": "..." }
  },
  "commands": {
    "/flits": "aangepaste beschrijving"
  },
  "srl_states": {
    "forethought": { "label": "...", "goal": "..." }
  },
  "logic_gate_annotations": {
    "K1": { "rationale": "...", "teacher_note": "..." }
  }
}
```

Flat lookup op `band_id` / command key / state id — geen geneste rubric-arrays nodig in de plugin.

---

## Wat niet wijzigt

- `reliabilityPipeline.ts` — consumeert via helpers, geen directe SSOT_DATA refs
- `chatService.ts` — idem
- `eai-classify` edge function — werkt op band_ids
- `eaiLearnAdapter.ts` — state/viewmodel laag

