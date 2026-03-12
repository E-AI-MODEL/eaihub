

## Samenvatting: wat is nu geïmplementeerd?

### 1. Database & RLS — Compleet ✅
- `public.role_requests` tabel met `PENDING`/`APPROVED`/`REJECTED` status
- Unieke constraint: 1 PENDING request per rol per gebruiker
- RLS policies: gebruikers zien eigen requests, admins zien DOCENT requests, superusers zien alles

### 2. AuthPage post-signup — Compleet ✅
- Na succesvolle registratie: `mode = 'post-signup'` state
- Toont `RoleRequestForm` + "Doorgaan naar inloggen" knop
- Gebruiker kan direct DOCENT/ADMIN aanvragen of overslaan

### 3. StudentStudio UserPlus knop — Compleet ✅
- `UserPlus` icoon in header (naast Settings)
- Alleen zichtbaar als gebruiker geen ADMIN/SUPERUSER heeft
- Opent dialog met `RoleRequestForm`

### 4. AdminPanel Aanvragen tab — Compleet ✅
- Tab "Aanvragen" met `RoleRequestsReviewTab`
- Approve/Reject knoppen per request
- Approve voegt rol toe aan `user_roles` + update status
- Superuser ziet alle aanvragen, admin alleen DOCENT requests

### 5. LandingPage navigatie — Compleet ✅
- Header: alleen "Hoe werkt het?" en "Start EAI Hub" (geen losse rollinks meer)
- Rolkaarten leiden naar `/auth`

---

## Bewuste scope-beperkingen (niet gebouwd)

| Feature | Status | Reden |
|--------|--------|-------|
| E-mailnotificaties bij statuswijziging | ❌ Niet gebouwd | Fase 1 scope |
| Domein-mapping / auto-approval | ❌ Niet gebouwd | Fase 1 scope |
| Multi-step onboarding | ❌ Niet gebouwd | Fase 1 scope |
| Uitnodigingscodes | ❌ Niet gebouwd | Fase 1 scope |
| Pending badge op Admin tab | ❌ Niet gebouwd | Nice-to-have, geen blocker |

---

## Conclusie

**Role Request Fase 1 is compleet binnen de afgesproken scope.** Alle vereiste flows werken:
1. Registreren → optioneel rolverzoek
2. Rol aanvragen vanuit StudentStudio
3. Admin/Superuser kan verzoeken beoordelen en rollen toewijzen

Geen verdere bouwacties nodig tenzij je iets buiten scope wilt toevoegen.

