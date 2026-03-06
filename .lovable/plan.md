

## Plan: Contextrijke Beeld-fix

### Probleem

De image prompt in de edge function (regel 97) is nu:
```
Maak een educatief diagram van: ${imagePrompt}. Context: vak=${subject}, niveau=${level}.
```
Dat levert een generiek plaatje op. De rijke curriculum-context (leerdoel, didactische focus, misconcepties) die al beschikbaar is in `curriculum.ts` wordt niet meegegeven.

### Oplossing

De client kent het `currentNodeId` al (zit in `LearnerProfile`). We moeten de curriculum-details meesturen naar de edge function, zodat het image-prompt didactisch verankerd wordt.

### Wijzigingen

**1. `src/services/chatService.ts`** — Curriculum context meesturen bij image requests

- In `sendChat()` en `streamChat()`: als `taskType === 'image'` en `profile.currentNodeId` beschikbaar is, `getNodeById()` aanroepen en een `curriculumContext` object toevoegen aan de request body:
  ```typescript
  curriculumContext: {
    title: node.title,
    description: node.description,
    didactic_focus: node.didactic_focus,
    mastery_criteria: node.mastery_criteria,
    common_misconceptions: node.common_misconceptions
  }
  ```

**2. `supabase/functions/eai-chat/index.ts`** — Image prompt verrijken met curriculum

- `ChatRequest` interface uitbreiden met optioneel `curriculumContext`
- Het image-prompt herschrijven van generiek naar contextrijk:
  ```
  Maak een educatief diagram van: ${imagePrompt}.
  
  DIDACTISCHE CONTEXT:
  - Onderwerp: ${curriculum.title}
  - Focus: ${curriculum.didactic_focus}
  - Beheersingsdoel: ${curriculum.mastery_criteria}
  - Vermijd deze misconcepties visueel: ${curriculum.common_misconceptions}
  - Vak: ${subject}, Niveau: ${level}
  
  Stijl: helder, informatief, labels in het Nederlands.
  ```
- Fallback naar het huidige generieke prompt als er geen curriculum context is

**3. `src/utils/ssotHelpers.ts`** — COMMAND_INTENT voor `/beeld` aanpassen

- De `/beeld` intent wijzigen naar de AI-interne fix-instructie:
  ```
  '/beeld': 'Genereer een educatieve afbeelding die het HUIDIGE onderwerp visueel verduidelijkt. 
  Gebruik door [BEELD: beschrijving] in je antwoord te plaatsen. 
  Alleen bij abstracte concepten waar visuele representatie begrip versterkt. 
  De beschrijving moet specifiek verwijzen naar het actieve leerdoel, NIET generiek zijn.'
  ```

### Resultaat

In plaats van "een plaatje van fotosynthese" krijgt de leerling een diagram dat aansluit op het specifieke leerdoel, de juiste didactische focus heeft, en visueel misconcepties adresseert.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/services/chatService.ts` | Curriculum node ophalen en meesturen bij image requests |
| `supabase/functions/eai-chat/index.ts` | Image prompt verrijken met curriculum context |
| `src/utils/ssotHelpers.ts` | `/beeld` COMMAND_INTENT aanpassen naar contextbewuste fix |

