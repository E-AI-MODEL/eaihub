# Stap 5, 6 en 7 — Leerlingervaring, zichtbare kwaliteit per rol, en veilig rollenmodel

**Status: GEÏMPLEMENTEERD**

## Stap 5 — Leerlingervaring
- LeskaartPanel: leercontext-blok met fase-uitleg in begrijpelijke taal
- Terminologie: "Student" → "Leerling" in TopNav en cockpit
- Chat: slash-commando's blijven intern (al geïmplementeerd)
- Presentation guard: actief als vangnet in MessageBubble

## Stap 6 — Kwaliteit zichtbaar per rol
- Leerling: fase-uitleg in Leskaart, geen technische termen
- Docent: TeacherCockpit met nuancevelden (stap 4), didactische kwaliteit
- Admin: AdminPanel met systeemkwaliteit en pipeline metrics

## Stap 7 — Auth en rollenmodel
- Supabase Auth met e-mail/wachtwoord
- Auto-confirm ingeschakeld (development)
- user_roles tabel met LEERLING/DOCENT/ADMIN enum
- has_role() security definer functie
- **Database trigger `handle_new_user`**: automatische roltoewijzing + profielaanmaak bij signup
  - LEERLING: altijd
  - ADMIN + DOCENT: voor vis@emmauscollege.nl
- AuthGuard component voor route protection
- AuthPage: client-side role/profile inserts verwijderd (trigger doet dit nu)
- Identiteit gekoppeld aan auth: `user.id` uit `useAuth` vervangt `getOrCreateUserId()` in StudentStudio en ChatInterface
- profileService: leest uit profiles-tabel met localStorage-fallback
- /auth login/signup pagina
- /reset-password pagina
- TopNav toont rol-gebaseerde navigatie + logout
