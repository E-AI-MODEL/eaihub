# Analyse: Landing Page Header & Navigatie

## Huidige situatie

De landing page heeft een eigen nav-bar met directe links naar `/student`, `/teacher`, `/admin` plus een "Start EAI Hub" knop naar `/auth`. Problemen:

1. **Leerling/Docent/Admin links zijn misleidend** — niet-ingelogde gebruikers worden toch doorgestuurd naar `/auth`. De links suggereren dat je direct naar een omgeving kunt, maar dat kan niet zonder login.
2. **Op mobiel (393px) is Admin verborgen** (`hidden sm:block`) — inconsistent.
3. **Superuser heeft geen aparte vermelding** — correct, superuser logt in via `/auth` en gebruikt `/admin`. Geen wijziging nodig.

## Voorstel

**Optie A — Minimaal: verwijder de losse rollinks uit de header-nav**

- Houd alleen "Architectuur & Uitleg" en "Start EAI Hub" in de header. Check voor een bijlassendere naam dan architectuur en uitleg.
- De rolkaarten (Leerling / Docent / Admin) lager op de pagina doen het uitlegwerk al — die linken naar `/auth` in plaats van direct naar de beschermde routes
- Resultaat: schoner, geen misleidende directe links

**Optie B — Behoud rollinks, maar stuur naar `/auth**`

- Leerling, Docent, Admin blijven in de header maar linken allemaal naar `/auth` (eventueel met een query param zoals `?intent=teacher`)
- Minder verwarrend, maar de rolkaarten doen hetzelfde al

**Aanbeveling: Optie A** — de header wordt schoner, de rolkaarten op de pagina zijn de echte doorverwijzing. De rolkaarten zelf zouden ook naar `/auth` moeten linken in plaats van naar de beschermde routes.

## Wijzigingen

### `src/pages/LandingPage.tsx`

- **Header nav**: verwijder Leerling/Docent/Admin links, behoud "Architectuur & Uitleg" + "Start EAI Hub"
- **Rolkaarten**: wijzig de `to` van `/student`, `/teacher`, `/admin` naar `/auth` — zodat de gebruiker altijd eerst inlogt
- Eventueel de kaarttekst licht aanpassen: "Log in als leerling" i.p.v. directe navigatie suggestie

### Geen wijziging aan:

- `TopNav.tsx` (is al verborgen op `/`)
- `AuthGuard.tsx` (redirect werkt al correct)
- Superuser-routing (logt in via `/auth`, gebruikt `/admin` — correct)