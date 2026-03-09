

# Audit: Geen verdere `getClaims`-achtige fouten

## Resultaat

- `getClaims` komt **nergens** meer voor in de codebase — fix is compleet.
- Beide edge functions (`eai-chat`, `eai-classify`) gebruiken correct `getUser()`.
- Client-side auth (`chatService.ts`) gebruikt correct `supabase.auth.getSession()`.

## Eén resterende warning

De console toont:
```
Warning: Function components cannot be given refs.
Check the render method of `LandingPage`. → FactoryDiagram
```

Dit komt doordat React intern een ref probeert door te geven aan `FactoryDiagram`, dat een gewone function component is zonder `forwardRef`.

### Fix
In `src/components/FactoryDiagram.tsx`: wrap de component met `React.forwardRef`.

```typescript
// Van:
const FactoryDiagram = () => { ... };
export default FactoryDiagram;

// Naar:
const FactoryDiagram = React.forwardRef<HTMLDivElement>((_, ref) => { ... });
export default FactoryDiagram;
```

Eén bestand, 2 regels wijzigen. Geen functionele impact — puur de warning oplossen.

