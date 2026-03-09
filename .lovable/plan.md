

# Fix: `getClaims is not a function` — Valt mee

## Diagnose

Beide edge functions (`eai-chat` en `eai-classify`) crashen op **exact dezelfde regel**: `authSupabase.auth.getClaims(token)`. Deze methode bestaat niet in de `@supabase/supabase-js@2.49.1` die ze importeren. Elke chatinteractie faalt hierdoor met een 500-error.

## Omvang

Kleine klus. Twee bestanden, elk **5 regels** vervangen. Geen andere code raakt deze auth-logica.

## Wijzigingen

### 1. `supabase/functions/eai-chat/index.ts` (regels 107-118)

Vervang:
```typescript
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  console.error("[EAI Chat] JWT validation failed:", claimsError);
  return new Response(...);
}
const authenticatedUserId = claimsData.claims.sub;
```

Door:
```typescript
const { data: { user }, error: userError } = await authSupabase.auth.getUser();
if (userError || !user) {
  console.error("[EAI Chat] JWT validation failed:", userError);
  return new Response(...);
}
const authenticatedUserId = user.id;
```

### 2. `supabase/functions/eai-classify/index.ts` (regels 131-141)

Exact dezelfde wijziging: `getClaims(token)` → `getUser()`, `claimsData.claims.sub` → `user.id`.

## Waarom `getUser()` en niet `getClaims()`?

- `getClaims()` is **niet beschikbaar** in `@supabase/supabase-js@2.49.1` (de versie die beide edge functions importeren via esm.sh)
- `getUser()` doet server-side token validatie en retourneert het volledige user-object inclusief `id`
- De Authorization header wordt al meegegeven aan de client, dus `getUser()` valideert automatisch het JWT

## Risico

Nul. De rest van de edge function code gebruikt alleen `authenticatedUserId` voor logging — de variabele naam en waarde (`user.id` = UUID) zijn identiek.

