

# Mini-feature: Sync timer indicator in ChatInterface

## Wat

Een subtiele pulse-indicator rechtsonder in het chatvenster die de 10s sync-cyclus visualiseert. Geen countdown-cijfers (te druk), maar een kleine dot/icoon die:
- Kort oplicht (groen pulse) wanneer een sync succesvol is gepusht
- Daarna langzaam dimt tot de volgende push

## Hoe

**Bestand: `src/components/ChatInterface.tsx`**

1. Voeg een `syncPulse` state toe (`boolean`, default `false`)
2. In de `pushState` callback: zet `syncPulse` op `true`, dan na 800ms terug op `false`
3. Render een klein element in de input dock area (linksboven of rechtsonder bij de "Wis" knop):
   - Een 6px dot met `bg-emerald-500` die animated van `opacity-100` naar `opacity-20` over 10s
   - Tooltip: "Sessie sync · elke 10s"
   - CSS transition via Tailwind `animate-pulse` of custom keyframe

Visueel voorbeeld:
```text
┌─────────────────────────────────┐
│  chat messages...               │
│                                 │
├─────────────────────────────────┤
│ ⟳ Wis  [textarea...]  [Send]   │
│                          ● sync │  ← kleine groene dot
└─────────────────────────────────┘
```

Eén bestand, ~15 regels extra code.

