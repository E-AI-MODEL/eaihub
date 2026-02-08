
# UI/UX Restoration Plan: EAI Studio Complete Feature Recovery

## Executive Summary

De geüploade originele bestanden onthullen een significant verlies van features en UI/UX polish in de huidige EAI Studio. Dit plan herstelt de volledige feature set terwijl de recente SSOT v15.0.0 integratie behouden blijft.

---

## Gap Analyse: Wat is verdwenen?

### Volledig Ontbrekende Componenten

| Component | Regels | Functie |
|-----------|--------|---------|
| `TechReport.tsx` | 685 | Engineering console met 5 tabs: PAPER, SSOT, TRACE, TELEMETRY, HEALTH |
| `GameNeuroLinker.tsx` | 460 | Canvas-based focus reset game met level progressie |
| `CommandPalette.tsx` | 94 | Doorzoekbare SSOT command bibliotheek |
| `SecretLogin.tsx` | 71 | Beveiligde engineering toegang |

### Verarmde Componenten

| Component | Origineel | Huidig | Verlies |
|-----------|-----------|--------|---------|
| **ChatInterface** | 458 regels | 301 regels | 34% - Toolbox, theming, neural grid, idle timer, game integratie |
| **Dashboard** | 482 regels | 196 regels | 59% - Sliding panel, dimension cards, scaffolding visuals, G-Factor |
| **BootSequence** | 111 regels | 55 regels | 50% - Animated logo, real-time logs, progress bar |

### Utility Bestanden Discrepanties

| Bestand | Origineel | Huidig | Status |
|---------|-----------|--------|--------|
| `ssotParser.ts` | 142 regels | Verwijderd | Logica gemigreerd naar `ssotHelpers.ts` |
| `eaiLearnAdapter.ts` | 497 regels | 331 regels | Behouden maar mist Phase 3/4/5 comments |
| `diagnostics.ts` | 89 regels | 77 regels | Functioneel equivalent |

---

## Architectuur Reconciliatie

### Import Updates (Alle Componenten)

De originele bestanden importeren van `ssotParser.ts` die nu verwijderd is:

```text
// ORIGINEEL (verouderd)
import { getEAICore, SSOTBand, EAI_CORE } from '../utils/ssotParser';

// NIEUW (SSOT v15 compatible)  
import { getEAICore, SSOTBand, EAI_CORE } from '../utils/ssotHelpers';
```

### Service Mapping

De originele `ChatInterface` gebruikt `geminiService.ts` die niet bestaat:

```text
// ORIGINEEL
import { sendMessageToGemini, sendSystemNudge } from '../services/geminiService';

// NIEUW (bestaande service)
import { sendChat } from '@/services/chatService';
```

We moeten `sendSystemNudge` toevoegen aan de bestaande chatService.

---

## Fase 1: Ontbrekende Componenten Toevoegen

### 1.1 GameNeuroLinker.tsx

- Canvas-based focus reset spel
- Geen externe dependencies, direct kopieerbaar
- Level progressie met localStorage highscore
- Touch + keyboard support

### 1.2 CommandPalette.tsx

- Doorzoekbare SSOT command bibliotheek
- Update import: `EAI_CORE` van `ssotHelpers.ts`
- Geen andere wijzigingen nodig

### 1.3 TechReport.tsx (685 regels)

- 5 tabs: PAPER, SSOT, TRACE, TELEMETRY, HEALTH
- Update import: `getEAICore, SSOTBand` van `ssotHelpers.ts`
- Phase 3 G-Factor visualisatie
- TTL breakdown calculator

### 1.4 SecretLogin.tsx

- Engineering console toegang
- PIN-based authenticatie
- Direct kopieerbaar

---

## Fase 2: Dashboard Transformatie

### Huidige Dashboard (196 regels)
- Inline component in grid layout
- Static dimension bars
- Basic agency score

### Originele Dashboard (482 regels)
- Fixed right sliding panel (`isOpen` controlled)
- Expandable dimension cards met click toggle
- Profile context section met edit button
- Semantic Integrity (G-Factor) visualisatie
- Scaffolding history window (visual bars)
- Telemetry forensics (router decision, repair log)

