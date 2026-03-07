## Zeker — hier is je tekst herschreven in een strakkere, bruikbare vorm.

&nbsp;

&nbsp;

**Plan: 4 patches — observability ontsluiten + restcode opruimen**

&nbsp;

&nbsp;

&nbsp;

**Bevestigde bevindingen**

&nbsp;

&nbsp;

1. tryParseWithRepair, repairJson en stripCodeFences hebben repo-breed geen callers buiten reliabilityPipeline.ts zelf en kunnen dus veilig worden verwijderd.
2. epistemicGuard en healingEvents worden wel berekend in executePipeline(), maar niet opgenomen in enhancedMechanical. Daardoor komen ze ook niet in chat_messages.mechanical terecht en zijn ze in de Admin-omgeving niet zichtbaar.
3. De huidige Database-tab toont alleen basisvelden zoals naam, vak, status, aantal berichten, tijd en content. De rijkere analysis- en mechanical-velden blijven onzichtbaar.
4. De health check straft een mislukte self-test nu met -50, wat buiten verhouding zwaar is.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Patch 1 — dode parse/repair-code verwijderen**

&nbsp;

&nbsp;

Bestand: src/lib/reliabilityPipeline.ts

&nbsp;

&nbsp;

**Wijzigingen**

&nbsp;

&nbsp;

- Verwijder stripCodeFences()
- Verwijder repairJson()
- Verwijder tryParseWithRepair()
- Schoon de exports op zodat deze functies niet meer worden geëxporteerd
- Laat de rest van de pipeline intact:  

  - healAnalysisToSSOT
  - epistemicGuard
  - calculateSemanticValidation
  - executePipeline
  - trace-systeem
- &nbsp;

&nbsp;

&nbsp;

&nbsp;

**Reden**

&nbsp;

&nbsp;

Deze parse/repair-laag wordt in de huidige architectuur niet meer gebruikt. executePipeline() ontvangt al een geparsed analysis-object en niet langer ruwe JSON.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Patch 2 — pipeline-data persistent maken**

&nbsp;

&nbsp;

Bestanden:

&nbsp;

- src/lib/reliabilityPipeline.ts
- src/types/index.ts

&nbsp;

&nbsp;

&nbsp;

**Probleem**

&nbsp;

&nbsp;

In executePipeline() wordt nu alleen dit opgeslagen in enhancedMechanical:

&nbsp;

- repairAttempts
- semanticValidation

&nbsp;

&nbsp;

Maar niet:

&nbsp;

- epistemicGuard
- healingEvents

&nbsp;

&nbsp;

Daardoor gaat een deel van de observability verloren voordat het via persistChatMessage() in chat_messages.mechanical belandt.

&nbsp;

&nbsp;

**Wijziging in**

**reliabilityPipeline.ts**

&nbsp;

&nbsp;

Breid enhancedMechanical uit met aanvullende pipeline-data, bijvoorbeeld:

const enhancedMechanical: MechanicalState = {

  ...mechanical,

  repairAttempts: healingEvents.length > 0 ? 1 : 0,

  semanticValidation,

  epistemicGuardResult: {

    label: epistemicResult.label,

    notes: epistemicResult.notes,

    confidence: epistemicResult.confidence,

  },

  healingEventCount: healingEvents.length,

};

&nbsp;

**Wijziging in**

**types/index.ts**

&nbsp;

&nbsp;

Voeg aan MechanicalState toe:

epistemicGuardResult?: {

  label: 'OK' | 'CAUTION' | 'VERIFY';

  notes: string;

  confidence: number;

};

healingEventCount?: number;

&nbsp;

**Resultaat**

&nbsp;

&nbsp;

Deze data wordt automatisch meegenomen in persistChatMessage() en opgeslagen in chat_messages.mechanical, zonder schemawijziging, omdat het veld al JSONB is.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Patch 3 — Admin Panel uitbreiden met Pipeline-tab en rijkere DB-weergave**

&nbsp;

&nbsp;

Bestand: src/pages/AdminPanel.tsx

&nbsp;

&nbsp;

**Nieuwe tab:**

**Pipeline**

&nbsp;

&nbsp;

Voeg een aparte tab toe voor pipeline-observability.

&nbsp;

&nbsp;

**Data-bron**

&nbsp;

&nbsp;

Gebruik bestaande fetchChatMessages() en filter op berichten met:

&nbsp;

- role === 'model'

&nbsp;

&nbsp;

&nbsp;

**Te tonen aggregaties**

&nbsp;

&nbsp;

- totaal aantal berichten met repairs (repairAttempts > 0)
- gemiddelde gFactor
- alignment-verdeling:  

  - OPTIMAL
  - DRIFT
  - CRITICAL
- &nbsp;
- epistemische status-verdeling uit analysis.epistemic_status
- epistemic guard-verdeling uit mechanical.epistemicGuardResult.label

&nbsp;

&nbsp;

&nbsp;

**Detailweergave per bericht**

&nbsp;

