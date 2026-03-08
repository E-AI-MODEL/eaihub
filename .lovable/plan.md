

# Mini-fix ronde: Fase 4 waterdicht maken

## Bevindingen bevestigd

1. **Migratie `ssot_changes`**: ✅ Staat in repo (`supabase/migrations/20260308191852_…`). Tabel bestaat ook live in de database (bevestigd via schema-context). Geen actie nodig.

2. **`CREATED`/`CREATED` bug** (EITLWizard.tsx regel 258): Bevestigd. De ternary `activate ? 'CREATED' : 'CREATED'` is zinloos. Fix: als `activate` true → `'CREATED_AND_ACTIVATED'`, anders → `'CREATED'`. De aparte ACTIVATED insert op regel 264-270 blijft staan voor de deactivatie-log van de vorige plugin.

3. **Lege roles bij rollback** (PluginVersionHistory.tsx regel 124): Bevestigd. `loadEffectiveSSOT(…, user.id, [])` negeert role-based assignments. Fix: `useAuth()` hook levert al `roles` — die meegeven.

4. **Versiegeschiedenis alleen bij actieve plugin** (AdminPanel.tsx regel 1122): Bevestigd. `hasActivePlugin() &&` voorkomt dat je history ziet zonder actieve plugin. Fix: toon altijd wanneer een `schoolId` beschikbaar is (uit profile of uit de eerste beschikbare school_ssot rij).

## Wijzigingen

| Bestand | Fix |
|---------|-----|
| `src/components/EITLWizard.tsx` | Regel 258: `activate ? 'CREATED_AND_ACTIVATED' : 'CREATED'` |
| `src/components/PluginVersionHistory.tsx` | Regel 124: `roles` uit `useAuth()` meegeven aan `loadEffectiveSSOT` |
| `src/pages/AdminPanel.tsx` | Regel 1122: versiegeschiedenis tonen op basis van `schoolId` i.p.v. `hasActivePlugin()`. SchoolId ophalen uit profile of eerste school_ssot record. |

## Omvang

Drie éénregelige fixes plus een kleine AdminPanel conditie-aanpassing. Geen DB-migratie nodig. Kan vóór Fase 5.

