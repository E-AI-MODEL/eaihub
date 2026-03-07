# Stap 3 — Nuancevelden toevoegen aan analysemodel

**Status: ONTWERP GOEDGEKEURD — klaar voor implementatie**

Stap 1 is afgerond: edge-classificatie is toegevoegd als aparte producer met verplichte fallback.
Stap 2 is afgerond: inhoudelijke validatie is geconsolideerd in reliabilityPipeline.ts, terwijl eaiLearnAdapter.ts is teruggebracht tot state/viewmodel-laag.

Daarmee is de basis nu stabiel genoeg om stap 3 voor te bereiden: het gecontroleerd toevoegen van nuancevelden aan het analysemodel.

## Doel van stap 3

Stap 3 voegt optionele nuancevelden toe aan de analyse, zodat het systeem niet alleen een canonieke classificatie bewaart, maar ook beperkte overgangs- en onzekerheidsinformatie kan dragen.

Deze stap is bedoeld om:
- de analyse rijker te maken
- zonder bestaande logica te breken
- zonder UI al te forceren
- en zonder fallback direct af te schaffen

## Waarom stap 3 nu pas logisch is

Nu pas is deze stap verantwoord, omdat:
- de producer niet meer uitsluitend client-side heuristiek is
- de inhoudelijke validatie nu gecentraliseerd is
- er een helderder bron van waarheid is voor analyse en observability

Daardoor kunnen nuancevelden nu worden toegevoegd als:
- echte optionele uitbreiding
- niet als lege of kunstmatige placeholders

## Ontwerpuitgangspunt

Voor onderwijs geldt:

> De meeste observaties vallen niet exact binnen één descriptor, maar in de overgangsruimte tussen descriptoren.

Daarom moet de analyse uiteindelijk meer kunnen dragen dan alleen:
- één primary band
- één phase
- één density

Maar deze nuance moet in stap 3 nog:
- **optioneel**
- **niet-UI-bindend**
- **backwards-compatible**
blijven.

## Wat stap 3 toevoegt

### Nieuwe optionele velden in `EAIAnalysis`

Voorgestelde velden:
- `confidence?: number`
- `secondary_bands?: Record<string, string>`
- `borderline_dimensions?: string[]`

### Betekenis

#### `confidence`
Globale mate van zekerheid over de analyse-uitkomst.

Doel:
- observability
- latere vergelijking tussen edge-classificatie en fallback
- nog niet bedoeld als UI-hoofdmetric

#### `secondary_bands`
Per dimensie een tweede kandidaat-band, indien relevant.

Voorbeeld:
```json
{ "K": "K3", "P": "P2" }
```

Doel:
- overgangsruimte kunnen representeren
- zonder primary classificatie te vervangen

#### `borderline_dimensions`
Lijst van dimensies waar de classificatie op of nabij een grens ligt.

Voorbeeld:
```json
["K", "P", "TD"]
```

Doel:
- expliciet markeren dat iets geen "harde bak" is
- zonder meteen alle downstream logica om te gooien

## Wat stap 3 wel doet

- EAIAnalysis uitbreiden met optionele nuancevelden
- edge-classificatie toestaan deze velden mee te geven als beschikbaar
- fallback compatibel houden wanneer de velden ontbreken
- pipeline en persistence deze velden laten doorgeven zonder ze verplicht te maken
- observability verbeteren op data-niveau

## Wat stap 3 niet doet

- geen UI-refactor
- geen verplichte rendering van confidence/borderline
- geen wijziging van primary band-logica
- geen wijziging van gates op basis van nuance
- geen afschaffing van fallback
- geen nieuwe centrale formule of wegingsmotor

## Architectuurregel

De nuancevelden zijn in stap 3:
- **aanvullend**
- **optioneel**
- **niet leidend**

Dus:
- primary classificatie blijft de canonieke systeemuitkomst
- nuancevelden verrijken de analyse
- maar beslissingslogica blijft nog op de bestaande primary structuur draaien

## Technische richting

### 1. Types uitbreiden
**Bestand:** `src/types/index.ts`
**Wijziging:** voeg optionele nuancevelden toe aan `EAIAnalysis`

### 2. Edge-producer verrijken
**Bestand:** `supabase/functions/eai-classify/index.ts`
**Wijziging:** edge-classificatie mag `confidence`, `secondary_bands` en `borderline_dimensions` teruggeven — alleen als het model daar voldoende basis voor heeft

### 3. Merge-logica veilig houden
**Bestand:** `src/services/chatService.ts`
**Wijziging:** `mergeEdgeAnalysis()` moet deze velden veilig meenemen — ontbreken van deze velden mag niets breken

### 4. Pipeline compatibel houden
**Bestand:** `src/lib/reliabilityPipeline.ts`
**Wijziging:** pipeline hoeft deze velden in stap 3 niet inhoudelijk te gebruiken, maar mag ze ook niet verliezen of overschrijven

## Acceptatiecriteria

Stap 3 is pas geslaagd als:
- EAIAnalysis backwards-compatible blijft
- bestaande chatflow blijft werken
- fallback blijft werken zonder nuancevelden
- edge-classificatie nuancevelden optioneel kan teruggeven
- pipeline de nieuwe velden niet afbreekt
- er geen UI-regressie is

## Risico's

### 1. Schijnprecisie
Een confidence-veld kan te exact lijken.
**Mitigatie:** voorlopig alleen gebruiken als observability-signaal, nog niet als harde beslisinput

### 2. Te vroege UI-koppeling
Nieuwe velden kunnen verleiden tot directe UI-wijzigingen.
**Mitigatie:** expliciet buiten scope houden in stap 3

### 3. Drift tussen producer en fallback
Fallback zal deze velden meestal niet vullen.
**Mitigatie:** velden optioneel houden, `analysisSource` blijven gebruiken voor interpretatie van dat verschil

## Gewenst resultaat

Na stap 3:
- kan de analyse meer nuance dragen
- blijft de bestaande architectuur stabiel
- ontstaat een fundament voor latere UI-uitbreiding
- en wordt overgangsinformatie eindelijk modelleerbaar, zonder de primary classificatie te vervangen

## Voorwaarde voor stap 4

Pas na een geslaagde stap 3 wordt het zinvol om stap 4 te doen:
- UI uitbreiden voor confidence
- borderline zichtbaar maken
- secondary bands waar relevant tonen
- eventueel later gates of interventielogica voorzichtig verrijken

## Samenvatting

Stap 3 voegt optionele nuancevelden toe aan het analysemodel, zodat de classificatie niet langer alleen een canoniek eindlabel draagt, maar ook beperkte onzekerheids- en overgangsinformatie kan bevatten.

Dit gebeurt:
- zonder UI-verplichting
- zonder primaire logica te vervangen
- en zonder fallback af te schaffen

De primary analyse blijft leidend; nuance wordt in deze stap toegevoegd als gecontroleerde verrijking.
