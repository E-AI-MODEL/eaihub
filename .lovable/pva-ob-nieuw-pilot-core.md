# PVA — Implementatie OB nieuw pilot_core in EAIHUB via Lovable (GitHub-gebaseerd)

## Repo-basis

Dit PVA is nu expliciet gebaseerd op de GitHub-repo:

- `E-AI-MODEL/eaihub`

en op de pilotbestanden:

- `curriculum.source.ob.nieuw.pilot_core.json`
- `curriculum.nodes.ob.nieuw.pilot_core.json`
- `curriculum.paths.ob.nieuw.pilot_core.json`

Doel: de pilot-core set netjes aansluiten op de huidige EAIHUB-architectuur, zonder SSOT, fixes of promptlogica te vervuilen.

---

## 1. Vastgestelde situatie in de GitHub-repo

## 1.1 De huidige curriculumlaag is nog demo-data
In `src/data/curriculum.ts` staat nog een kleine handmatige demo-set met drie leerpaden:
- Biologie VWO
- Wiskunde B VWO
- Economie HAVO

In dezelfde file staan ook:
- een lokale `LearningNode`
- een lokale `LearningPath`
- `CURRICULUM_PATHS`
- `getLearningPath(subject, level)`
- `getNodeById(nodeId)`

Dat betekent dat de huidige curriculumlaag nog hardcoded demo-inhoud is en niet geschikt als eindbron voor de pilot.

## 1.2 `LearningNode` staat dubbel in de repo
Er zijn nu twee definities:

### In `src/data/curriculum.ts`
Velden:
- `id`
- `title`
- `description`
- `didactic_focus`
- `mastery_criteria`
- `common_misconceptions?`
- `study_load_minutes`

### In `src/types/index.ts`
Velden:
- `id`
- `title`
- `description`
- `slo_ref?`
- `didactic_focus`
- `mastery_criteria`
- `example_question?`
- `study_load_minutes?`
- `prerequisite_ids?`
- `micro_steps?`
- `common_misconceptions?`

Conclusie:
- `src/types/index.ts` moet de **enige canonieke typebron** worden
- `src/data/curriculum.ts` mag geen eigen interface-definities meer bevatten

## 1.3 De repo verwacht rijke node-context
De centrale `LearningNode` in `src/types/index.ts` ondersteunt al:
- `prerequisite_ids`
- `micro_steps`
- `common_misconceptions`

Dat betekent dat de repo in principe geschikt is om rijkere curriculumdata te dragen, mits de demo-laag wordt vervangen.

## 1.4 `study_load_minutes` zit nog in het oude model
`study_load_minutes` zit nog in:
- de lokale demo-definitie in `src/data/curriculum.ts`
- de centrale type-definitie in `src/types/index.ts` als optioneel veld

Omdat in de pilot dit veld inhoudelijk niet gewenst is, moet het:
- uit de UI-logica verdwijnen
- niet meer verplicht of leidend zijn
- hooguit tijdelijk backward-compatible blijven

## 1.5 `LearnerProfile` gebruikt nog oude curriculumassumpties
In `src/types/index.ts` heeft `LearnerProfile` nog:
- `subject`
- `level`
- `grade`
- `goal`
- `currentNodeId`

Voor de pilot blijft `currentNodeId` bruikbaar, maar `subject + level` mag niet langer de primaire curriculumlookup zijn.

## 1.6 Mastery is nog niet zuiver inhoudelijk
In de repo is `MasteryStateV2` aanwezig met:
- `pathId`
- `currentNodeId`
- `status`
- `history`

Dat is bruikbaar voor de pilot.

Maar elders in de repo wordt mastery nog niet volledig inhoudelijk gevoed. Dat hoeft in deze pilot niet meteen volledig herbouwd te worden, maar de nieuwe node-laag moet er wel op aansluiten zonder nieuwe vervuiling te introduceren.

---

## 2. Doel van deze implementatie

De implementatie moet:

- alleen draaien op **OB nieuw pilot_core**
- de huidige demo-curriculumlaag vervangen als inhoudsbron
- `source`, `nodes` en `paths` gescheiden houden
- node-context bruikbaar maken voor UI, prompt en mastery
- de bestaande EAIHUB-architectuur respecteren

