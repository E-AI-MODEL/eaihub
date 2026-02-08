
# Masterplan: Dynamische SSOT Integratie

## Executive Summary

Dit plan transformeert de EAI-applicatie van een systeem met **hardcoded didactische data** naar een volledig **SSOT-driven architectuur**. Alle componenten (ConceptPage, DidacticLegend, Dashboard, Edge Function) zullen rechtstreeks uit `ssot_v15.json` lezen, waardoor updates automatisch doorwerken zonder handmatige synchronisatie.

---

## Huidige Situatie: Gap Analysis

### Wat WEL dynamisch is (goed)
| Component | Data Bron | Status |
|-----------|-----------|--------|
| `chatService.ts` | `getLearnerObsPatterns()`, `getLogicGatesForBand()` | Dynamisch |
| `Dashboard.tsx` | `SSOT_DATA.metadata.cycle.order` voor dimensie-volgorde | Gedeeltelijk |
| `AdminPanel.tsx` | Volledige SSOT Browser met live data | Dynamisch |

### Wat HARDCODED is (probleem)
| Component | Hardcoded Data | Regels |
|-----------|----------------|--------|
| **ConceptPage.tsx** | `dimensions[]` array met alle 10 dimensies + bands | ~130 regels |
| **ConceptPage.tsx** | `logicGates[]` array | ~25 regels |
| **DidacticLegend.tsx** | `knowledgeLevels[]` (K1-K3 definities) | ~35 regels |
| **DidacticLegend.tsx** | `logicGates[]` lokale kopie | ~25 regels |
| **DidacticLegend.tsx** | `dimensionMeta{}` (goals hardcoded) | ~12 regels |
| **Dashboard.tsx** | `DIMENSION_LABELS{}` met descriptions | ~12 regels |
| **eai-chat Edge Function** | Volledig statische system prompt | ~130 regels |

**Totaal risico:** ~370 regels die kunnen divergeren van SSOT v15.0.0

---

## Fase 1: Centrale SSOT Utility Layer

### 1.1 Nieuwe utility: `src/utils/ssotHelpers.ts`

Creëer een centrale utility die alle UI-ready data genereert uit de SSOT JSON:

```text
ssotHelpers.ts bevat:

1. getDimensionsForUI()
   - Retourneert array van dimensies met code, name, goal, bands
   - Haalt uit: SSOT_DATA.rubrics + cycle.order

2. getLogicGatesForUI()
   - Retourneert logic gates met trigger, condition, enforcement, priority
   - Haalt uit: SSOT_DATA.interaction_protocol.logic_gates

3. getKnowledgeLevelsForUI()
   - Retourneert K1-K3 met label, description, fix, gate, color
   - Haalt uit: K_KennisType rubric + logic_gates

4. getDimensionMeta()
   - Retourneert styling metadata per dimensie (colors, borders)
   - Combineert rubric data met consistente kleurenschema

5. getDimensionLabels()
   - Retourneert korte labels en descriptions voor Dashboard
   - Haalt uit: rubric.name + rubric.goal

6. generateSystemPrompt(profile)
   - Genereert dynamische system prompt voor edge function
   - Haalt uit: alle rubrics, commands, logic_gates, srl_model
```

### 1.2 Architectuur Diagram

```text
+-------------------+
|  ssot_v15.json    |  <-- Single Source of Truth
+-------------------+
         |
         v
+-------------------+
|   ssotHelpers.ts  |  <-- Centrale transformatie-laag
+-------------------+
    |    |    |    |
    v    v    v    v
+------+ +------+ +------+ +------+
|Concept| |Legend| |Dash  | |Edge  |
|Page   | |      | |board | |Func  |
+------+ +------+ +------+ +------+
```

---

## Fase 2: Component Migratie

### 2.1 ConceptPage.tsx Refactor

**Huidige staat:** 
- Regels 6-135: hardcoded `dimensions[]` array
- Regels 137-159: hardcoded `logicGates[]` array

**Nieuwe implementatie:**
```text
// Verwijder alle hardcoded arrays
// Importeer helpers
import { getDimensionsForUI, getLogicGatesForUI } from '@/utils/ssotHelpers';

// In component:
const dimensions = getDimensionsForUI();
const logicGates = getLogicGatesForUI();
```

**Impact:**
- Dimensie descriptions komen nu uit `rubric.bands[0].description` of dedicated SSOT goal
- Band labels komen uit `band.label`
- Logic gate enforcements zijn volledig uit SSOT

### 2.2 DidacticLegend.tsx Refactor

**Huidige staat:**
- Regels 15-26: hardcoded `dimensionMeta{}` met goals
- Regels 28-63: hardcoded `knowledgeLevels[]`
- Regels 65-88: hardcoded `logicGates[]`

