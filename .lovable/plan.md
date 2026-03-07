
# Strategische roadmap — EAIHUB na dev-verslag v3

## Status

Dit plan is een analyse en roadmap, geen directe codewijziging.
Het legt de afgesproken richting vast.

---

## Context

Na controle van de huidige codebase is bevestigd dat EAIHUB op dit moment werkt als een classificatie- en validatiepijplijn, niet als een centrale gewogen formule.

De huidige volgorde is in essentie:

1. `generateAnalysis()` in `chatService.ts` bouwt client-side een analyse op via losse `detect*()` functies
2. `reliabilityPipeline.ts` doet daarna:
   - SSOT-healing
   - epistemic guard
   - semantic validation
3. `eaiLearnAdapter.ts` bouwt daar nog een extra interpretatie-/toestandlaag bovenop
4. De UI toont vooral afgeleide labels en validaties, niet een rijke bronlaag

---

## Bevestigde diagnose

### 1. Geen centrale formule

De repo bevat nu geen centrale EAI-formule of expliciete wegingsmotor die meerdere parameters eerst combineert en daarna tot één analyse-uitkomst komt.

Wat er nu is:
- losse detectie per dimensie
- daarna constraints
- daarna validatie
- daarna state-/UI-afleiding

### 2. Analyse is nu client-side en single-label

De huidige analyse ontstaat in de frontend en kiest per dimensie direct een band of status.

Gevolg:
- weinig ruimte voor nuance
- geen echte confidence
- geen tweede kandidaat-band
- geen expliciete overgangsstatus

### 3. Dubbele validatie bestaat

Er zijn nu twee deels overlappende lagen:
- `reliabilityPipeline.ts`
- `eaiLearnAdapter.ts`

Deze doen niet exact hetzelfde, maar overlappen wel in:
- SSOT-achtige validatie
- semantische beoordeling
- G-factor-achtige logica
- logic-gate interpretatie

Dat is op dit moment technische schuld, tenzij die scheiding expliciet wordt gemaakt.

### 4. De UI toont vooral afgeleide labels

Teacher/Admin tonen nu vooral:
- active fix, bandlabels, agency, G-factor, alignment, repair-status, trend

Niet:
- rijke bronconstatering
- nuance tussen descriptoren
- confidence / overgangsinformatie

### 5. Onderwijs zit meestal tussen descriptoren

De meeste onderwijsobservaties vallen niet exact binnen één descriptor, maar in de overgangsruimte tussen descriptoren. Descriptoren zijn referentiepunten, niet perfecte containers.

Single-label classificatie mag hooguit een canonieke systeemuitkomst zijn, niet de volledige representatie van de werkelijkheid.

---

## Onderbouwing van de gekozen richting

De architectuurrichting **constatering → interpretatie → beslissing** blijft inhoudelijk juist.

### Waarom die richting klopt

- De parameterconstatering moet bronlaag blijven
- Verschillende UI's hebben verschillende abstractieniveaus nodig
- Bands, gates, trend en interventie zijn afgeleide lagen
- Nuance tussen descriptoren is pas zinvol als de bronlaag rijk genoeg is

### Waarom dit nog niet direct in code moet worden doorgevoerd

- De analyse is nu client-side heuristisch/regex-gebaseerd
- De edge function levert nu alleen tekst terug
- Er is nog geen rijke producer die confidence of secondary band geloofwaardig kan vullen

De richting is juist, maar de **volgorde is cruciaal**.

---

## Wat NIET doen

- EAIAnalysis uitbreiden met nuancevelden zonder producer
- UI refactoren voor confidence/overgang die nog niet bestaat
- Een grote 3-lagenarchitectuur in code uitrollen
- Terugkeer naar een centrale formule als directe oplossing

---

## Afgesproken volgorde

### Stap 1 — Analyse naar edge function verplaatsen

**Doel:** de edge function moet niet alleen tekst genereren, maar ook een rijkere gestructureerde analyse.

**Waarom:** pas dan ontstaat een echte bronlaag; pas dan worden nuancevelden geloofwaardig.

**Gewenst resultaat:** de producer levert meer dan single-label heuristiek.

### Stap 2 — Dubbele validatie opschonen

**Doel:** overlap tussen `reliabilityPipeline.ts` en `eaiLearnAdapter.ts` terugbrengen.

**Waarom:** minder drift, duidelijkere bron van waarheid, betere debugbaarheid.

**Gewenst resultaat:** één hoofdpad voor validatie; tweede laag alleen nog als state-/viewmodel waar nodig.

### Stap 3 — EAIAnalysis uitbreiden met nuancevelden

**Doel:** expliciete ruimte maken voor overgang en onzekerheid.

**Voorbeelden:** `confidence`, `secondaryBand`, `borderline`, `gateReadiness`.

**Waarom:** onderwijsobservaties zitten meestal tussen descriptoren; single-label is onvoldoende als enige representatie.

**Gewenst resultaat:** analyse ondersteunt nuance zonder bestaande logica direct te breken.

### Stap 4 — UI aanpassen

**Doel:** Teacher/Admin/UI laten aansluiten op rijkere analyse.

**Waarom:** pas zinvol zodra de data echt bestaat.

**Gewenst resultaat:** naast primaire labels ook zicht op confidence, overgang, tweede kandidaat, gate-readiness.

---

## Technische schuld

- `eaiLearnAdapter.ts` bevat `validateAnalysisAgainstSSOT()` + `calculateGFactor()` die overlappen met `reliabilityPipeline.ts`
- Adapter heeft extra `COMMAND_FUZZY_MAP` die pipeline mist
- `repairAttempts` is binary (0/1), niet echt aantal — granulaire tellers (`ssotHealingCount`, `commandNullCount`, `parseRepairCount`) zijn toegevoegd maar nog niet in Admin UI

---

## Kernprincipe

De parameterconstatering moet bronlaag blijven.
Interpretatie en beslissing zijn afgeleide lagen.

Niet: alleen eindlabel bewaren.
Maar: eerst constatering, dan interpretatie, dan beslissing.

Die architectuur wordt pas in code doorgevoerd zodra de bronlaag rijk genoeg is.
