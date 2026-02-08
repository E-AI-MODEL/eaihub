
# Grondige Audit: SSOT v15.0.0 Synchronisatie

## Audit Resultaten

### STATUS: SSOT Data (ssot_v15.json)
**Correct geimplementeerd**. De autoritatieve JSON bevat alle 10 rubrics met volledige metadata:

| Rubric ID | Bands | fix | learner_obs | ai_obs | flag | mechanistic | nl_profile |
|-----------|-------|-----|-------------|--------|------|-------------|------------|
| K_KennisType | K0-K3 | Ja | Ja | Ja | - | Ja | - |
| C_CoRegulatie | C0-C5 | Ja | Ja | Ja | Ja | Ja | Ja |
| P_Procesfase | P0-P5 | Ja | Ja | Ja | Ja | Ja | Ja |
| TD_Taakdichtheid | TD0-TD5 | Ja | Ja | Ja | Ja | Ja | Ja |
| V_Vaardigheidspotentieel | V0-V5 | Ja | Ja | Ja | Ja | Ja | Ja |
| T_TechnologischeIntegratieVisibility | T0-T5 | Ja | Ja | Ja | Ja | Ja | Ja |
| E_EpistemischeBetrouwbaarheid | E0-E5 | Ja | Ja | Ja | Ja | Ja | Ja |
| L_LeercontinuiteitTransfer | L0-L5 | Ja | Ja | Ja | Ja | Ja | Ja |
| S_SocialeInteractie | S0-S5 | Ja | Ja | Ja | Ja | Ja | Ja |
| B_BiasCorrectie | B0-B5 | Ja | Ja | Ja | Ja | Ja | Ja |

---

## DISCREPANTIES GEVONDEN

### 1. ConceptPage.tsx - Onjuiste Dimensie Namen

**Locatie:** `src/pages/ConceptPage.tsx` (regel 81-91)

**Probleem:** De UI toont legacy Engels/afwijkende namen die niet overeenkomen met SSOT v15:

| Huidige UI | SSOT v15.0.0 Correcte Naam |
|------------|---------------------------|
| "Cognitive Load" | "Co-regulatie" (C_CoRegulatie) |
| "Precision" | "Procesfase" (P_Procesfase) |
| "Task Difficulty" | "Taakdichtheid" (TD_Taakdichtheid) |
| "Verification" | "Vaardigheidspotentieel" (V) |
| "Engagement" | "Epistemische Betrouwbaarheid" (E) |
| "Time" | "Technologische Integratie Visibility" (T) |
| "Scaffolding" | "Sociale Interactie" (S) |
| "Learning Modality" | "Leercontinuiteit & Transfer" (L) |
| "Behavior" | "Bias & Inclusie" (B) |

---

### 2. Dashboard.tsx - Onjuiste Dimensie Labels

**Locatie:** `src/components/Dashboard.tsx` (regel 11-22)

**Probleem:** `DIMENSION_LABELS` gebruikt legacy Engelse namen:

```typescript
// Huidige (incorrect):
const DIMENSION_LABELS = {
  K: { label: 'Knowledge', description: 'Kennisniveau (K1-K3)' },
  C: { label: 'Cognitive', description: 'Cognitieve belasting' },
  ...
}

// Zou moeten zijn (correct per SSOT):
const DIMENSION_LABELS = {
  K: { label: 'Kennis', description: 'Kennis & Automatisering (K0-K3)' },
  C: { label: 'Co-Regulatie', description: 'Regieverdeling leerling/AI' },
  P: { label: 'Procesfase', description: 'Leerfase context' },
  TD: { label: 'Taakdichtheid', description: 'Verdeling denkhandelingen' },
  V: { label: 'Vaardigheid', description: 'Cognitieve beweging' },
  E: { label: 'Epistemisch', description: 'Betrouwbaarheid van claims' },
  T: { label: 'Tool', description: 'Technologische integratie' },
  S: { label: 'Sociaal', description: 'Sociale interactie context' },
  L: { label: 'Leer', description: 'Continuiteit & Transfer' },
  B: { label: 'Bias', description: 'Bias & Inclusie correctie' },
}
```

---

### 3. Dashboard.tsx - Band Parsing Probleem