**Nieuwe implementatie:**
```text
import { 
  getDimensionMeta, 
  getKnowledgeLevelsForUI, 
  getLogicGatesForUI 
} from '@/utils/ssotHelpers';

// In component:
const dimensionMeta = getDimensionMeta();
const knowledgeLevels = getKnowledgeLevelsForUI();
const logicGates = getLogicGatesForUI();
```

**Extra verbetering:**
- Goals komen uit `rubric.goal` veld in SSOT
- K-niveau fixes komen uit `band.fix_ref`
- Gate descriptions komen uit `gate.enforcement`

### 2.3 Dashboard.tsx Refactor

**Huidige staat:**
- Regels 12-23: hardcoded `DIMENSION_LABELS{}`

**Nieuwe implementatie:**
```text
import { getDimensionLabels } from '@/utils/ssotHelpers';

// In component:
const DIMENSION_LABELS = getDimensionLabels();
```

---

## Fase 3: Edge Function Dynamische Prompt

### 3.1 Server-side SSOT Loading

De edge function heeft momenteel een 130-regel statische prompt. Dit moet dynamisch worden gegenereerd.

**Optie A: Client-side prompt generation (aanbevolen)**
- Frontend genereert volledige prompt
- Stuurt mee in request body
- Edge function gebruikt deze direct

**Optie B: Bundled SSOT in Edge Function**
- SSOT JSON wordt meegecompileerd in edge function
- Edge function genereert prompt runtime

**Gekozen: Optie A** (eenvoudiger, geen dubbele SSOT)

### 3.2 Nieuwe Edge Function Structuur

```text
eai-chat/index.ts wijzigingen:

1. Request body krijgt nieuw veld:
   systemPrompt?: string  // Optioneel, als niet meegegeven: fallback

2. Frontend genereert prompt via:
   import { generateSystemPrompt } from '@/utils/ssotHelpers';
   const systemPrompt = generateSystemPrompt(profile);

3. chatService.ts stuurt prompt mee:
   body: JSON.stringify({
     ...bestaande velden,
     systemPrompt: generateSystemPrompt(profile)
   })
```

### 3.3 Dynamische Prompt Generator

```text
generateSystemPrompt(profile) genereert:

1. Header sectie (kernprincipes - statisch)
2. 10D Rubric tabellen (uit SSOT_DATA.rubrics):
   - Loop door cycle.order
   - Voor elke rubric: genereer markdown tabel
   - Kolommen: Band | Label | Fix | Principe
3. Logic Gates sectie (uit interaction_protocol.logic_gates)
4. SRL Model (uit srl_model.states)
5. Commands referentie (uit command_library.commands)
6. Context sectie (profile data)
```

---

## Fase 4: E-Dimensie Synchronisatie

### 4.1 Huidige Discrepantie

**SSOT v15.0.0 definities (correct):**
| Band | Label |
|------|-------|
| E0 | Schijnzekerheid |
| E1 | Ongeverifieerd |
| E2 | Bron-Noodzaak |
| E3 | Geverifieerd |
| E4 | Kritisch |
| E5 | Autoriteit |

**Edge function prompt (verouderd):**
| Band | Label |
|------|-------|
| E0 | Ongedefinieerd |
| E1 | Speculatief |
| E2 | Subjectief |
| E3 | Interpretatief |
| E4 | Empirisch |
| E5 | Geverifieerd |

### 4.2 Automatische Fix

Door de prompt dynamisch te genereren uit SSOT vervalt dit probleem automatisch.

---

## Fase 5: SSOT Helper Functies Specificatie

### 5.1 Type Definities

```text
interface DimensionForUI {
  code: string;           // 'K', 'P', 'TD', etc.
  name: string;           // 'Kennis & Automatisering'
  goal: string;           // Uit rubric.goal of bands[0].didactic_principle
  bands: BandForUI[];
}

interface BandForUI {
  id: string;             // 'K1', 'K2', etc.
  label: string;          // 'Feitenkennis'
  description: string;    // Volledige beschrijving
  fix?: string;           // Fix command
  fix_ref?: string;       // Fix reference
  principle?: string;     // Didactisch principe
}

interface LogicGateForUI {
  trigger: string;        // 'K1'
  condition: string;      // 'Feitenkennis'
  enforcement: string;    // 'MAX_TD = TD2'
  description: string;    // Volledige enforcement tekst
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface KnowledgeLevelForUI {
  id: string;             // 'K1'
  label: string;          // 'Feitenkennis'
  desc: string;           // Beschrijving
  gate: string;           // 'MAX_TD = TD2'
  gateDesc: string;       // Gate uitleg
  fix: string;            // '/flits'
  color: string;          // Tailwind class
  border: string;         // Border class
  bg: string;             // Background class
}
```

### 5.2 Kleurenschema Mapping