Niet in scope:
- BB
- supplementary
- school goals
- SSOT-herontwerp
- fixes-herontwerp
- volledige mastery-herbouw
- totale UX-herbouw

---

## 3. Te gebruiken pilotbestanden

Gebruik alleen:

- `curriculum.source.ob.nieuw.pilot_core.json`
- `curriculum.nodes.ob.nieuw.pilot_core.json`
- `curriculum.paths.ob.nieuw.pilot_core.json`

Niet gebruiken in deze pilot:
- supplementary sets
- school_goals
- BB-bestanden
- de oude demo-data als bron

---

## 4. Gewenste eindarchitectuur

De pilot moet deze scheiding hanteren:

### 4.1 Source
Officiële curriculumbron voor de pilot.

### 4.2 Nodes
Kleine inhoudelijke leerstappen.

### 4.3 Paths
Inhoudelijke bundels van nodes.

### 4.4 Runtime
TypeScript-loader en mappers die de JSON-bron omzetten naar wat EAIHUB nodig heeft.

### 4.5 SSOT
Blijft volledig apart.

---

## 5. Implementatieplan

## Fase A — Typehygiëne

### A1. Maak `src/types/index.ts` canoniek
Doel:
- één centrale `LearningNode`
- één centrale `LearningPath`

Actie:
- verwijder lokale interface-definities uit `src/data/curriculum.ts`
- gebruik in de hele repo type-imports vanuit `src/types/index.ts`

### A2. Breid centrale types uit voor JSON-bronmodellen
Voeg types toe zoals:
- `CurriculumSourceItem`
- `CurriculumNodeRecord`
- `CurriculumPathRecord`

Daarnaast één runtime-type voor appgebruik:
- `LearningNode`
- `LearningPath`

### A3. Neutraliseer `study_load_minutes`
Actie:
- maak dit veld niet langer leidend
- verwijder het uit UI en curriculumflow
- behoud het hooguit tijdelijk als optioneel legacy-veld

---

## Fase B — JSON-bronnen toevoegen

### B1. Voeg pilotbestanden toe aan de repo
Aanbevolen map:
- `src/data/curriculum/`

Bijvoorbeeld:
- `src/data/curriculum/curriculum.source.ob.nieuw.pilot_core.json`
- `src/data/curriculum/curriculum.nodes.ob.nieuw.pilot_core.json`
- `src/data/curriculum/curriculum.paths.ob.nieuw.pilot_core.json`

### B2. Laat `src/data/curriculum.ts` niet langer de bron zijn
Nieuwe rol:
- alleen re-export of adapter
- of volledig vervangen door een loaderbestand

---

## Fase C — Loader / mapper bouwen

### C1. Maak een nieuwe loader
Nieuwe file, bijvoorbeeld:
- `src/data/curriculumLoader.ts`

Taken:
- laad source/nodes/paths
- maak indexes
- bied lookupfuncties
- lever runtime-objecten voor de app

### C2. Map pilot-nodes naar runtime-nodes
Aanbevolen mapping:

- `title` -> `title`
- `description` -> `description`
- `mastery.can_demonstrate` -> `mastery_criteria` (samengevoegd of eerste klas veld)
- `misconceptions` -> `common_misconceptions`
- `microsteps` -> `micro_steps`
- `prerequisite_ids` -> `prerequisite_ids`
- `illustrations` -> apart veld of contextveld
- `tags` -> metadata/context
- `didactic_focus` -> afleiden uit node-inhoud of tijdelijk genereren

Belangrijk:
- curriculum-JSON mag niet vervuild worden om het runtime-model te pleasen
- de vertaallaag moet in TypeScript zitten

### C3. Lookup niet meer op `subject + level`
De huidige helper in `curriculum.ts` gebruikt:
- `subject`
- `level`

Voor de pilot moet de hoofdlookup worden:
- via `pathId`
- via `nodeId`

---

## Fase D — UI aanpassen

## D1. `TopicSelector`
Huidig:
- leunt op demo-paths
- verwacht oude structuur

Nieuw:
- gebruik pilot-paths
- toon inhoudelijke bundels
- toon node title + description
- gebruik geen study load

## D2. `ProfileSetup`
Huidig:
- verwacht oude profielstructuur met vak + niveau