**Locatie:** `src/components/Dashboard.tsx` (regel 109)

**Probleem:** De cycle order uit SSOT bevat volledige rubric IDs (bijv. `K_KennisType`), maar de code verwacht korte keys (bijv. `K`):

```typescript
// Huidige code:
const dimensions = SSOT_DATA.metadata.cycle.order; 
// Geeft: ["K_KennisType", "P_Procesfase", ...]

// Maar currentBands verwacht:
bands['K'] = level; // Korte key
```

Dit leidt tot mismatch in de visualisatie.

---

### 4. DidacticLegend.tsx - Incomplete 10D Model

**Locatie:** `src/components/DidacticLegend.tsx`

**Probleem:** Toont alleen K1-K3 en 4 "Modi", maar niet de volledige 10D matrix met alle dimensies en hun bands. Geen koppeling met SSOT data.

---

### 5. Knowledge Levels Sectie - Onjuiste Beschrijvingen

**Locatie:** `src/pages/ConceptPage.tsx` (regel 113-131)

**Probleem:** K3 wordt beschreven als "Diep begrip" met "minimale scaffolding", maar SSOT v15 definieert K3 als:
- **Label:** "Metacognitie"
- **Description:** "plannen, monitoren en evalueren van aanpak"
- **Didactic Principle:** "Zelfregulatie"
- **Logic Gate:** MAX TD2 - AI geeft geen oplossing

---

### 6. RUBRIC_ID_MAP - Semantische Fouten

**Locatie:** `src/data/ssot.ts` (regel 334-345)

**Probleem:** Legacy mapping bevat semantisch incorrecte koppelingen:

```typescript
// Onjuist:
'verification': 'V_Vaardigheidspotentieel',  // V = Vaardigheid, niet Verificatie
'time': 'T_TechnologischeIntegratieVisibility', // T = Tool Awareness, niet Time
'scaffolding': 'S_SocialeInteractie', // S = Sociaal, niet Scaffolding
```

---

### 7. chatService.ts - Ongebruikte Dimensies

**Locatie:** `src/services/chatService.ts`

**Probleem:** Detectie-functies bestaan alleen voor:
- K (detectKnowledgeType)
- P (detectProcessPhase)
- C (detectCoRegulation)
- TD (detectTaskDensity)
- V (detectSkillPotential)
- E (detectEpistemicStatus)

**Ontbreekt:** T, S, L, B dimensies worden niet gedetecteerd, ondanks dat de SSOT volledige patronen bevat.

---

## CORRECTIE PLAN

### Fase 1: UI Labels Synchroniseren

**ConceptPage.tsx** - Vervang de 10 dimensies met SSOT-correcte Nederlandse namen en beschrijvingen:

```typescript
const DIMENSIONS = [
  { code: 'K', name: 'Kennis & Automatisering', desc: 'Type kennis: feiten, procedures, metacognitie' },
  { code: 'C', name: 'Co-regulatie', desc: 'Regieverdeling tussen leerling en AI' },
  { code: 'P', name: 'Procesfase', desc: 'Oriëntatie → Voorkennis → Instructie → Toepassing → Evaluatie' },
  { code: 'TD', name: 'Taakdichtheid', desc: 'Verdeling van denkhandelingen (agency)' },
  { code: 'V', name: 'Vaardigheidspotentieel', desc: 'Cognitieve beweging: verkennen → creëren' },
  { code: 'E', name: 'Epistemische Betrouwbaarheid', desc: 'Status van claims: speculatief → geverifieerd' },
  { code: 'T', name: 'Tool Awareness', desc: 'Begrip van AI als instrument' },
  { code: 'S', name: 'Sociale Interactie', desc: 'Context: solitair → collectief leren' },
  { code: 'L', name: 'Leercontinuïteit', desc: 'Transfer: geïsoleerd → duurzaam' },
  { code: 'B', name: 'Bias & Inclusie', desc: 'Kritisch bewustzijn en correctie' },
];
```

---

### Fase 2: Dashboard Labels

**Dashboard.tsx** - Update `DIMENSION_LABELS` met SSOT-gekoppelde data:

```typescript
// Dynamisch uit SSOT halen:
const getDimensionLabels = () => {
  const labels: Record<string, { label: string; description: string }> = {};
  SSOT_DATA.rubrics.forEach(rubric => {
    const shortKey = rubric.rubric_id.split('_')[0]; // "K_KennisType" -> "K"
    labels[shortKey] = {
      label: rubric.name,
      description: rubric.goal || rubric.dimension || ''
    };
  });
  return labels;
};
```

---

### Fase 3: Cycle Order Fix

**Dashboard.tsx** - Fix de dimension key extraction:

```typescript
// Huidige:
const dimensions = SSOT_DATA.metadata.cycle.order;

// Fix:
const dimensions = SSOT_DATA.metadata.cycle.order.map(id => id.split('_')[0]);
// Resultaat: ["K", "P", "TD", "C", "V", "T", "E", "L", "S", "B"]
```

---

### Fase 4: DidacticLegend Uitbreiden

**DidacticLegend.tsx** - Voeg een 3e tab "Dimensies" toe die dynamisch alle 10 rubrics uit SSOT laadt met hun bands en beschrijvingen.

---

### Fase 5: Knowledge Levels Corrigeren

**ConceptPage.tsx** - Update de K-level beschrijvingen volgens SSOT:

```typescript
const KNOWLEDGE_LEVELS = [
  {
    code: 'K1',
    label: 'Feitenkennis',
    description: 'Termen, definities, eigenschappen. Doel: snel en foutloos ophalen (drillen).',
    logic: 'MAX TD2 - Alleen bevragen, corrigeren, herhalen.'
  },
  {
    code: 'K2',
    label: 'Procedurele Kennis',
    description: 'Handelingen, stappen, beslismomenten. Doel: correct uitvoeren.',
    logic: 'ALLOW TD4 - Modeling toegestaan: voordoen → samen → nadoen.'
  },
  {
    code: 'K3',
    label: 'Metacognitie',
    description: 'Plannen, monitoren, evalueren van aanpak. Doel: betere strategie-keuzes.',
    logic: 'MAX TD2 - Reflectie centraal. AI geeft geen eindconclusie.'
  }
];
```

---

### Fase 6: Missing Detection Functions

**chatService.ts** - Voeg detectie toe voor T, S, L, B dimensies:

```typescript
const tPatterns = getLearnerObsPatterns('T_TechnologischeIntegratieVisibility');
const sPatterns = getLearnerObsPatterns('S_SocialeInteractie');
const lPatterns = getLearnerObsPatterns('L_LeercontinuiteitTransfer');
const bPatterns = getLearnerObsPatterns('B_BiasCorrectie');

function detectToolAwareness(input: string, output: string): string { ... }
function detectSocialInteraction(input: string): string { ... }
function detectLearningContinuity(input: string, output: string): string { ... }
function detectBiasCorrection(input: string, output: string): string { ... }
```

---

### Fase 7: Legacy Map Cleanup

**ssot.ts** - Verwijder of corrigeer de misleidende `RUBRIC_ID_MAP`:

```typescript
// Optie A: Verwijderen (voorkeur)
// export const RUBRIC_ID_MAP = ...

// Optie B: Corrigeren met waarschuwing
/** @deprecated Gebruik getRubric(rubricId) direct met SSOT IDs */
export const RUBRIC_ID_MAP = { ... };
```

---

## Bestanden die worden aangepast

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ConceptPage.tsx` | Dimensie namen en K-level beschrijvingen |
| `src/components/Dashboard.tsx` | DIMENSION_LABELS en cycle order parsing |
| `src/components/DidacticLegend.tsx` | Uitbreiden met 10D matrix tab |
| `src/services/chatService.ts` | Detectie voor T, S, L, B dimensies |
| `src/data/ssot.ts` | Legacy map cleanup + utility functie |

---

## Impact

Na implementatie:
1. Alle UI labels komen overeen met SSOT v15.0.0
2. Dashboard toont correcte dimensie namen en visualisatie
3. DidacticLegend biedt volledige 10D uitleg
4. Alle 10 dimensies worden gedetecteerd in chatService
5. Geen semantische verwarring meer tussen legacy en nieuwe terminologie