```text
const DIMENSION_COLORS: Record<string, { text, border, bg }> = {
  K:  { text: 'text-yellow-400',  border: 'border-yellow-500/30', bg: 'bg-yellow-900/10' },
  P:  { text: 'text-cyan-400',    border: 'border-cyan-500/30',   bg: 'bg-cyan-900/10' },
  TD: { text: 'text-orange-400',  border: 'border-orange-500/30', bg: 'bg-orange-900/10' },
  C:  { text: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-900/10' },
  V:  { text: 'text-emerald-400', border: 'border-emerald-500/30',bg: 'bg-emerald-900/10' },
  T:  { text: 'text-pink-400',    border: 'border-pink-500/30',   bg: 'bg-pink-900/10' },
  E:  { text: 'text-purple-400',  border: 'border-purple-500/30', bg: 'bg-purple-900/10' },
  L:  { text: 'text-teal-400',    border: 'border-teal-500/30',   bg: 'bg-teal-900/10' },
  S:  { text: 'text-indigo-400',  border: 'border-indigo-500/30', bg: 'bg-indigo-900/10' },
  B:  { text: 'text-rose-400',    border: 'border-rose-500/30',   bg: 'bg-rose-900/10' },
};
```

---

## Fase 6: Implementatie Volgorde

### Stap 1: Creëer ssotHelpers.ts
- Nieuwe file in `src/utils/`
- Implementeer alle helper functies
- Unit tests voor elke functie

### Stap 2: Migreer Dashboard.tsx
- Kleinste impact, goede test-case
- Vervang `DIMENSION_LABELS` door `getDimensionLabels()`

### Stap 3: Migreer DidacticLegend.tsx
- Vervang alle drie hardcoded arrays
- Test alle tabs (KENNIS, GATES, DIMENSIES)

### Stap 4: Migreer ConceptPage.tsx
- Grootste file, meeste impact
- Vervang dimensions en logicGates arrays
- Verifieer alle UI elementen

### Stap 5: Update chatService.ts
- Voeg `generateSystemPrompt()` aanroep toe
- Stuur dynamische prompt mee naar edge function

### Stap 6: Update eai-chat Edge Function
- Accept optionele `systemPrompt` in request
- Fallback naar basis prompt indien niet meegegeven
- Deploy en test

---

## Fase 7: Validatie & Testing

### 7.1 Automated Checks

```text
Voeg toe aan AdminPanel.tsx SSOT Browser:
- Validatie: Alle rubrics hebben bands
- Validatie: Alle bands hebben fix_ref
- Validatie: Logic gates refereren bestaande bands
- Validatie: Cycle order matcht rubric count
```

### 7.2 End-to-End Tests

| Test | Verificatie |
|------|-------------|
| ConceptPage laadt | Alle 10 dimensies zichtbaar |
| DidacticLegend K-tab | K1-K3 met correcte gates |
| DidacticLegend Gates-tab | 3 logic gates uit SSOT |
| Dashboard 10D bars | Alle dimensies met labels |
| Chat K1 vraag | TD beperkt tot TD2 |
| Chat E-dimensie | Correcte labels (Schijnzekerheid, etc.) |

---

## Fase 8: Rollback Plan

Indien problemen:
1. Alle wijzigingen zijn in aparte commits
2. ssotHelpers.ts is volledig nieuw (geen bestaande code gewijzigd)
3. Components kunnen terugvallen op originele hardcoded arrays door import te switchen

---

## Technische Details

### Bestanden die GEWIJZIGD worden:

| Bestand | Wijziging |
|---------|-----------|
| `src/utils/ssotHelpers.ts` | NIEUW - centrale helper functies |
| `src/pages/ConceptPage.tsx` | Verwijder ~130 regels hardcoded data, import helpers |
| `src/components/DidacticLegend.tsx` | Verwijder ~70 regels hardcoded data, import helpers |
| `src/components/Dashboard.tsx` | Verwijder `DIMENSION_LABELS`, import helper |
| `src/services/chatService.ts` | Voeg prompt generation toe aan request |
| `supabase/functions/eai-chat/index.ts` | Accept dynamische prompt |

### Bestanden die ONGEWIJZIGD blijven:

| Bestand | Reden |
|---------|-------|
| `src/data/ssot_v15.json` | Authoritative source, geen wijzigingen |
| `src/data/ssot.ts` | Bestaande typed wrapper, wordt hergebruikt |
| `src/pages/AdminPanel.tsx` | Al volledig dynamisch |

---

## Verwachte Resultaten

### Voor implementatie:
- 6 plaatsen met potentieel verouderde data
- 370+ regels duplicatie
- E-dimensie labels incorrect in edge function
- Handmatige synchronisatie nodig bij SSOT updates

### Na implementatie:
- 1 source of truth: `ssot_v15.json`
- 0 duplicatie
- Automatische E-dimensie synchronisatie
- SSOT updates werken automatisch door in hele applicatie

---

## Risico's en Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Breaking change in SSOT structuur | Hoog | Type-safe helpers met fallbacks |
| Performance door runtime parsing | Laag | Cache parsed data met useMemo |
| Edge function deployment faalt | Medium | Fallback prompt behouden |
| UI regression | Medium | Uitgebreide visuele tests |