&nbsp;

Toon per modelbericht bijvoorbeeld:

&nbsp;

- timestamp
- model
- latency
- gFactor
- repair count
- epistemic status
- epistemic guard label

&nbsp;

&nbsp;

&nbsp;

**Belangrijk**

&nbsp;

&nbsp;

Gebruik overal defensieve uitlezing:

&nbsp;

- mechanical?.semanticValidation?.gFactor ?? null
- analysis?.epistemic_status ?? null

&nbsp;

&nbsp;

Zo blijft de UI ook bruikbaar voor oudere records die deze velden nog niet bevatten.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Uitbreiding bestaande Database-tab**

&nbsp;

&nbsp;

Breid de berichtenweergave uit met compacte badges of metadata voor:

&nbsp;

- phase → analysis?.process_phases?.[0]
- TD → analysis?.task_densities?.[0]
- K-level → analysis?.coregulation_bands?.find(b => b.startsWith('K'))
- gFactor → mechanical?.semanticValidation?.gFactor
- repairs → mechanical?.repairAttempts
- epistemic_status → analysis?.epistemic_status

&nbsp;

&nbsp;

Voeg daarnaast een uitklapbare JSON-preview toe per rij voor:

&nbsp;

- analysis
- mechanical

&nbsp;

&nbsp;

&nbsp;

**Resultaat**

&nbsp;

&nbsp;

De Database-tab wordt daarmee niet alleen opslag-inzichtelijk, maar ook didactisch en technisch diagnostisch bruikbaar.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Patch 4 — health check robuuster en realistischer maken**

&nbsp;

&nbsp;

Bestand: src/services/adminService.ts

&nbsp;

&nbsp;

**Doel**

&nbsp;

&nbsp;

De huidige health score moet minder hard straffen en beter aansluiten op de echte runtime-situatie.

&nbsp;

&nbsp;

**Wijzigingen**

&nbsp;

&nbsp;

1. Voeg een lichte bereikbaarheidstest toe voor de edge function eai-chat
2. Gebruik daarvoor een OPTIONS-request met timeout
3. Behandel onbereikbaarheid als WARNING, niet als CRITICAL
4. Verlaag de impact van een mislukte self-test van -50 naar -20

&nbsp;

&nbsp;

&nbsp;

**Richting**

&nbsp;

&nbsp;

In plaats van te spreken over apiKeyConfigured, is het nauwkeuriger om te meten of de backendroute bereikbaar is, bijvoorbeeld als:

&nbsp;

- edgeFunctionReachable: true | false

&nbsp;

&nbsp;

&nbsp;

**UI-aanpassing**

&nbsp;

&nbsp;

Pas in de Admin UI het label aan van:

&nbsp;

- API Key

&nbsp;

&nbsp;

naar:

&nbsp;

- Gateway bereikbaar

&nbsp;

&nbsp;

&nbsp;

**Resultaat**

&nbsp;

&nbsp;

De health check zegt dan iets echts over runtime-beschikbaarheid, zonder opnieuw een valse client-side sleutelcontrole te introduceren.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Bestandenoverzicht**

&nbsp;


|                                |                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| **Bestand**                    | **Wijziging**                                                                       |
| src/lib/reliabilityPipeline.ts | verwijder dode parse-functies en sla extra pipeline-observability op in mechanical  |
| src/types/index.ts             | voeg epistemicGuardResult en healingEventCount toe aan MechanicalState              |
| src/pages/AdminPanel.tsx       | voeg Pipeline-tab toe en breid de Database-tab uit met analysis/mechanical metadata |
| src/services/adminService.ts   | maak health check realistischer via edge-function-ping en mildere score-impact      |


&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Wat dit oplevert**

&nbsp;

&nbsp;

- pipeline-observability wordt eindelijk zichtbaar in de Admin UI
- epistemic guard, repairs en gFactor zijn niet langer verborgen interne data
- de Database-tab laat echte mechanische en didactische metadata zien
- dode code verdwijnt
- de health score wordt geloofwaardiger en minder misleidend

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Vervolgonderzoek / doorvragen**

&nbsp;

&nbsp;

Daarna zou ik meteen deze punten nalopen:

&nbsp;

1. Welke pipeline-data wordt nog steeds alleen in memory gehouden en nooit opgeslagen, zoals traceBuffer?
2. Zijn er nog andere velden in MechanicalState die wel bestaan maar nergens zichtbaar zijn, zoals routerDecision, logicGateBreach, supervisorLog of softValidationLog?
3. Zijn er in teacher- of dashboardschermen nog statuslabels of badges die niet op echte data gebaseerd zijn?
4. Is de Pipeline-tab onafhankelijk genoeg geladen, of blijft die per ongeluk afhankelijk van eerst de Database-tab openen?
5. Zijn er nog oudere of half-aangesloten componenten rond EAIAnalysis, Dashboard of analyticsService die nog steeds defaults of schijnwaarden tonen?

&nbsp;

&nbsp;

&nbsp;