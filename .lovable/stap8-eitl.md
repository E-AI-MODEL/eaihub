
# Stap 8 — EITL: School-specifieke SSOT-configuratie

## Ontwerpprincipe

De base SSOT (`ssot_v15.json`) wordt **niet** vervangen of gemuteerd.
Schoolconfiguratie is een **controlled plugin/overlay** op geselecteerde inhoudelijke velden.
De plugin annoteert de basisstructuur; ze kent die niet opnieuw toe.

```
effectiveSSOT = whitelistMerge(baseSSOT, schoolPlugin)
```

---

## Drielagenmodel

### Laag 1 — Immutable core (altijd base SSOT)

Deze velden zijn **niet aanpasbaar** via de plugin:

| Veld | Reden |
|------|-------|
| `rubric_id` | Lookup-key in cycle order, dimensie-routing |
| `band_id` | Lookup-key in healing, G-factor, gate checks |
| `fix_ref` | Command validation in SSOT healing (`ssotHasCommand`) |
| `enforcement` | Regex-geparsed voor `MAX_TD`/`ALLOW_TD` patronen (`reliabilityPipeline.ts:355-360`) |
| `trigger_band` | Gate matching op band_id |
| `learner_obs` | Gecompileerd naar regex voor fallback detectie (`ssot.ts:233-249`) |
| `ai_obs` | Idem |
| `score_range` / `score_min` / `score_max` | Structureel contract |
| `mechanistic` / `mechanistic_signature_target` | Pipeline-mechanica |
| `risks` / `mechanistic_risks` | Pipeline-mechanica |
| `nl_profile` | Nested level configuratie |
| `trace_tags` / `band_weight` / `fix_type` | Pipeline-metadata |
| `band_ref` | Referentie-integriteit |
| Command keys (e.g. `/flits`) | Machine-identifiers |
| `cycle.order` | Dimensie-verwerkingsvolgorde |
| `trace_schema` | Event contract |
| `context_model` | Required fields contract |
| `global_logic` | Pipeline-prioriteiten |

### Laag 2 — Plugin-allowed layer (school mag overschrijven)

| Override-pad | Voorbeeld |
|-------------|-----------|
| `rubrics[].bands[].label` | "Oppervlakkig" → "Nog niet verdiept" |
| `rubrics[].bands[].description` | Aangepaste bandbeschrijving |
| `rubrics[].bands[].didactic_principle` | School-eigen didactisch principe |
| `rubrics[].bands[].fix` | Beschrijvende fix-tekst (NIET `fix_ref`) |
| `rubrics[].name` | Rubrieknaam |
| `rubrics[].goal` | Rubric-doelstelling |
| `command_library.commands[key]` | Command beschrijving (NIET de key) |
| `srl_model.states[].label` | SRL-state label |
| `srl_model.states[].goal` | SRL-state doel |
| `interaction_protocol.logic_gates[].rationale` | **Nieuw veld**: toelichtende tekst (NIET `enforcement`) |

### Laag 3 — Effective runtime SSOT

```
loadEffectiveSSOT(schoolId?) →
  1. base = ssot_v15.json (altijd)
  2. plugin = school_ssot.plugin_json (indien actief)
  3. effective = whitelistMerge(base, plugin)
  4. validate(effective) → pass of reject
  5. return effective
```

---

## Database-ontwerp

### Tabel: `school_ssot`

| Kolom | Type | Nullable | Default | Doel |
|-------|------|----------|---------|------|
| `id` | uuid | nee | `gen_random_uuid()` | PK |
| `school_id` | text | nee | — | School identifier |
| `school_name` | text | nee | — | Weergavenaam |
| `based_on_version` | text | nee | — | e.g. "15.0.0" |
| `plugin_json` | jsonb | nee | `'{}'` | Alleen override-velden |
| `effective_hash` | text | ja | — | SHA-256 van effective SSOT |
| `is_active` | boolean | nee | `false` | Actieve configuratie |
| `change_notes` | text | ja | — | Wijzigingsnotitie |
| `created_at` | timestamptz | nee | `now()` | Aanmaakdatum |
| `updated_at` | timestamptz | nee | `now()` | Laatst gewijzigd |
| `created_by` | uuid | nee | — | Auteur (auth.uid) |

### RLS-policies

- **Admins**: full CRUD via `has_role(auth.uid(), 'ADMIN')`
- **Docenten**: SELECT via `has_role(auth.uid(), 'DOCENT')`
- **Leerlingen**: geen directe toegang (effective SSOT wordt server-side geresolved)

---

## Whitelisted merge — specificatie

De merge is **geen** generieke deep merge. Het is een expliciete loop over toegestane paden:

