

## Plan: Implementatie OB nieuw pilot_core curriculum

### Kwaliteitsoordeel van het PVA

Het PVA is gedegen en sluit goed aan op de huidige codebase. De drie JSON-bestanden zijn schoon gestructureerd (7393 regels nodes, 1310 regels paths, 4009 regels source). De aanpak — JSON als bron, TypeScript als loader — is een duidelijke upgrade ten opzichte van de huidige hardcoded demo-data. Het PVA klopt inhoudelijk; hieronder de aangepaste uitvoeringsstappen voor Lovable.

### Wat er verandert

De huidige demo-curriculumlaag (3 hardcoded paden, 11 nodes) wordt volledig vervangen door de SLO pilot_core dataset (~100+ nodes, ~50 paths, 9 leergebieden). De architectuur verschuift van "één TS-bestand met alles" naar "JSON-bronnen + TypeScript loader/mapper".

### Stap 1 — JSON-bestanden plaatsen

Kopieer de drie pilot-bestanden naar `src/data/curriculum/`:
- `curriculum.source.ob.nieuw.pilot_core.json`
- `curriculum.nodes.ob.nieuw.pilot_core.json`
- `curriculum.paths.ob.nieuw.pilot_core.json`

De `school_goals` JSON wordt **niet** opgenomen (buiten pilot scope).

### Stap 2 — Types uitbreiden (src/types/index.ts)

Voeg JSON-bronmodel types toe:

```typescript
// JSON bron-types (corresponderend met de drie JSON-bestanden)
interface CurriculumSourceItem { id, curriculum_layer, subject_code, subject, title, description, level_scope, ... }
interface CurriculumNodeRecord { id, source_refs, path_ref, title, description, mastery: { can_demonstrate, evidence_types }, microsteps, misconceptions, illustrations, tags, ... }
interface CurriculumPathRecord { id, subject_code, subject, title, node_ids, end_goal, level_scope, ... }
```

Bestaande `LearningNode` in `src/types/index.ts` wordt het **runtime-type** en krijgt extra optionele velden:
- `illustrations?: string[]`
- `evidence_types?: string[]`

De dubbele `LearningNode` interface in `src/data/curriculum.ts` wordt verwijderd.

### Stap 3 — Loader bouwen (src/data/curriculumLoader.ts)

Nieuw bestand dat:
1. De drie JSON-bestanden importeert
2. Indexes bouwt (`Map<string, node>`, `Map<string, path>`)
3. Pilot JSON-nodes mapt naar runtime `LearningNode`:
   - `mastery.can_demonstrate[0]` → `mastery_criteria`
   - `misconceptions` → `common_misconceptions`
   - `microsteps` → `micro_steps`
   - `mastery.evidence_types` → `evidence_types`
   - `illustrations` → `illustrations`
   - `didactic_focus` → afgeleid uit `tags.theme[0]` of fallback
4. Exporteert:
   - `getNodeById(nodeId)` — vervangt huidige
   - `getPathById(pathId)` — nieuw, primaire lookup
   - `getPathsBySubject(subjectCode)` — voor UI
   - `getAllSubjects()` — voor ProfileSetup dropdown
   - `PILOT_PATHS` / `PILOT_NODES` — voor admin tellingen

### Stap 4 — curriculum.ts omzetten naar re-export

`src/data/curriculum.ts` wordt een dunne compatibiliteitslaag die re-exporteert vanuit `curriculumLoader.ts`. Alle bestaande imports (`getNodeById`, `getLearningPath`, `CURRICULUM_PATHS`) blijven werken maar lezen nu uit de pilot-data.

### Stap 5 — Consumers aanpassen

**6 bestanden** die curriculum importeren:

| Bestand | Wijziging |
|---|---|
| `TopicSelector.tsx` | Twee-staps selectie: eerst leergebied, dan node. Verwijder `study_load_minutes` weergave. Toon `illustrations` en `microsteps`. |
| `ProfileSetup.tsx` | Vervang hardcoded `SLO_MODULES` door `getAllSubjects()`. Stap 3 wordt leergebied-keuze, stap 4 wordt pad/node-keuze. |
| `ChatInterface.tsx` | Import aanpassen naar loader. GoalPicker werkt al via `getNodeById` — geen structurele wijziging. |
| `ssotHelpers.ts` | `generateCurriculumContext()` verrijken met `microsteps`, `misconceptions`, `illustrations`, `evidence_types`. Verwijder `study_load_minutes` regel. |
| `LeskaartPanel.tsx` | Verwijder `study_load_minutes` weergave. Voeg `microsteps` en `illustrations` secties toe. |
| `adminService.ts` | Vervang `CURRICULUM_PATHS.reduce(...)` door `PILOT_PATHS.length` / `PILOT_NODES.size`. Verwijder `totalStudyTime`. |
| `SessionListItem.tsx` | Import aanpassen — geen structurele wijziging. |

### Stap 6 — study_load_minutes neutraliseren

- Verwijder uit UI-renders (TopicSelector, LeskaartPanel, ProfileSetup)
- Verwijder uit promptcontext (ssotHelpers)
- Behoud als optioneel veld in `src/types/index.ts` voor backward compat

### Wat niet verandert

- SSOT, fixes, promptlogica (ssot.ts, ssotRuntime, ssotValidator)
- Edge functions (eai-chat, eai-classify)
- chatService structuur
- Database/mastery tabellen
- MessageBubble, GoalPicker mechanisme

### Aanpassing op het PVA-document

Het PVA is grotendeels correct. Twee kleine punten ter aanvulling in het .md-bestand:
1. **Fase C3** — `getLearningPath(subject, level)` hoeft niet volledig te verdwijnen maar wordt een compatibiliteitswrapper die intern `getPathsBySubject` aanroept
2. **Fase D2** — `LearnerProfile.subject` en `level` kunnen blijven bestaan maar worden gevuld vanuit de gekozen path in plaats van handmatige invoer

### Uitvoeringsvolgorde

1. JSON-bestanden kopiëren naar `src/data/curriculum/`
2. Types uitbreiden in `src/types/index.ts`
3. `curriculumLoader.ts` bouwen
4. `curriculum.ts` omzetten naar re-export
5. Alle consumers aanpassen (6 bestanden)
6. `study_load_minutes` uit UI verwijderen
7. PVA .md opslaan in `.lovable/` als referentie

