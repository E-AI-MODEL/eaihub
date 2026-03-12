# Plan: Accountaanvraag Fase 1 — Role Requests

## Impactanalyse

**Bestaande code die geraakt wordt:**

- `AdminPanel.tsx` — nieuwe tab toevoegen voor aanvragen-review
- `AdminUsersTab.tsx` — geen wijziging nodig
- `AuthPage.tsx` — optioneel: na signup een rolverzoek-UI tonen (of apart component)
- `AuthContext.tsx` — geen wijziging (rollen worden pas actief na goedkeuring via bestaande `user_roles`)

**Nieuw te maken:**

- Database: `role_requests` tabel + RLS policies
- `src/components/RoleRequestForm.tsx` — compact formulier voor ingelogde gebruikers om DOCENT/ADMIN aan te vragen
- `src/components/RoleRequestsReviewTab.tsx` — review-lijst voor admin/superuser in AdminPanel
- Route/plek voor het aanvraagformulier (bijv. in StudentStudio header of als aparte pagina)

## Database migratie

```sql
CREATE TABLE public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_duplicate_pending UNIQUE (user_id, requested_role, status)
);

-- The UNIQUE constraint on (user_id, requested_role, status) prevents duplicate PENDING requests.
-- After APPROVED/REJECTED a new request for the same role is possible.

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users read own requests
CREATE POLICY "Users read own requests" ON public.role_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users insert own requests (only DOCENT or ADMIN allowed — enforced in app)
CREATE POLICY "Users insert own requests" ON public.role_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND requested_role IN ('DOCENT', 'ADMIN'));

-- Admins read all requests (for review)
CREATE POLICY "Admins read requests" ON public.role_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Admins update DOCENT requests (approve/reject)
CREATE POLICY "Admins review DOCENT requests" ON public.role_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'::app_role) AND requested_role = 'DOCENT');

-- Superusers manage all requests
CREATE POLICY "Superusers manage all requests" ON public.role_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'SUPERUSER'::app_role))
  WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));
```

Note: The `UNIQUE(user_id, requested_role, status)` constraint allows one PENDING request per role per user. Once reviewed (status changes to APPROVED/REJECTED), a new request becomes possible. This is a pragmatic choice — partial uniqueness via constraint rather than a trigger.

## Bestanden en wijzigingen

### 1. `src/components/RoleRequestForm.tsx` (nieuw)

- Compact component: dropdown met DOCENT/ADMIN + submit-knop
- Toont bestaande PENDING requests als "in behandeling"
- Blokkeert submit als al een PENDING request bestaat voor die rol
- Zichtbaar voor ingelogde gebruikers die de gevraagde rol nog niet hebben
- Plaatsing: in StudentStudio als klein "Rol aanvragen" knopje in de header, of als sectie op een profielpagina. Pragmatisch voorstel: toon het als een knop in de TopNav die een dialog opent.

### 2. `src/components/RoleRequestsReviewTab.tsx` (nieuw)

- Lijst van PENDING requests met naam, e-mail, school_id, gevraagde rol, datum
- Approve/Reject knoppen per request
- Bij approve: insert in `user_roles` + update status naar APPROVED + set reviewed_by/reviewed_at
- Bij reject: update status naar REJECTED
- Admin ziet alleen DOCENT-requests (+ gefilterd op school_id frontend-side)
- Superuser ziet alles
- Hergebruikt: `MetricCell` (telling PENDING), `SectionLabel`, `Badge`

### 3. `src/pages/AdminPanel.tsx`

- Nieuwe tab "Aanvragen" naast "Gebruikers" in het bestuurlijke blok
- Rendert `RoleRequestsReviewTab`

### 4. `src/components/TopNav.tsx`

- Voeg een klein "Rol aanvragen" icoon/knop toe (alleen zichtbaar als gebruiker LEERLING is en geen hogere rol heeft, of als ze DOCENT zijn en ADMIN willen aanvragen)
- Opent een Dialog met `RoleRequestForm`

## Approve-flow detail

Bij goedkeuring voert de reviewer twee acties uit:

1. `UPDATE role_requests SET status = 'APPROVED', reviewed_by = auth.uid(), reviewed_at = now() WHERE id = ...`
2. `INSERT INTO user_roles (user_id, role) VALUES (request.user_id, request.requested_role)`

Stap 2 is mogelijk dankzij bestaande RLS:

- Admin kan DOCENT inserten (bestaande policy "Admins assign DOCENT role")
- Superuser kan alles inserten (bestaande policy "Superusers manage roles")

## Scope-beperkingen (bewust)

