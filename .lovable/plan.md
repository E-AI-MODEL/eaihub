

# Beoordeling: het plan is goed en volledig

Het voorgestelde drieluik — (1) end-to-end bootstrap testen, (2) testdata invoegen, (3) EITL Wizard bouwen — is de juiste volgorde. De architectuur is al volledig doorverbonden: `AdminPanel.tsx` importeert al `getEffectiveSSOT`, `getActivePlugin`, `hasActivePlugin` en `getAllGateAnnotations` uit `ssotRuntime.ts`. De downstream kant is klaar.

## Wat er concreet moet gebeuren

### Stap 1: Testplugin invoegen via database-migratie

Een seed-migratie die:
- Een testprofiel koppelt aan `school_id = 'test-lyceum'` (of een bestaand profiel update)
- Een `school_ssot` record aanmaakt met een minimale maar zichtbare plugin:
  - 1-2 band label overrides (bijv. K1, C2)
  - 1 command description override
  - 1 SRL label override
  - `is_active = true`, `based_on_version = '15.0.0'`

### Stap 2: Handmatig de vier scenario's doorlopen

1. User zonder `school_id` → console toont "No active plugin", UI toont BASE_SSOT labels
2. User met `school_id = 'test-lyceum'` maar plugin `is_active = false` → idem
3. User met `school_id = 'test-lyceum'` en actieve plugin → console toont `Loaded plugin for school "Test Lyceum"`, UI toont gewijzigde labels
4. Logout → console toont geen plugin-state meer, cache is leeg

### Stap 3: EITL Wizard (Fase 3.5) — pas na geslaagde test

Nieuwe tab in `AdminPanel.tsx` met een stapsgewijze editor:
1. School metadata (school_id, naam, versie)
2. Band overrides per dimensie (label, description, didactic_principle, fix)
3. Command description overrides
4. SRL label/goal overrides
5. Review + validatie + opslaan

## Wat ontbreekt in het plan (kleine aanvulling)

Eén ding dat ik zou toevoegen: **na de testplugin invoegen, ook even checken dat de `school_ssot` RLS policies werken**. De huidige policies zijn `RESTRICTIVE` (niet permissive), wat betekent dat een admin zowel de ADMIN-policy als eventueel de DOCENT-policy nodig kan hebben. Dit is waarschijnlijk al correct, maar verdient een snelle verificatie bij het testen.

## Conclusie

Het plan is volledig. De volgorde test → testdata → wizard is architectonisch juist. Geen ontbrekende stappen.

