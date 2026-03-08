

## Stap 5-6-7: Statusanalyse en openstaande werkzaamheden

### Wat is al geïmplementeerd

- Auth UI: login/signup/forgot/reset-password pagina's
- `useAuth` hook met sessie- en rollenbeheer
- `AuthGuard` component op `/student`, `/teacher`, `/admin`
- `user_roles` tabel met `has_role()` security definer
- `profiles` tabel met RLS
- TopNav: rolgebaseerde navigatie + logout
- LeskaartPanel: leercontext-blok met fase-uitleg (PHASE_CONTEXT)
- Terminologie "Leerling" in TopNav en TeacherCockpit
- MessageBubble: presentation guard (slash-commando's gefilterd)

---

### Kritieke problemen die nog openstaan

#### 1. Bootstrap-admin en rol-toewijzing faalt door RLS (KRITIEK)

De `user_roles` tabel heeft alleen INSERT-rechten voor bestaande admins (`has_role(auth.uid(), 'ADMIN')`). Bij signup probeert `AuthPage.tsx` client-side rollen in te voegen (regel 50-59), maar:

- De LEERLING-rol insert faalt omdat een nieuwe gebruiker geen admin is
- De bootstrap-admin rollen (ADMIN/DOCENT) voor `vis@emmauscollege.nl` falen om dezelfde reden
- **Resultaat**: geen enkele gebruiker krijgt ooit een rol

**Oplossing**: Database trigger op `auth.users` die automatisch:
- altijd de `LEERLING` rol toekent
- voor `vis@emmauscollege.nl` ook `ADMIN` + `DOCENT` toekent
- een profiel aanmaakt in `profiles`

Dit vervangt de client-side logica in AuthPage en is veilig omdat triggers als superuser draaien.

#### 2. Identiteit nog niet gekoppeld aan auth (KRITIEK)

`StudentStudio`, `ChatInterface` en `sessionSyncService` gebruiken nog `getOrCreateUserId()` (localStorage-gebaseerd). Hierdoor:

- is voortgang niet account-gebonden
- zijn sessies niet herleidbaar aan echte gebruikers
- is profielopslag nog localStorage (`profileService.ts`)

**Oplossing**: 
- `getOrCreateUserId()` vervangen door `auth.uid()` uit `useAuth` waar beschikbaar
- `profileService.ts` migreren naar de `profiles` tabel
- fallback houden voor niet-ingelogde context (bv. landing page)

#### 3. Signup-flow schrijft redundant naar DB (MEDIUM)

Na de trigger-oplossing moet de client-side profile/role insert in `AuthPage.tsx` (regels 44-59) verwijderd worden, anders krijg je dubbele inserts of constraint violations.

#### 4. Geen auto-confirm ingeschakeld (MEDIUM)

E-mailverificatie is vereist maar er is geen e-mailprovider geconfigureerd. Nieuwe gebruikers kunnen niet inloggen na registratie tenzij auto-confirm wordt ingeschakeld of e-mail wordt opgezet.

---

### Implementatieplan

```text
┌─────────────────────────────────────────────────┐
│ 1. DB trigger: auto-assign roles + profile      │
│    - op auth.users INSERT                        │
│    - LEERLING default                            │
│    - ADMIN+DOCENT voor bootstrap-email           │
│    - profiel aanmaken                            │
├─────────────────────────────────────────────────┤
│ 2. AuthPage opschonen                           │
│    - client-side role/profile inserts verwijderen│
│    - alleen auth.signUp + redirect               │
├─────────────────────────────────────────────────┤
│ 3. Identity koppelen aan auth                   │
│    - StudentStudio: auth.uid() gebruiken         │
│    - ChatInterface: auth.uid() doorgeven         │
│    - profileService: profiles-tabel lezen/schrijven│
├─────────────────────────────────────────────────┤
│ 4. Auto-confirm inschakelen (optioneel)         │
│    - via configure_auth tool                     │
│    - of e-mail setup starten                     │
└─────────────────────────────────────────────────┘
```

### Bestanden die wijzigen

| Bestand | Wijziging |
|---|---|
| Nieuwe migratie | Trigger `on_auth_user_created` voor roles + profile |
| `src/pages/AuthPage.tsx` | Client-side role/profile insert verwijderen |
| `src/services/profileService.ts` | localStorage → profiles-tabel |
| `src/pages/StudentStudio.tsx` | `getOrCreateUserId()` → `useAuth().user.id` |
| `src/components/ChatInterface.tsx` | userId als prop of via hook |
| `src/services/sessionSyncService.ts` | auth.uid() doorvoeren |

### Wat niet wijzigt

- `useAuth.ts` — werkt correct
- `AuthGuard.tsx` — werkt correct
- `TopNav.tsx` — werkt correct
- `LeskaartPanel.tsx` — werkt correct
- `reliabilityPipeline.ts` — niet geraakt
- `eai-classify` edge function — niet geraakt

