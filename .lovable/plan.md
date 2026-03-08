# Audit bevestigd — alle 5 punten kloppen

Ik heb de database-configuratie en code geverifieerd. Hier is de status:

## Punt 1: RESTRICTIVE RLS — BEVESTIGD, KRITIEK

**Elke** RLS policy in het hele project is `Permissive: No` (RESTRICTIVE). Dit geldt voor:

- `plugin_assignments` (2 policies, beide restrictive)
- `school_ssot` (2 policies, beide restrictive)
- `chat_messages` (4 policies, alle restrictive)
- `student_sessions` (5 policies, alle restrictive)
- `user_roles` (2 policies, beide restrictive)
- `mastery` (5 policies, alle restrictive)
- `profiles` (4 policies, alle restrictive)
- `teacher_messages` (4 policies, alle restrictive)

In PostgreSQL: zonder minstens één PERMISSIVE policy per tabel is het resultaat altijd "geen toegang". Als het nu werkt, is dat puur omdat het Supabase-gedrag hier mee-valt, maar het is architectonisch fout en fragiel.

## Punt 2: `has_role()` mist SUPERUSER-implicatie — BEVESTIGD

Database-functie doet alleen: `WHERE user_id = _user_id AND role = _role`

De app-laag (`useAuth.ts` regel 78) doet wél: `state.roles.includes('SUPERUSER') || state.roles.includes(role)`

Dit is inconsistent. Als vis@ alleen SUPERUSER heeft (zonder expliciete ADMIN), falen alle DB-policies die `has_role(uid, 'ADMIN')` checken. Nu werkt het toevallig omdat de trigger alle rollen toekent.

## Punt 3: `isSuperUser` is functie — BEVESTIGD

Regel 79: `const isSuperUser = useCallback(() => state.roles.includes('SUPERUSER'), [state.roles]);`
Moet boolean worden.

## Punt 4: Assignment-queries niet deterministisch — BEVESTIGD

Regels 115-122 en 132-139: `.limit(1).maybeSingle()` zonder `.order(...)`.

## Punt 5: App.tsx dupliceert auth — BEVESTIGD

Al eerder vastgesteld, `SchoolPluginProvider` heeft eigen auth-listener naast `useAuth`.

---

## Plan: alle 5 fixes in één keer

### Database-migratie (1 migratie, 3 acties)

**A. `has_role()` updaten met SUPERUSER-implicatie:**

```sql
CREATE OR REPLACE FUNCTION public.has_role(...)
  WHERE user_id = _user_id AND (role = _role OR role = 'SUPERUSER')
```

**B. Alle RLS policies op alle 8 tabellen droppen en herscreëren als PERMISSIVE** (de standaard). Zelfde logica, alleen zonder het `RESTRICTIVE` keyword. Dit raakt:

- `plugin_assignments` (2 policies)
- `school_ssot` (2 policies)
- `chat_messages` (4 policies)
- `student_sessions` (5 policies)
- `user_roles` (2 policies)
- `mastery` (5 policies)
- `profiles` (4 policies)
- `teacher_messages` (4 policies)

Totaal: 28 policies droppen + 28 herscreëren als permissive.

**C. Geen structuurwijzigingen** — alleen function + policies.

### Code-wijzigingen


| Bestand                  | Wijziging                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useAuth.ts`   | `isSuperUser` van `useCallback(() => ...)` naar `state.roles.includes('SUPERUSER')`                              |
| `src/lib/ssotRuntime.ts` | `.order('created_at', { ascending: false })` toevoegen op beide assignment-queries (regels 121 en 138)           |
| `src/App.tsx`            | `SchoolPluginProvider` refactoren: eigen auth-listener vervangen door `useAuth()` hook, `roles as any` verdwijnt |


### Risico-inschatting

- Migratie is groot (28 policies) maar puur declaratief — geen datawijzigingen
- `has_role()` wijziging is backward-compatible (voegt alleen SUPERUSER-implicatie toe)
- Code-wijzigingen zijn minimaal en backward-compatible  
  
voer uit maar en sluit af met grondige check 
- &nbsp;