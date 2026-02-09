

# Radicale Transformatie: Van Chatbot naar Leeromgeving

## Het Probleem

De huidige Student Studio is in essentie een chatvenster met een zijpaneel. Dat is geen leeromgeving. Een leerling die binnenkomt ziet: een lege chat, een input veld, en een knop. Dat is ChatGPT met een ander kleurtje, niet een studio waarin je leert.

## De Visie: Een Driedelig Werkstation

De Student Studio wordt een **drie-zone werkstation** waar de chat slechts een van de panelen is. De leerling werkt in een omgeving die lijkt op een professionele IDE of Bloomberg terminal — maar dan voor leren.

```text
+------------------------------------------------------------------+
|  STUDIO HEADER (48px)                                            |
|  [EAI] | Biologie VWO > DNA Structuur | [Profiel] [Analyse]     |
+------------------------------------------------------------------+
|                    |                          |                   |
|   CONTEXT PANEL    |      WERKGEBIED          |   INSTRUMENT      |
|   (280px, fixed)   |      (flex-1)            |   PANEL           |
|                    |                          |   (360px, toggle) |
|   Leskaart         |   Chat / Conversatie     |                   |
|   - Leerdoel       |                          |   Dashboard       |
|   - Beheersing     |                          |   (bestaand)      |
|   - Misconcepties  |                          |                   |
|   - Studielast     |                          |                   |
|                    |                          |                   |
|   Toolbox          |                          |                   |
|   (inline, niet    |                          |                   |
|    modal)          |                          |                   |
|                    |                          |                   |
|   Voortgang        |                          |                   |
|   [====>     ] 40% |                          |                   |
|                    |                          |                   |
+------------------------------------------------------------------+
```

Op mobiel wordt dit een tabbed interface met drie tabs: Leskaart | Chat | Analyse.

## Concrete Wijzigingen

### 1. StudentStudio.tsx -- Drie-zone layout

**Weg:** Eenvoudig chat-venster met floating knoppen.
**Nieuw:** Resizable drie-kolom layout met `react-resizable-panels` (al geinstalleerd).

- **Links: Context Panel (280px default)** -- Toont de actieve leskaart, inline toolbox, en voortgangsindicator. Dit panel geeft de leerling constant context over WAT ze aan het leren zijn.
- **Midden: Werkgebied** -- De ChatInterface, maar nu zonder eigen context rail (die info zit links).
- **Rechts: Instrument Panel (360px, toggle)** -- Het bestaande Dashboard, nu als resizable paneel in plaats van een overlay.

De TopNav (56px) wordt vervangen door een eigen **Studio Header** (48px) met breadcrumb-navigatie: `EAI > Biologie VWO > DNA Structuur`.

### 2. Nieuw Component: LeskaartPanel.tsx

Een permanent zichtbaar linkerpaneel met:

- **Actief Leerdoel** -- Titel, beschrijving, en mastery criteria uit curriculum.ts
- **Misconcepties Waarschuwingen** -- Rode vlaggen die de leerling alert maken op veelvoorkomende fouten
- **Studielast Indicator** -- Geschatte tijd + hoeveel tijd al besteed deze sessie
- **Inline Toolbox** -- De interventie-tools als compacte knoppen, gegroepeerd per fase. Niet meer als modal, maar altijd beschikbaar in het linkerpaneel. De actieve fase-tab wordt automatisch geselecteerd op basis van de AI-analyse.
- **Lesstof Navigatie** -- Knoppen om naar vorige/volgende node in het leerpad te navigeren

### 3. ChatInterface.tsx -- Gestroomlijnd Werkgebied

De chat wordt gestript tot puur werkoppervlak:

- **Geen eigen Context Rail meer** -- Die info zit nu in het linkerpaneel
- **Verbeterde Empty State** -- Toont een welkomstbericht met de naam van de leerling en het actieve leerdoel. Drie interactieve startkaarten die direct gekoppeld zijn aan het leerdoel (niet generiek).
- **Input Dock** -- Wordt een volledige textarea (niet een input) met markdown-hint, zodat leerlingen langere antwoorden kunnen uitwerken. Send-knop als icon. Toolbox-knop verwijderd (toolbox zit nu links).
- **Loading State** -- Shimmer-bar met "VERWERKEN..." in plaats van bounce-dots.

### 4. MessageBubble.tsx -- Minimale Aanpassingen

- Student berichten: header "OPERATOR" verdwijnt, wordt een clean rechts-uitgelijnde bubble met hover-timestamp
- Systeem berichten: behouden huidige structuur, maar accent stripe (3px indigo links) toegevoegd voor visuele hierarchie

### 5. Dashboard.tsx -- Wordt Inline Panel

- Header wordt compacter (geen "Glass Box" label meer, alleen status indicator)
- Werkt als rechter paneel in de drie-zone layout in plaats van een overlay
- Behoudt alle bestaande analyse-panels

### 6. index.css -- Nieuwe Utilities

- `@keyframes shimmer` voor loading indicator
- `.studio-grid-bg` subtiel grid-patroon voor het werkgebied

### 7. Mobiele Layout

Op schermen kleiner dan `lg` (1024px):
- De drie kolommen worden drie **tabs**: "Leskaart", "Chat", "Analyse"
- Chat-tab is standaard actief
- Swipe-gestures of tab-knoppen onderaan om te wisselen

## Technische Details

### Bestanden die worden aangemaakt:
- `src/components/LeskaartPanel.tsx` -- Nieuw context-paneel

### Bestanden die worden gewijzigd:
1. `src/pages/StudentStudio.tsx` -- Volledige herschrijving naar drie-zone layout
2. `src/components/ChatInterface.tsx` -- Verwijder context rail, verbeter empty state en input
3. `src/components/MessageBubble.tsx` -- Student bubble vereenvoudiging
4. `src/components/Dashboard.tsx` -- Aanpassing voor inline paneel-modus
5. `src/index.css` -- Nieuwe animaties en utilities

### Bestaande dependencies die worden gebruikt:
- `react-resizable-panels` (al geinstalleerd via `src/components/ui/resizable.tsx`)
- Alle bestaande Lucide icons en Tailwind classes

### Constraints:
- Dashboard en MessageBubble blijven `React.FC` (geen forwardRef)
- Strikt Slate kleurenpalet met indigo/emerald/amber als functionele accenten
- Presentation Guard blijft actief
- Geen purple, pink, cyan, neon, of gradients

