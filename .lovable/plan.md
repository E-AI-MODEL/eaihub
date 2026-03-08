

# Status: Nee, geen van de drie lagen zit er al in

Huidige stand in de code:

| Punt | Status |
|------|--------|
| `AppRole` type | Alleen `'LEERLING' \| 'DOCENT' \| 'ADMIN'` — geen `SUPERUSER` |
| `hasRole()` in useAuth | `state.roles.includes(role)` — geen SUPERUSER-implicatie |
| AuthGuard regel 49 | `!roles.includes(requiredRole)` — gebruikt **niet** `hasRole()` |
| AuthPage redirect | Hardcoded `navigate('/student')` — geen role-based redirect |
| `plugin_assignments` tabel | Bestaat niet |
| `app_role` enum in database | Alleen `LEERLING`, `DOCENT`, `ADMIN` |

Niets van het goedgekeurde plan is geïmplementeerd. Alles moet nog gebouwd worden.

---

## Implementatieplan met alle aanscherpingen verwerkt

### Laag 1: Role-based login redirect

**`src/pages/AuthPage.tsx`** — `handleLogin` aanpassen:

Na succesvolle login, rollen ophalen en redirecten in exacte volgorde:
1. `SUPERUSER` of `ADMIN` → `/admin`
2. `DOCENT` → `/teacher`
3. Anders → `/student`

### Laag 2: SUPERUSER rol + centrale implicatie

**Database-migratie:**
- `ALTER TYPE public.app_role ADD VALUE 'SUPERUSER'`
- `INSERT` SUPERUSER rol voor `vis@emmauscollege.nl`
- Update `handle_new_user()` trigger: ook SUPERUSER toekennen aan vis@

**`src/hooks/useAuth.ts`:**
- `AppRole` uitbreiden met `'SUPERUSER'`
- `hasRole`: `state.roles.includes('SUPERUSER') || state.roles.includes(role)`
- Nieuwe export: `isSuperUser` convenience getter

**`src/components/AuthGuard.tsx` (kritieke fix):**
- Regel 49: `!roles.includes(requiredRole)` → `!hasRole(requiredRole)` (de `hasRole` uit de hook die de implicatie bevat)

### Laag 3: Plugin-assignments

**Database-migratie — nieuwe tabel `plugin_assignments`:**
- `assigned_to_role` beperkt tot `DOCENT` en `LEERLING` via CHECK constraint
- XOR-constraint: precies één targettype per record
- RLS: SUPERUSER beheert, users lezen eigen assignments

**`src/lib/ssotRuntime.ts`:**
- `loadEffectiveSSOT(schoolId?, userId?, userRoles?)` — cascade:
  1. User-specific enabled assignment
  2. Role-specific enabled assignment
  3. School-wide `is_active`
  4. `BASE_SSOT`

**`src/hooks/useSchoolPlugin.ts`:**
- User ID en rollen doorgeven aan de loader

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | SUPERUSER enum + toekenning + trigger update |
| Database migratie | `plugin_assignments` tabel + RLS + constraints |
| `src/hooks/useAuth.ts` | AppRole, hasRole implicatie, isSuperUser |
| `src/components/AuthGuard.tsx` | `hasRole()` i.p.v. `roles.includes()` |
| `src/pages/AuthPage.tsx` | Role-based redirect |
| `src/lib/ssotRuntime.ts` | Assignment-aware cascade |
| `src/hooks/useSchoolPlugin.ts` | userId + roles doorgeven |