```typescript
const ALLOWED_BAND_FIELDS = ['label', 'description', 'didactic_principle', 'fix'] as const;
const ALLOWED_RUBRIC_FIELDS = ['name', 'goal'] as const;

function whitelistMerge(base: SSOTData, plugin: SchoolPlugin): SSOTData {
  const effective = structuredClone(base);

  // Rubric-level overrides
  for (const rubricOverride of plugin.rubrics ?? []) {
    const target = effective.rubrics.find(r => r.rubric_id === rubricOverride.rubric_id);
    if (!target) continue; // ignore unknown rubrics

    for (const field of ALLOWED_RUBRIC_FIELDS) {
      if (rubricOverride[field] !== undefined) target[field] = rubricOverride[field];
    }

    for (const bandOverride of rubricOverride.bands ?? []) {
      const targetBand = target.bands.find(b => b.band_id === bandOverride.band_id);
      if (!targetBand) continue; // ignore unknown bands

      for (const field of ALLOWED_BAND_FIELDS) {
        if (bandOverride[field] !== undefined) targetBand[field] = bandOverride[field];
      }
    }
  }

  // Command description overrides
  for (const [key, desc] of Object.entries(plugin.commands ?? {})) {
    if (key in effective.command_library.commands) {
      effective.command_library.commands[key] = desc;
    }
  }

  // SRL overrides
  for (const srlOverride of plugin.srl_states ?? []) {
    const target = effective.srl_model.states.find(s => s.id === srlOverride.id);
    if (!target) continue;
    if (srlOverride.label) target.label = srlOverride.label;
    if (srlOverride.goal) target.goal = srlOverride.goal;
  }

  // Gate rationale (new field, never touches enforcement)
  for (const gateOverride of plugin.gate_rationales ?? []) {
    const target = effective.interaction_protocol.logic_gates.find(
      g => g.trigger_band === gateOverride.trigger_band
    );
    if (target) (target as any).rationale = gateOverride.rationale;
  }

  return effective;
}
```

---

## Validatie — drie lagen

### 1. Schema-validatie (Zod)
- Alle verplichte velden aanwezig
- Alle 10 dimensies aanwezig in rubrics
- Band_ids uniek en intact

### 2. Referentiële validatie
- Alle `fix_ref` waarden verwijzen naar bestaande commands
- Alle `trigger_band` waarden verwijzen naar bestaande bands
- `cycle.order` bevat alle rubric_ids

### 3. Runtime/gedragsvalidatie
- `enforcement` strings nog parsebaar via bestaande regex
- Geen onbekende velden in de effective SSOT
- `effective_hash` wordt berekend en opgeslagen

---

## Substappen

### 8a — Database + runtime loader
- Migratie: `school_ssot` tabel met RLS
- `loadEffectiveSSOT(schoolId?)` in `ssot.ts`
- Whitelisted merge functie
- Fallback: zonder school-plugin = base SSOT (gedrag ongewijzigd)

### 8b — Validator
- `ssotValidator.ts` met Zod schemas
- Drie validatielagen
- Gebruikt na elke merge en bij plugin-opslag

### 8c — Admin EITL Wizard
- 5-staps flow in Admin Panel:
  1. School metadata
  2. Per-dimensie label/description aanpassing
  3. Command descriptions
  4. SRL labels/goals
  5. Review + activeren
- Alleen plugin-allowed velden bewerkbaar
- Preview van effective SSOT voor activering

### 8d — Governance
- Versioning: elke save = nieuwe rij met `change_notes`
- Rollback: admin kan eerdere versie activeren
- Diff-view: vergelijking base vs effective
- Upgrade-check: `based_on_version` valideren bij SSOT-update (v15 → v16)

---

## Impact op bestaande code

| Component | Wijziging nodig? | Toelichting |
|-----------|-----------------|-------------|
| `ssot.ts` helpers | Ja (8a) | `getRubric()`, `getBand()` etc. werken op effective SSOT i.p.v. statische singleton |
| `ssotHelpers.ts` | Nee (tot 8c) | Consumeert helpers, niet de data direct |
| `chatService.ts` | Nee | Consumeert helpers |
| `reliabilityPipeline.ts` | Nee | Consumeert helpers, ids/enforcement ongewijzigd |
| `eai-classify` edge fn | Nee | Werkt op band_ids, niet op labels |
| `AdminPanel.tsx` | Ja (8c) | Nieuwe EITL Wizard tab |
| `COMMAND_INTENTS` | Ja (8c/8d) | Verplaatsen naar plugin-laag |

---

## Machinegevoelige velden — referentie

| Veld | Gebruikt in | Hoe |
|------|------------|-----|
| `enforcement` | `reliabilityPipeline.ts:355-360` | Regex: `gate.enforcement.match(/MAX_TD\s*=\s*TD(\d)/)` |
| `learner_obs` | `ssot.ts:233-249` | Gecompileerd naar RegExp voor fallback detectie |
| `band_id` | healing, G-factor, gate checks | Lookup-key |
| `fix_ref` | `ssotHasCommand()` | Validatie |
| `trigger_band` | gate matching | Lookup-key |
| `COMMAND_INTENTS` | `ssotHelpers.ts:326-346` | Prompt assembly |
