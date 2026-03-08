

# Fase 4 — Governance (gecorrigeerd plan)

## Bevestiging huidige staat

De user heeft gelijk: `handleSave()` in EITLWizard.tsx doet al INSERT-only (beide paden — nieuw en bewerken — gebruiken `.insert()`). Versioning via `change_notes` en `based_on_version` is al aanwezig. Wat ontbreekt: audit log, rollback UI, versie-tegen-versie diff.

---

## Wijzigingen

### 4.1 — Versioning afronden (klein)

- `change_notes` verplicht maken bij edits (wizard stap 0: required-check toevoegen wanneer `existingPlugin` niet null is)
- Deduplicate de twee identieke insert-blokken in `handleSave()` (regels 218-257 zijn copy-paste)

### 4.2 — Rollback

**Nieuw component**: `src/components/PluginVersionHistory.tsx`

- Query alle `school_ssot` rijen voor een school, gesorteerd op `created_at DESC`
- Tabel: datum, `change_notes`, `is_active` badge, "Activeer" knop (SUPERUSER-only)
- Activeren = deactiveer huidige actieve → activeer geselecteerde → audit log → `clearSSOTCache()` + `loadEffectiveSSOT()`

**Integratie**: AdminPanel EITL tab, onder de plugin status card

### 4.3 — Audit log

**Database migratie**: nieuwe tabel `ssot_changes`

```sql
CREATE TABLE public.ssot_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL,
  previous_plugin_id uuid,
  school_id text NOT NULL,
  action text NOT NULL,  -- CREATED, ACTIVATED, DEACTIVATED, ROLLBACK
  performed_by uuid NOT NULL,
  change_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ssot_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superusers manage ssot_changes"
  ON public.ssot_changes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'SUPERUSER'))
  WITH CHECK (has_role(auth.uid(), 'SUPERUSER'));

CREATE POLICY "Admins read ssot_changes"
  ON public.ssot_changes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'));
```

**Code**: na elke plugin-actie (save, activate, rollback) een `ssot_changes` insert toevoegen in:
- `EITLWizard.handleSave()` → CREATED + optioneel ACTIVATED
- `PluginVersionHistory` rollback → ROLLBACK + DEACTIVATED + ACTIVATED

### 4.4 — Diff-view uitbreiding

Uitbreiden van bestaande diff-sectie in AdminPanel (regels 1120-1235):
- Twee dropdowns om willekeurige versies te vergelijken (niet alleen base vs effective)
- Audit trail (compacte `ssot_changes` lijst) onder de diff

---

## Bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/migrations/…` | `ssot_changes` tabel + RLS |
| `src/components/EITLWizard.tsx` | Deduplicate save, `change_notes` required bij edit, audit inserts |
| `src/components/PluginVersionHistory.tsx` | **Nieuw** — versiegeschiedenis + rollback |
| `src/pages/AdminPanel.tsx` | Integratie versiegeschiedenis, diff-uitbreiding, audit trail |
| `.lovable/plan.md` | Fase 4 statussen bijwerken |

## Volgorde

1. Database migratie (`ssot_changes`)
2. EITLWizard opschonen + audit logging
3. PluginVersionHistory component
4. AdminPanel integratie (versiegeschiedenis + diff + audit trail)
5. plan.md bijwerken

