

# Plan: Repair-inzicht + inklapbare detail-secties in Database-tab

## Probleem
De expanded row toont twee grote JSON-blobs (Analysis + Mechanical) zonder structuur. Je ziet niet **wat** er gerepareerd is, en je scrollt je een ongeluk.

## Oplossing

Vervang de raw JSON-preview (regels 541-560) door een gestructureerde weergave met `Collapsible` secties:

### Nieuwe expanded row structuur

**1. Repair Summary** (altijd zichtbaar als er repairs zijn)
- Drie aparte tellers met labels: `ssotHealingCount`, `commandNullCount`, `parseRepairCount`
- Kleur-gecodeerde badges (groen = 0, geel/rood = >0)
- `semanticValidation.penalties[]` array als bullet-list — dit zijn de concrete repair-redenen
- `logicGateBreach` als die `true` is

**2. Analysis** (inklapbaar, standaard dicht)
- Gestructureerde velden: `process_phases`, `active_fix`, `epistemic_status`, `confidence`, `knowledge_type`, `secondary_dimensions`, `borderline_dimensions`
- Raw JSON achter een extra "Toon JSON" toggle

**3. Mechanical** (inklapbaar, standaard dicht)
- Gestructureerde velden: `model`, `latencyMs`, `routerDecision`, `epistemicGuardResult`, `analysisSource`
- Raw JSON achter een extra "Toon JSON" toggle

### Technische wijziging

**1 bestand: `src/pages/AdminPanel.tsx`** (regels 541-560)

- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- Vervang de `grid grid-cols-2` met `<pre>` door drie collapsible secties
- Repair Summary staat bovenaan zonder collapsible (altijd zichtbaar als relevant)
- Elke sectie heeft een `ChevronDown`/`ChevronRight` indicator

Geschatte wijziging: ~80 regels vervangt ~20 regels.

