

# Status Check

## Huidige staat

De **preview draait**. De console logs tonen dat de app rendert (LandingPage, AuthProvider, QueryClientProvider allemaal actief). Er zijn geen runtime crashes.

De build errors in het build-log zijn twee bekende, pre-bestaande issues:

1. **`Cannot find module` errors** (lucide-react, react-router-dom, etc.) en `vite: command not found` -- dit is een dependency installatie issue in de build omgeving, niet een codefout. De dev-server draait wel (preview werkt).

2. **`className` property errors op Radix componenten** -- dit is een bestaande versie-mismatch tussen de geinstalleerde Radix UI packages en hun type definitions. Dit bestond al voor de sync-pulse wijziging.

## De sync-pulse wijziging zelf

Geen fouten veroorzaakt. De `ChatInterface.tsx` wijziging is puur additioneel (state + dot render).

## Plan: Fix de build errors

De Radix `className` errors kunnen opgelost worden door de Radix wrapper componenten te updaten. Dit betreft:

- **`src/components/ui/accordion.tsx`** -- className/children destructuring aanpassen
- **`src/components/ui/alert-dialog.tsx`** -- className prop forwarding fixen  
- **`src/components/ui/select.tsx`** -- idem (raakt ook TopicSelector.tsx)
- **`src/components/ui/progress.tsx`** -- className prop
- **`src/components/TopicSelector.tsx`** -- className props op Select sub-components

De fix is overal hetzelfde patroon: Radix props scheiden van HTML props, en `className` via een wrapper `div`/`span` toepassen of via de Radix `asChild` pattern.

Alternatief (sneller): de Radix packages downgraden naar versies die `className` nog accepteren. Maar dat is een regressierisico.

**Aanbeveling**: Fix de wrapper components zodat ze compatible zijn met de huidige Radix versies. Dit lost alle ~30 className-gerelateerde build errors in een keer op.

