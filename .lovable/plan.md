

## Stap 5-6-7: Auditresultaat — Wat is gedaan, wat ontbreekt

### Samenvatting

De kern van stap 7 (auth, rollen, trigger, AuthGuard, route protection) is **correct geïmplementeerd**. Stap 5 en 6 zijn **gedeeltelijk** gedaan. Hieronder de volledige checklist.

---

### ✅ Afgerond en werkend

| Onderdeel | Status |
|---|---|
| `user_roles` tabel + `has_role()` security definer | ✅ |
| `profiles` tabel met RLS | ✅ |
| DB trigger `handle_new_user` (LEERLING default, bootstrap admin) | ✅ |
| AuthPage: login/signup/forgot, geen client-side role inserts | ✅ |
| ResetPassword pagina | ✅ |
| `useAuth` hook met sessie + rollen | ✅ |
| `AuthGuard` met rolcheck op routes | ✅ |
| Route protection: `/student`, `/teacher` (DOCENT), `/admin` (ADMIN) | ✅ |
| TopNav: rolgebaseerde navigatie + logout + user email | ✅ |
| TopNav: terminologie "Leerling" / "Docent" | ✅ |
| Auto-confirm email ingeschakeld | ✅ |
| LeskaartPanel: fase-context blok (PHASE_CONTEXT) | ✅ |
| LeskaartPanel: voortgangsindicator | ✅ |
| ChatInterface: slash-commando's niet als user message getoond | ✅ |
| MessageBubble: presentation guard (vangnet) | ✅ |
| TeacherCockpit: nuancevelden (confidence, borderline, secondary) | ✅ |
| AdminPanel: nuance-metrics | ✅ |
| Identity: `user?.id \|\| getOrCreateUserId()` fallback in StudentStudio + ChatInterface | ✅ |
| profileService: Supabase + localStorage fallback | ✅ |

---

### ⚠️ Openstaande problemen

#### 1. StudioHeader toont Teacher/Admin knoppen aan ALLE gebruikers (MEDIUM)

**Bestand**: `src/pages/StudentStudio.tsx` regels 377-389

De `StudioHeader` component bevat hardcoded navigatieknoppen naar `/teacher` en `/admin` die aan **iedere ingelogde gebruiker** worden getoond, ongeacht rol. De `AuthGuard` blokkeert ze wel, maar het is verwarrend en inconsistent met de TopNav die deze links wél rolgebonden toont.

**Oplossing**: Conditioneel renderen op basis van rollen (via `useAuth`), of deze knoppen helemaal verwijderen (TopNav doet dit al).

#### 2. Terminologie "Student" nog op LandingPage (LOW)

**Bestand**: `src/pages/LandingPage.tsx`:
- Regel 84: `aria-label="Start Student Studio"`
- Regel 86: `Start Student Hub`
- Regel 117: `<h3>Student Studio</h3>`
- Regel 106: `{/* Student Card */}` (comment)

Volgens de kernafspraak moet zichtbare tekst "Leerling" gebruiken. De knoptekst en kaarttitel zijn zichtbaar.

**Oplossing**: Hernoem naar "Leerling Hub" of "Leerlingomgeving" in zichtbare tekst.

#### 3. `getOrCreateUserId` import nog aanwezig (LOW)

De import en fallback `user?.id || getOrCreateUserId()` in `StudentStudio.tsx` en `ChatInterface.tsx` is functioneel correct als fallback. Maar `getOrCreateUserId` wordt ook nog gebruikt in `adminService.ts` (regel 236) voor system audit. Dit is prima voor admin context maar kan verwarrend zijn.

Geen actie nodig — de fallback is bewust ontworpen.

#### 4. DB trigger toont als "no triggers" in config (INFORMATIONAL)

De `<db-triggers>` section toont "There are no triggers in the database" terwijl de trigger wél in de migratie staat. Dit is waarschijnlijk een weergaveprobleem: de trigger zit op `auth.users` (een reserved schema), waardoor de introspectie het niet oppikt. De trigger werkt wel — dat is geverifieerd via de end-to-end test.

---

### Implementatieplan

Twee kleine wijzigingen om de audit volledig af te ronden:

**1. StudioHeader: verberg Teacher/Admin knoppen voor niet-geautoriseerde gebruikers**
- `src/pages/StudentStudio.tsx`: gebruik `useAuth()` in `StudioHeader` of geef rollen door als prop
- Toon Teacher-knop alleen als `roles.includes('DOCENT') || roles.includes('ADMIN')`
- Toon Admin-knop alleen als `roles.includes('ADMIN')`

**2. LandingPage: terminologie aanpassen**
- `src/pages/LandingPage.tsx`: 
  - "Start Student Hub" → "Start Leerling Hub"
  - "Student Studio" → "Leerlingomgeving"
  - aria-label bijwerken

Beide wijzigingen zijn klein en backwards-compatible. Geen database- of architectuurwijzigingen nodig.

