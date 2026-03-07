

## Verificatie dev-verslag v3

Ik heb de vier kernbestanden nagelopen: `chatService.ts`, `reliabilityPipeline.ts`, `eaiLearnAdapter.ts`, `TeacherCockpit.tsx`, en `types/index.ts`. Het verslag klopt op alle feitelijke claims. Hieronder per punt.

---

### Wat klopt

| Claim | Bewijs |
|---|---|
| **Geen centrale formule** | `generateAnalysis()` (regel 890-982) roept 10 losse `detect*()` functies aan, elk retourneert één band-string. Geen gewichten, geen scoreberekening. |
| **Gates zijn constraints op bestaand label** | `checkLogicGates(knowledgeType)` (regel 869-886) parsed enforcement-strings en kapt TD af. Geen overgangsbeslissing. |
| **Pipeline = heal + guard + validate** | `executePipeline()` in reliabilityPipeline.ts doet exact: SSOT-heal → epistemic guard → semantic validation. Correct beschreven. |
| **eaiLearnAdapter als tweede laag** | Bevat `updateStateFromAnalysis()`, `calculateScaffoldingTrend()`, `calculateGFactor()`, `checkLogicGates()` — een parallelle interpretatie bovenop de pipeline. |
| **UI toont afgeleide labels** | TeacherCockpit regel 323-331: toont `active_fix`, K-band, `agencyScore`, `gFactor`, `alignment_status`, `epistemicGuardResult`, `repairAttempts`, `trend`. Geen brondata. |
| **10D is band-centric** | TeacherCockpit 10D-tab (regel 396+) kiest per rubric één `currentBand`, fallback `${shortKey}0`. Geen overgang/confidence. |
| **EAIAnalysis mist nuancevelden** | `types/index.ts` bevat geen `confidence`, `secondaryBand`, `borderline`, `gateReadiness`, of `rejectedCandidates`. |

### Extra observatie: dubbele validatielagen

Er zijn nu **twee** onafhankelijke validatiepaden die deels hetzelfde doen:
- `reliabilityPipeline.ts` → `healAnalysisToSSOT()` + `calculateSemanticValidation()`
- `eaiLearnAdapter.ts` → `validateAnalysisAgainstSSOT()` + `calculateGFactor()`

Deze overlappen, maar zijn niet identiek. De adapter doet extra fuzzy command-matching (`COMMAND_FUZZY_MAP`) die de pipeline niet heeft. Dit is technische schuld, geen bewust ontwerp.

---

### Moet je deze richting in?

**Het verslag heeft gelijk in de diagnose, maar de voorgestelde 3-lagenarchitectuur is nu te groot.**

Waarom:
- De huidige single-label detectie is **client-side regex** op input/output tekst (zie `detectKnowledgeType()` etc.). Dit is niet de plek waar je confidence/secondary-band gaat berekenen — dat zou in de edge function moeten, waar het LLM de analyse doet.
- De edge function (`eai-chat`) genereert nu alleen tekst, geen gestructureerde analyse. De analyse wordt **volledig client-side opgebouwd** door `generateAnalysis()`.
- Zolang dat zo blijft, is een "parameterbronlaag met confidence" architecturaal misplaatst — je hebt geen rijkere bron om uit te putten.

### Wat ik wél zou doen (pragmatisch)

1. **De dubbele validatie opruimen** — kies één pad (pipeline) en verwijder of degradeer de adapter-validatie
2. **`generateAnalysis()` verplaatsen naar de edge function** — zodat het LLM zelf de 10D-classificatie doet in plaats van client-side regex. Dát is de echte voorwaarde voor rijkere output (confidence, secondary band)
3. **Pas daarna**: `EAIAnalysis` uitbreiden met optionele nuancevelden (`confidence?`, `secondaryBand?`, `borderline?`)

### Wat ik nu niet zou doen

- Een 3-lagenarchitectuur tekenen terwijl de brondata nog regex-gebaseerd is
- `EAIAnalysis` uitbreiden met velden die geen enkele producer kan vullen
- De UI refactoren voor nuance die er nog niet is

---

### Samenvatting

Het verslag is **feitelijk correct** en de analyse is scherp. De aanbevolen richting (constatering → interpretatie → beslissing) is architecturaal juist. Maar de **volgorde** moet zijn:

```text
1. Analyse naar edge function verplaatsen (bronlaag verrijken)
2. Dubbele validatie opruimen (technische schuld)
3. Pas dan: EAIAnalysis uitbreiden met nuancevelden
4. Pas dan: UI aanpassen voor overgang/confidence
```

Niet andersom.

