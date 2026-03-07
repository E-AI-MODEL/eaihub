# Stap 2 — Dubbele validatie opruimen en edge-classificatie positioneren

## Status

Stap 1 is correct uitgevoerd: er is een aparte edge-classificatie toegevoegd, de bestaande chatflow is intact gebleven, fallback op de client-side analyse is verplicht behouden, en er zijn geen premature UI- of brede type-uitbreidingen doorgevoerd.

De edge-classificatie is op dit moment nog partieel en fungeert daarom als een gecontroleerde producer-upgrade, niet als volledige vervanging van de bestaande analyse.

## Doel van stap 2

Stap 2 bouwt voort op stap 1 door de overlap tussen `reliabilityPipeline.ts` en `eaiLearnAdapter.ts` op te ruimen en expliciet te scheiden:

- welke laag verantwoordelijk is voor **contractuele / technische validatie**
- welke laag verantwoordelijk is voor **inhoudelijke / didactische validatie**
- welke laag de **bron van waarheid** is voor observability en verdere interpretatie

## Probleem

Er bestaan momenteel twee deels overlappende validatie- en interpretatielagen:

- `reliabilityPipeline.ts`
- `eaiLearnAdapter.ts`

Deze doen niet exact hetzelfde, maar overlappen wel in:

- SSOT-validatie
- semantische beoordeling
- G-factor-achtige logica
- logic-gate interpretatie

Dat maakt het onduidelijk:

- welke uitkomst leidend is
- waar observability vandaan komt
- waar toekomstige nuance en uitbreidingen op moeten steunen

## Richting

Stap 2 is bedoeld om de validatieketen te consolideren rond de nieuwe edge-classificatie als primaire producer, terwijl de bestaande fallback tijdelijk beschikbaar blijft totdat de nieuwe bron stabiel en volledig genoeg is.

## Wat stap 2 wel doet

- overlap tussen pipeline en adapter in kaart brengen
- bepalen welke validatie in welke laag thuishoort
- één hoofdpad aanwijzen als bron van waarheid
- adapter reduceren tot state-/viewmodel-laag waar passend
- fallback behouden zolang nodig

## Wat stap 2 niet doet

- geen UI-verrijking
- geen confidence/secondaryBand/borderline als verplichte output
- geen volledige vervanging van fallback in deze stap
- geen nieuwe architectuurlaag voor nuance in de UI
- geen brede type-uitbreidingen buiten wat strikt nodig is

## Gewenst resultaat

Na stap 2 is helder:

- waar technische validatie plaatsvindt
- waar inhoudelijke validatie plaatsvindt
- welke laag leidend is
- hoe edge-classificatie, pipeline en fallback zich tot elkaar verhouden

## Voorwaarde voor vervolgstappen

Pas na een geslaagde stap 2 wordt het zinvol om:

- EAIAnalysis uit te breiden met nuancevelden
- UI aan te passen voor overgang / confidence
- fallback verder af te bouwen
