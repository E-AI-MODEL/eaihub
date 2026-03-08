

# Technische schuld: meetbare data strak maken

## Overzicht

6 gerichte wijzigingen om de databronnen betrouwbaar te maken voor Fase 5 Observability. Geen UI-impact.

## Wijzigingen

### 1. `analysisSource` defaults — `src/services/chatService.ts`

**3 plekken** waar `MechanicalState` wordt aangemaakt zonder `analysisSource`:

| Plek | Regel | Toevoegen |
|------|-------|-----------|
| Image path mechanical | ~336 | `analysisSource: 'client'` |
| sendChat error mechanical | ~490 | `analysisSource: 'client'` + healing defaults |
| streamChat error mechanical | ~644 | `analysisSource: 'client'` + healing defaults |

Semantiek: `'client'` op error paths betekent **"geen edge-resultaat beschikbaar, fallback default voor meetbaarheid"** — niet dat er een inhoudelijke client-analyse heeft plaatsgevonden.

Error mechanical defaults toevoegen op beide error paths:
```ts
analysisSource: 'client',  // fallback: geen edge-resultaat beschikbaar
healingEventCount: 0,
ssotHealingCount: 0,
commandNullCount: 0,
parseRepairCount: 0,
```

### 2. `coregulation_bands` fix — `src/services/chatService.ts`

Regel ~1083: `[knowledgeType, coRegulation, processPhase]` → `[coRegulation]`

K-band en P-band staan al in hun eigen arrays (`process_phases`, knowledge zit in `reasoning`). Dit is een semantische bug, geen cosmetische schuld.

### 3. `repairAttempts` echte count — `src/lib/reliabilityPipeline.ts`

Regel ~557: `healingEvents.length > 0 ? 1 : 0` → `healingEvents.length`

### 4. `parseRepairCount` deprecated — `src/types/index.ts`

Regel ~142: JSDoc `@deprecated` toevoegen. Niet verwijderen — dat breekt bestaande code. Waarde blijft `0` in pipeline.

### 5. `plugin_id` op `student_sessions` — DB migratie + 2 bestanden

**Migratie:**
```sql
ALTER TABLE student_sessions ADD COLUMN plugin_id text DEFAULT NULL;
COMMENT ON COLUMN student_sessions.plugin_id IS 
  'Active school plugin ID during session. NULL = base SSOT (geen plugin geladen).';
```

Semantiek: `NULL` = expliciet base SSOT, niet "onbekend".

**`src/services/sessionSyncService.ts`**: Parameter `pluginId?: string | null` toevoegen aan `upsertSessionState`, meesturen in upsert.

**`src/components/ChatInterface.tsx`**: `getActivePlugin()?.id ?? null` meegeven aan `upsertSessionState`.

### 6. Inline metrics contract — als comments bij de fixes

Per gewijzigd veld kort vastleggen:
- Bron (welke code zet het)
- Granulariteit (per bericht / per sessie)
- `null` = niet beschikbaar / `0` = gemeten, geen events

Dit als codecomments, niet als apart document.

## Volgorde

A (analysisSource) → C (coregulation_bands) → E (plugin_id + migratie) → F (error defaults, samen met A) → D (repairAttempts) → B (parseRepairCount deprecated)

## Bestanden geraakt

| Bestand | Wijziging |
|---------|-----------|
| `src/services/chatService.ts` | 3x analysisSource + error defaults + coregulation_bands |
| `src/lib/reliabilityPipeline.ts` | repairAttempts |
| `src/types/index.ts` | parseRepairCount JSDoc |
| `src/services/sessionSyncService.ts` | pluginId parameter |
| `src/components/ChatInterface.tsx` | pluginId doorgeven |
| DB migratie | plugin_id kolom |

