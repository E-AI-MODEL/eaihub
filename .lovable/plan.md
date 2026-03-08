

# Fix: ObservabilityPanel edge/client ratio leest verkeerd veld

## Probleem
`analysisSource` staat op `mechanical` (niet `analysis`). ObservabilityPanel r104-106 leest `m.analysis.analysisSource` — vindt niets, telt altijd 0.

## Fix
In `src/components/ObservabilityPanel.tsx`, in de edge/client tel-loop (r100-108):

**Was:**
```ts
const a = m.analysis as Record<string, unknown> | null;
if (!a) continue;
const src = a.analysisSource as string | undefined;
```

**Wordt:**
```ts
const mech = m.mechanical as Record<string, unknown> | null;
if (!mech) continue;
const src = mech.analysisSource as string | undefined;
```

## Impact
- 1 bestand, 3 regels
- Alle 4 metric-lijnen zijn daarna correct aangesloten
- Fase 5 Observability is dan volledig functioneel

