

# Mini-fix: laatste `as any` casts verwijderen

## Bevindingen bevestigd

Twee resterende `as any` casts gevonden:

1. **`PluginVersionHistory.tsx` regel 66**: `.then(res => res as any)` op de `ssot_changes` query — overbodig omdat `ssot_changes` in de gegenereerde types staat.

2. **`EITLWizard.tsx` regel 246**: `plugin_json: pluginJson as any` — nodig omdat `pluginJson` een complex object is dat naar de `Json` kolom gaat. Dit is een **valide cast** (Json type accepteert `any`-achtige structuren). Kan verbeterd worden naar `plugin_json: pluginJson as Json` maar is geen bug.

## Wijzigingen

| Bestand | Regel | Fix |
|---------|-------|-----|
| `src/components/PluginVersionHistory.tsx` | 64-66 | Verwijder `.then(res => res as any)` — gebruik direct het result object en cast `data` naar `AuditEntry[]` |
| `src/components/EITLWizard.tsx` | 246 | Verander `pluginJson as any` naar `pluginJson as Json` met import van `Json` type uit types.ts |

Twee éénregelige fixes, geen functionele impact.

