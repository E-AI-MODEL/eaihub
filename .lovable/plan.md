

## Plan: Rebranding "EAI Studio" → "EAI Hub"

De gepubliceerde URL is `eaihub.lovable.app` — de officiële naam is dus **EAI Hub**, niet "EAI Studio". Alle vermeldingen moeten consistent worden.

### Scope

33 vermeldingen van "EAI Studio" in 4 bestanden, plus de nav overlap fix uit het vorige plan.

### Wijzigingen

| Bestand | Wat |
|---------|-----|
| `src/pages/LandingPage.tsx` | 4× "EAI Studio" → "EAI Hub", nav overlap fix (gap/padding verkleinen, glow verwijderen op mobiel) |
| `src/components/TopNav.tsx` | 1× "EAI Studio 15.0" → "EAI Hub 15.0" |
| `src/components/BootSequence.tsx` | 1× "EAI STUDIO" → "EAI HUB" |
| `src/components/ProfileSetup.tsx` | 1× "EAI Studio" → "EAI Hub" |

`src/types/index.ts` en `src/data/curriculum.ts` zeggen al "EAI Hub" — die zijn correct.

Totaal: 7 string replacements + de nav mobiele spacing fix.