### Wijzigingen

```text
// HUIDIGE Props
interface DashboardProps {
  analysis: EAIAnalysis | null;
  scaffolding?: ScaffoldingState;
}

// ORIGINELE Props (toe te voegen)
interface DashboardProps {
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;  // NIEUW
  isOpen: boolean;                      // NIEUW - sliding panel
  onClose: () => void;                  // NIEUW
  theme: Theme;                         // NIEUW - theming
  isLoading?: boolean;                  // NIEUW
  profile?: LearnerProfile | null;      // NIEUW - context
  eaiState?: EAIStateLike | null;       // NIEUW - history
  onEditProfile?: () => void;           // NIEUW
}
```

### Nieuwe Features
1. Profile context section (naam, niveau, vak, leerjaar)
2. Semantic Integrity (G-Factor) meter met penalties
3. Scaffolding trend bars (history_window visualisatie)
4. Expandable dimension cards met didactic_principle
5. Telemetry forensics (repair attempts, router decision)

---

## Fase 3: ChatInterface Verrijking

### Huidige ChatInterface (301 regels)
- Basic theme selector (7 buttons)
- Simple message list
- Static idle nudge (2 min fixed)
- No toolbox

### Originele ChatInterface (458 regels)
- Dynamic theming met color schemes per modus
- Neural grid background animatie
- Toolbox met 6 categorieën (START, UITLEG, UITDAGEN, CHECK, REFLECTIE, PAUZE)
- Desktop sidebar met dashboard toggle
- Mobile tab navigatie (chat/dashboard)
- Dynamic idle timer (TTL gebaseerd op analysis)
- Game integratie (Neuro-Linker)
- TechReport toegang (double-click EAI logo)
- DidacticLegend modal trigger

### Toe te voegen Features

```text
1. THEMES object (7 kleurschema's met bg, sidebar, border, accent, glow)
2. GET_TOOL_CATEGORIES() - 15+ interventie tools in 6 categorieën
3. Neural grid background met CSS gradient
4. showGame, showTechReport, showLegend state
5. idleTimerRef met calculateDynamicTTL()
6. sendSystemNudge() voor proactieve nudges
7. Desktop sidebar met toolbox access
8. Mobile tab navigatie
```

### Service Extensie

```text
// Toe te voegen aan chatService.ts
export async function sendSystemNudge(
  lastAnalysis: EAIAnalysis,
  profile: LearnerProfile
): Promise<ChatResponse> {
  // Generate nudge based on current state
  // Uses proactive prompting
}
```

---

## Fase 4: BootSequence Animatie

### Huidige BootSequence (55 regels)
- Minimal pulsing dot
- No logs, no progress bar
- Single "Initializing" text

### Originele BootSequence (111 regels)
- Animated EAI core logo (3 rotating circles)
- Real-time boot logs met status icons
- Progress bar (0% - 100%)
- Proper fade-out transition
- Version badge

### Toe te voegen
```text
1. Animated rotating circles (3 nested, different speeds)
2. logs state array voor terminal output
3. progress state (0-100%)
4. Log elke diagnostics result met [OK]/[WARNING]/[CRITICAL]
5. Version badge uit SSOT_DATA.version
```

---

## Fase 5: StudentStudio Orchestratie

### Wijzigingen aan StudentStudio.tsx

```text
// Nieuwe imports
import TechReport from '@/components/TechReport';
import GameNeuroLinker from '@/components/GameNeuroLinker';
import CommandPalette from '@/components/CommandPalette';

// Nieuwe state
const [showGame, setShowGame] = useState(false);
const [showTechReport, setShowTechReport] = useState(false);
const [showCommandPalette, setShowCommandPalette] = useState(false);
const [currentTheme, setCurrentTheme] = useState(THEMES.DEFAULT);
const [eaiState, setEaiState] = useState<EAIStateLike>(createInitialEAIState());

// Pass theme prop naar Dashboard
<Dashboard
  analysis={currentAnalysis}
  mechanical={currentMechanical}
  isOpen={isDesktopDashboardOpen}
  onClose={() => setDesktopDashboardOpen(false)}
  theme={currentTheme}
  profile={profile}
  eaiState={eaiState}
  onEditProfile={() => setShowProfileEdit(true)}
/>

// Render modals
{showGame && <GameNeuroLinker onClose={() => setShowGame(false)} />}
{showTechReport && <TechReport ... />}
{showCommandPalette && <CommandPalette ... />}
```

