

# Plan: Plugin-architectuur activeren

## Huidige situatie (bevestigd in code)
- `loadEffectiveSSOT(schoolId)` bestaat in `ssotRuntime.ts` maar wordt nergens aangeroepen
- `profiles` tabel heeft geen `school_id` kolom
- Alle downstream consumers lezen al via `getEffectiveSSOT()` — geen verdere refactor nodig
- `clearSSOTCache()` bestaat maar wordt nergens aangeroepen

## Drie onderdelen

### 1. Database-migratie: `school_id` op `profiles`

```sql
ALTER TABLE public.profiles ADD COLUMN school_id text;
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
```

- Nullable — bestaande gebruikers houden `NULL` = BASE_SSOT
- Stabiele technische key (bijv. `lyceum-rotterdam`), niet een displaynaam
- RLS is al afgedekt: users lezen/updaten eigen profiel, docenten/admins lezen alle profielen. Het nieuwe veld valt automatisch onder deze bestaande policies.

### 2. Nieuwe hook: `src/hooks/useSchoolPlugin.ts`

- Neemt `user: User | null` als dependency
- Bij `null`: roept `clearSSOTCache()` aan, klaar
- Bij user: fetcht `profiles.school_id` via `supabase.from('profiles').select('school_id').eq('id', user.id).maybeSingle()`
- Bij non-null `school_id`: roept `loadEffectiveSSOT(schoolId)` aan
- Bij null/fout/geen plugin: geen crash, `getEffectiveSSOT()` blijft BASE_SSOT
- Exposeert `isPluginLoading: boolean`
- Cleanup via `cancelled` flag tegen race conditions

### 3. Bootstrap in `App.tsx`

Een `SchoolPluginProvider` component dat:
- Luistert naar auth state via `supabase.auth.onAuthStateChange`
- Bij `SIGNED_IN`: triggert plugin bootstrap via `useSchoolPlugin`
- Bij `SIGNED_OUT`: `clearSSOTCache()`
- Rendert children direct (non-blocking) — plugin is optimistische laag

Plaatsing: onder `QueryClientProvider`, boven `BrowserRouter`. Bewust buiten AuthGuard — dit is applicatiecontext, geen route-logica.

## Wat niet wijzigt
- `ssotRuntime.ts`, `ssotValidator.ts`, `ssot.ts` — al compleet
- Alle UI-componenten — lezen al via `getEffectiveSSOT()`

## Bestanden

| Bestand | Actie |
|---------|-------|
| `profiles` tabel | + `school_id text` kolom (migratie) |
| `src/hooks/useSchoolPlugin.ts` | Nieuw |
| `src/App.tsx` | + `SchoolPluginProvider` wrapper |

