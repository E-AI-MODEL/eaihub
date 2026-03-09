

# Plan: FactoryDiagram naar homepage + inhoud verfijnen

## Wat verandert

### 1. `src/pages/LandingPage.tsx` — Diagram toevoegen
- Nieuwe sectie tussen de role cards en de footer
- Sectietitel: "Hoe verwerkt EAI Hub jouw bericht?" met korte intro (2 zinnen)
- `<FactoryDiagram />` importeren en renderen
- Onderaan een "Meer weten?" link naar `/concept`

### 2. `src/components/FactoryDiagram.tsx` — Inhoud corrigeren

**Feitelijke fouten in huidige versie:**

| Station | Huidig | Werkelijkheid |
|---------|--------|---------------|
| PIPELINE detail | "5 geautomatiseerde stappen" | **9 stappen**: PROMPT_ASSEMBLY → MODEL_CALL → PARSE → REPAIR → SCHEMA_VALIDATE → SSOT_HEAL → EPISTEMIC_GUARD → LOGIC_GATE_CHECK → RENDER |
| PIPELINE modules | 4 items getoond | Modules updaten naar de 9 echte stappen (gegroepeerd weergeven) |
| CLASSIFY modules | "K C P TD V E T S L B" | Klopt, maar detail-tekst moet alle 10 dimensies benoemen met volledige naam |
| CHAT detail | "FAST/MID/SLOW route" | Code kent alleen **FAST** en **SLOW** (geen MID) |
| CHAT modules | "gemini-3-flash / 2.5-pro" | Klopt — FAST = `gemini-3-flash-preview`, SLOW = `gemini-2.5-pro` |
| INPUT modules | "sendMessage(tekst, profiel)" | Mist `sessionId` en `curriculumContext` |
| OUTPUT detail | "Student ziet tekst + voortgang" | Mist: [BEELD:] tag post-processing (image generatie) |

**Informatiever maken (details na klik):**
- Elk station krijgt een extra `whatHappens` veld: een korte zin in gewone taal ("Hier wordt je bericht ontvangen")
- De `detail` tekst (nu al zichtbaar na klik) wordt de technische uitleg
- `modules` worden de concrete componenten/functies
- Zo krijgt de gebruiker eerst overzicht, dan diepte

**Concreet per station:**

1. **INPUT** — whatHappens: "Je typt een vraag. Het systeem voegt automatisch je profiel, vak, niveau en curriculumpositie toe."
2. **AUTH** — whatHappens: "Je identiteit wordt gecontroleerd. Alleen ingelogde gebruikers met de juiste rol mogen door."
3. **SSOT** — whatHappens: "Het didactisch model (10 dimensies, rubrics, interventies) wordt geladen. Als je school een eigen plugin heeft, wordt die hier samengevoegd."
4. **CLASSIFY** — whatHappens: "AI analyseert je bericht langs 10 dimensies: Kennis, Proces, Co-regulatie, Taakdichtheid, Vaardigheid, Epistemisch, Technologie, Sociaal, Transfer en Bias."
5. **PIPELINE** — whatHappens: "Het ruwe AI-antwoord doorloopt 9 automatische controles: van JSON-parsing tot logische kwaliteitsgates."
6. **CHAT** — whatHappens: "Het eindantwoord wordt gegenereerd. Bij standaardvragen met Gemini Flash, bij diep metacognitief werk met Gemini Pro."
7. **DATABASE** — whatHappens: "Alles wordt opgeslagen: je bericht, de analyse, de mechanische staat en je voortgang per leerdoel."
8. **OUTPUT** — whatHappens: "Je ziet het antwoord. Als de AI een [BEELD:] tag heeft geplaatst, wordt er automatisch een afbeelding gegenereerd."

### Technisch
- 2 bestanden wijzigen
- Geen nieuwe dependencies
- Detail-panel toont eerst `whatHappens` (gewone taal), daaronder `detail` (technisch) en `modules` (componenten)
- Diagram blijft ook op ConceptPage staan (hergebruik component)

