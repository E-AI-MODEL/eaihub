# Stap 4 — UI uitbreiden voor nuancevelden

**Status: IN UITVOERING**

Stap 1 is afgerond: edge-classificatie is toegevoegd als aparte producer met verplichte fallback.
Stap 2 is afgerond: inhoudelijke validatie is geconsolideerd in reliabilityPipeline.ts, terwijl eaiLearnAdapter.ts is teruggebracht tot state/viewmodel-laag.
Stap 3 is afgerond: EAIAnalysis kan nu optionele nuancevelden dragen:
- confidence
- secondary_bands
- borderline_dimensions

Daarmee is de basis nu stabiel genoeg om stap 4 te definiëren: het gecontroleerd zichtbaar maken van nuance in de UI.

## Doel van stap 4

Stap 4 maakt de in stap 3 toegevoegde nuancevelden zichtbaar in de interface, zonder de bestaande primary classificatie te vervangen.

## Wat stap 4 toevoegt

1. **Confidence zichtbaar maken** — als ondersteunend signaal in cockpit/admin
2. **Borderline-status zichtbaar maken** — als badge/indicator per dimensie
3. **Secondary band zichtbaar maken** — ondergeschikt aan primary band

## Architectuurregel

- primary classificatie blijft leidend
- nuance is aanvullend
- UI toont onzekerheid, maar neemt nog geen nieuwe beslissingen op basis daarvan

## Technische wijzigingen

1. TeacherCockpit: overview-tab + 10D-tab verrijkt met nuancevelden
2. AdminPanel: pipeline-tab aggregate metrics + per-bericht nuance kolommen
3. Chatlog: nuancevelden in inspectieweergave
4. Geen MessageBubble-wijziging voor leerlingweergave