---

## Fase 6: Type Extensies

### types/index.ts Uitbreidingen

```text
// Toevoegen aan MechanicalState (al aanwezig, verificatie)
interface MechanicalState {
  // ...existing
  routerDecision?: RouterDecision;      // Voor TELEMETRY tab
  semanticValidation?: SemanticValidation;  // Voor G-Factor
  repairLog?: RepairLog;                // Voor TRACE tab
  supervisorLog?: SupervisorLog;        // Voor breaches
}

// Toevoegen aan ScaffoldingState (al aanwezig, verificatie)
interface ScaffoldingState {
  history_window: number[];  // Voor visual bars
}
```

---

## Implementatie Volgorde

| Stap | Component | Actie | Risico |
|------|-----------|-------|--------|
| 1 | `GameNeuroLinker.tsx` | Kopieer, geen wijzigingen | Laag |
| 2 | `CommandPalette.tsx` | Kopieer, update import | Laag |
| 3 | `TechReport.tsx` | Kopieer, update imports | Medium |
| 4 | `SecretLogin.tsx` | Kopieer, geen wijzigingen | Laag |
| 5 | `BootSequence.tsx` | Merge animaties | Laag |
| 6 | `chatService.ts` | Voeg sendSystemNudge toe | Medium |
| 7 | `Dashboard.tsx` | Volledig vervangen met origineel + SSOT updates | Hoog |
| 8 | `ChatInterface.tsx` | Merge met origineel | Hoog |
| 9 | `StudentStudio.tsx` | Orchestratie updates | Medium |

---

## Versie Updates

Alle versiereferenties worden dynamisch uit SSOT geladen:

```text
// BootSequence: "v7.0" -> SSOT_DATA.version (15.0.0)
// TechReport: "EAI CONSOLE v7.0" -> "EAI CONSOLE v15.0"
// CommandPalette: "v3.1" -> "v15.0"
```

---

## Technische Details

### Bestanden die GECREËERD worden

| Bestand | Regels | Bron |
|---------|--------|------|
| `src/components/TechReport.tsx` | ~700 | Origineel + SSOT fixes |
| `src/components/GameNeuroLinker.tsx` | ~460 | Origineel (geen wijzigingen) |
| `src/components/CommandPalette.tsx` | ~95 | Origineel + import fix |
| `src/components/SecretLogin.tsx` | ~71 | Origineel |

### Bestanden die VOLLEDIG VERVANGEN worden

| Bestand | Huidige | Nieuw | Delta |
|---------|---------|-------|-------|
| `Dashboard.tsx` | 196 | ~490 | +294 |
| `BootSequence.tsx` | 55 | ~110 | +55 |

### Bestanden die GEMERGED worden

| Bestand | Huidige | Nieuw | Delta |
|---------|---------|-------|-------|
| `ChatInterface.tsx` | 301 | ~470 | +169 |
| `StudentStudio.tsx` | 114 | ~180 | +66 |
| `chatService.ts` | ? | +50 | sendSystemNudge |

---

## Risico's en Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| geminiService referenties | Hoog | Map naar bestaande chatService |
| Theme type conflicts | Medium | Gebruik consistente Theme interface |
| Dashboard props breaking | Hoog | Optionele props met defaults |
| ssotParser imports | Medium | Alle imports naar ssotHelpers |

---

## Verwacht Resultaat

Na volledige implementatie:
- 4 nieuwe componenten (TechReport, Game, CommandPalette, SecretLogin)
- Dashboard transformeert naar sliding panel met alle originele features
- ChatInterface krijgt toolbox, dynamic theming, en idle timer
- BootSequence toont animated logo en real-time logs
- StudentStudio orchestreert alle nieuwe modals
- Volledige pariteit met originele EAI Studio