Nieuw voor de pilot:
- eenvoudige pilotflow
- kies leergebied / pad / startnode
- of nog eenvoudiger: start op vaste pilotbundel met nodekeuze

Voor de pilot is een vereenvoudigde setup gewenst.

## D3. `LeskaartPanel`
Laat deze alleen werken met:
- title
- description
- mastery
- microsteps
- misconceptions
- illustrations

Niet met:
- study load

---

## Fase E — Chat en promptcontext

## E1. Curriculumcontext in `chatService`
De node-context moet worden opgebouwd uit de nieuwe pilot-nodes.

Gebruik:
- title
- description
- mastery.can_demonstrate
- mastery.evidence_types
- microsteps
- misconceptions
- illustrations
- tags

## E2. Houd SSOT gescheiden
Belangrijk:
- curriculumdata blijft inhoud
- SSOT blijft didactische beslislaag

Dus:
- geen SSOT-velden toevoegen aan curriculum-json
- geen curriculumvelden misbruiken als fix- of routeringsdata

---

## Fase F — Mastery en progress

## F1. Bestaande mastery-flow mag voorlopig blijven
Gebruik:
- `pathId` uit de pilot paths
- `currentNodeId` uit de pilot nodes

## F2. Maak mastery-tekst inhoudelijker
Gebruik `mastery.can_demonstrate` als bron voor zichtbare mastery-criteria.

## F3. Geen grote mastery-herbouw in deze pilot
De pilot moet niet blokkeren op de bestaande technische onzuiverheid rond mastery. Wel moet de nieuwe curriculumlaag die onzuiverheid niet vergroten.

---

## Fase G — Admin / audit

## G1. `adminService`
Huidig:
- denkt nog in demo-nodecounts en study-load

Nieuw:
- node count uit pilot nodes
- path count uit pilot paths
- geen afhankelijkheid van `study_load_minutes`

## G2. Gezondheidschecks
Zorg dat:
- lege curriculumchecks werken
- node totals kloppen
- de app niet crasht op ontbrekende legacyvelden

---

## 6. Uitvoervolgorde voor Lovable

1. Lees de repo op GitHub: `E-AI-MODEL/eaihub`
2. Verwijder dubbele `LearningNode` definitie
3. Voeg pilot-core JSON-bestanden toe
4. Bouw `curriculumLoader.ts`
5. Map pilot records naar runtime nodes/paths
6. Vervang demo-curriculum imports
7. Pas `TopicSelector` aan
8. Pas `ProfileSetup` aan voor pilotflow
9. Pas `LeskaartPanel` aan
10. Pas `chatService` curriculumcontext aan
11. Neutraliseer `study_load_minutes`
12. Pas `adminService` aan
13. Test pilotflow end-to-end

---

## 7. Testplan

### Functioneel
- app start zonder crash
- pilot-core data laadt
- path en node zijn selecteerbaar
- leskaart toont juiste nodegegevens
- chat gebruikt pilot node-context
- mastery kan currentNodeId en pathId gebruiken

### Inhoudelijk
- microsteps zijn zichtbaar bruikbaar
- misconceptions worden goed doorgegeven
- illustrations maken de context concreter
- path is leesbaar als inhoudelijke bundel
- geen supplementary of school goals in de pilotflow

### Technisch
- geen dependency meer op demo `CURRICULUM_PATHS`
- geen blocker op `study_load_minutes`
- typefouten rond `LearningNode` opgelost

---

## 8. Acceptatiecriteria

De implementatie is geslaagd wanneer:

- de pilot draait op `ob.nieuw.pilot_core`
- de demo-curriculumlaag niet meer leidend is
- `LearningNode` niet meer dubbel is gedefinieerd
- `source`, `nodes` en `paths` gescheiden blijven
- UI, chat en mastery met de nieuwe node-ids werken
- `study_load_minutes` geen functionele rol meer speelt
- supplementary en school_goals buiten de pilot blijven

---

## 9. Kort advies aan Lovable

Voer dit niet uit als één nieuw hardcoded `curriculum.ts` bestand.

Gebruik:
- JSON als bron
- TypeScript als loader / mapper / runtime-laag

Zo blijft de implementatie:
- toetsbaar
- uitbreidbaar
- consistent met de huidige EAIHUB-architectuur
- geschikt voor latere uitbreiding naar BB of aanvullende publicaties
