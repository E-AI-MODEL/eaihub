

## Advies: AuthProvider refactor **eerst**, dan Fase 3.5

### Waarom nu en niet later

1. **Kleine scope** — het raakt 2-3 bestanden, ~30 minuten werk
2. **De EITL Wizard (3.5) gaat ook `useAuth()` gebruiken** voor role-checks en school-context. Nog een extra subscriber erbij maakt het erger.
3. **Hoe langer je wacht, hoe meer componenten afhankelijk worden** van de huidige hook-signature — refactor wordt dan pijnlijker.

### Wat verandert er

| Bestand | Actie |
|---------|-------|
| `src/contexts/AuthContext.tsx` | **Nieuw** — `AuthProvider` met één `onAuthStateChange` listener, state + role-fetch, exposed via `useContext` |
| `src/hooks/useAuth.ts` | **Refactor** — wordt een thin wrapper: `return useContext(AuthContext)` |
| `src/App.tsx` | **Wrap** `<AuthProvider>` rond de app (vervangt `SchoolPluginProvider` niet, maar wraps it) |

### Wat blijft gelijk

- Hook-signature (`useAuth()` return type) verandert **niet** — alle consumers blijven werken zonder aanpassing
- `AuthGuard`, `TopNav`, `SchoolPluginProvider`, `AdminPanel` etc. blijven `useAuth()` aanroepen
- Enige verschil: ze lezen nu uit gedeelde context i.p.v. eigen subscriber

### Volgorde

1. **Nu**: AuthProvider refactor (klein, geen breaking changes)
2. **Daarna**: Fase 3.5 EITL Wizard (bouwt op schone auth-laag)
3. **plan.md update**: AuthProvider markeren als tussenstap "Fase 3.x — Auth consolidatie ✅"