- Geen e-mailnotificatie bij status-wijziging
- Geen domein-mapping of automatische schoolkoppeling
- Schoolscope bij review is frontend-only (geen RLS op school_id in role_requests)
- ADMIN-aanvragen kunnen alleen door SUPERUSER worden goedgekeurd (afgedwongen via RLS: admin kan alleen DOCENT-requests updaten)
- Geen uitnodigingscodes
- Geen automatische ADMIN-toekenning

## Validatiechecklist

1. Kan een leerling een DOCENT-request indienen? → ja
2. Kan een leerling een ADMIN-request indienen? → ja
3. Kan een leerling een SUPERUSER-request indienen? → nee (app + RLS blokkeren)
4. Kan een leerling dubbele PENDING requests maken? → nee (unique constraint)
5. Kan een admin een DOCENT-request goedkeuren? → ja
6. Kan een admin een ADMIN-request goedkeuren? → nee (RLS blokkeert)
7. Kan een superuser alles goedkeuren? → ja
8. Wordt bij approve de rol daadwerkelijk toegevoegd aan user_roles? → ja
9. Bestaande signup-flow voor LEERLING → ongewijzigd

Daarna:

Werk verder vanaf de huidige live stand in Lovable. Gebruik de actuele codebase in Lovable als bron van waarheid.

Doel:

maak “Accountaanvraag Fase 1 — Role Requests” echt af, maar doe dat met een onderzoekende en verifiërende houding voordat je iets nieuws bouwt.

Belangrijke werkhouding:

ik wil niet dat je zomaar doorgaat op basis van eerdere rapportage of aannames. Ik wil dat je eerst expliciet vaststelt wat in de live code nu al echt bestaat, wat maar deels bestaat, en wat nog ontbreekt. Pas daarna bouw je gericht verder.

Belangrijke scope:

- focus alleen op role request fase 1

- geen brede onboarding-herbouw

- geen domein-mapping

- geen e-mailnotificaties

- geen multi-step onboarding

- geen nieuwe zware architectuur

- houd het klein, werkend en bestuurlijk logisch

WERK IN DEZE VOLGORDE

1. Reality-check van de live code

Controleer eerst expliciet of de volgende onderdelen nu echt bestaan in de live Lovable-code:

- `role_requests` migratie

- RLS policies

- `RoleRequestForm`

- `RoleRequestsReviewTab`

- “Aanvragen” tab in `AdminPanel`

- “Rol aanvragen” knop of entrypoint

- approve/reject flow die `user_roles` wijzigt

Voor jezelf en in je rapportage moet je per onderdeel bepalen:

- bestaat volledig

- bestaat deels

- ontbreekt nog

Belangrijke regel:

baseer je niet op eerdere plannen of rapporten. Alleen live code telt.

2. Maak aannames expliciet

Voordat je bouwt:

- benoem kort welke aannames je anders zou maken

- vervang die door wat je daadwerkelijk in de live code hebt vastgesteld

- als iets onduidelijk blijft, kies de kleinste veilige interpretatie

3. Bouw daarna alleen wat nog ontbreekt

Maak role request fase 1 compleet met deze afbakening:

- gebruiker kan een rolverzoek indienen voor `DOCENT` of `ADMIN`

- `SUPERUSER` is nooit aanvraagbaar

- dubbele `PENDING` requests voor dezelfde rol zijn niet mogelijk

- `ADMIN` mag alleen `DOCENT`-verzoeken beoordelen

- `SUPERUSER` mag alles beoordelen

- goedkeuren voegt de rol toe aan `user_roles`

- afwijzen zet status naar `REJECTED`

- bestaande signup als `LEERLING` blijft intact

4. Houd de UI en flow klein

- aanvraagformulier compact

- review-tab in `AdminPanel`

- duidelijke statusweergave

- geen extra complexe onboardingflow

- geen nieuwe dashboardarchitectuur

5. Doe daarna een afrondingscheck

Controleer expliciet of fase 1 nu echt compleet is binnen deze scope, en niet half plan / half implementatie.

OUTPUT DIE IK WIL

1. Wat in de live code al bestond

2. Wat slechts deels bestond

3. Wat nog ontbrak

4. Welke aannames je bewust niet hebt gevolgd

5. Wat je hebt gebouwd of hersteld

6. Welke bestanden je hebt aangepast

7. Per bestand kort wat je hebt veranderd

8. Welke delen van fase 1 bewust nog niet zijn gebouwd

9. Welke beperkingen bewust blijven bestaan

10. Welke handmatige checks ik nu in Lovable moet doen

Belangrijke slotregel:

werk uitvoerend, maar niet blind. Eerst verifiëren, dan pas gericht afbouwen. Bouw alleen wat echt ontbreekt.

&nbsp;