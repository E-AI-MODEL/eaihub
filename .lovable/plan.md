
# EAI Hub Update Plan - GitHub Integratie

## Situatie Analyse

### Huidige Lovable Project Status
Het project heeft een solide basis:
- Landing Page, Student Studio, Teacher Cockpit, Admin Panel (placeholder versies)
- Types, SSOT data, utilities (eaiLearnAdapter, ssotParser, diagnostics)
- Services (analytics, persistence, mastery, profile, identity)
- Dark/Teal design system geimplementeerd

### GitHub Repository (EAIHUB2) Bevat Uitgebreidere Versies
De GitHub repo bevat aanzienlijk meer geavanceerde componenten:

| Component | Lovable (Huidig) | GitHub (Nieuw) |
|-----------|------------------|----------------|
| **SSOT** | 210 regels, 10 rubrics | 1200+ regels, volledige v15.0 met 50+ commands |
| **ChatInterface** | Placeholder | 433 regels met 7 thema's, idle nudges, volledige integratie |
| **Dashboard** | Statische preview | 252 regels met live 10D visualisatie |
| **ProfileSetup** | Niet aanwezig | 280 regels met 3-stappen onboarding |
| **TechReport** | Niet aanwezig | 656 regels met PAPER/SSOT/TRACE/TELEMETRY tabs |
| **MessageBubble** | Niet aanwezig | 106 regels met Markdown/LaTeX support |
| **BootSequence** | Niet aanwezig | 62 regels met diagnostics-integratie |
| **Orchestrator** | Niet aanwezig | 191 regels backend logic (voor Edge Function) |

---

## Update Plan

### Fase 1: SSOT Upgrade (Kritiek)
De huidige SSOT (210 regels) upgraden naar de volledige v15.0 versie (1200+ regels):
- 10 rubrics met gedetailleerde bands (K0-K3, C0-C5, P0-P5, TD0-TD6, etc.)
- 50+ didactische commands met Nederlandse beschrijvingen
- Uitgebreide logic gates voor K1/K2/K3 enforcement
- Mechanistische signatures per band

### Fase 2: Core Components Toevoegen
Nieuwe componenten uit GitHub integreren:
- **ChatInterface.tsx** - Volledige chat met 7 thema's
- **Dashboard.tsx** - 10D Rubric visualizer
- **ProfileSetup.tsx** - 3-stappen onboarding flow
- **MessageBubble.tsx** - Markdown/LaTeX chat bubbles
- **TechReport.tsx** - Developer diagnostics panel
- **BootSequence.tsx** - Animated boot screen
- **DidacticLegend.tsx** - Thema uitleg overlay
- **GameNeuroLinker.tsx** - Gamification component

### Fase 3: Type Definitions Uitbreiden
Types updaten met alle vereiste interfaces:
- Message (met mechanical state)
- AuditEvent, BreachEvent
- ChatRequest, ChatResponse, NudgeRequest
- Extended LearnerProfile

### Fase 4: Student Studio Upgraden
StudentStudio.tsx vervangen met werkende versie:
- ChatInterface integratie
- Profile setup flow
- Dashboard sidebar
- Thema selector

### Fase 5: Teacher Cockpit Verrijken
Uitbreiden met GitHub functionaliteit:
- Live student monitoring
- Assignment management
- Human Gate approval queue
- Real-time analytics visualisatie

### Fase 6: Admin Panel Voltooien
Admin panel completeren met:
- System health monitoring
- SSOT browser (alle rubrics doorzoekbaar)
- Audit log viewer
- Telemetry dashboard

### Fase 7: Gemini Service Voorbereiden
Gemini integratie klaarmaken (zonder API keys in browser):
- apiClient.ts upgraden met edge function endpoints
- Response schema toevoegen
- Anti-leakage filters implementeren

---

## Technische Details

### Nieuwe Bestanden (16 totaal)
```text
src/components/
├── ChatInterface.tsx        (433 regels)
├── Dashboard.tsx            (252 regels)
├── ProfileSetup.tsx         (280 regels)
├── MessageBubble.tsx        (106 regels)
├── TechReport.tsx           (656 regels)
├── BootSequence.tsx         (62 regels)
├── DidacticLegend.tsx       (nieuw)
├── GameNeuroLinker.tsx      (nieuw)
└── CommandPalette.tsx       (nieuw)

src/data/
└── ssot.ts                  (UPDATE: 210 -> 1200+ regels)

src/services/
└── geminiService.ts         (90 regels - API client)
```

### Bestaande Updates (8 bestanden)
```text
src/pages/StudentStudio.tsx      -> Integratie met ChatInterface
src/pages/TeacherCockpit.tsx     -> Live monitoring + approvals
src/pages/AdminPanel.tsx         -> SSOT browser + health checks
src/types/index.ts               -> Uitgebreide type definitions
src/utils/ssotParser.ts          -> Aangepast voor v15.0 SSOT
src/utils/eaiLearnAdapter.ts     -> Minor updates
src/utils/diagnostics.ts         -> Integratie met TechReport
```

### Dependencies Toevoegen
```json
{
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "remark-math": "^6.0.0",
  "rehype-katex": "^7.0.0"
}
```

---

## Implementatie Volgorde

| Stap | Onderdeel | Impact |
|------|-----------|--------|
| 1 | SSOT v15.0 upgrade | Alle rubric logica verrijkt |
| 2 | Types uitbreiden | TypeScript compilatie fix |
| 3 | MessageBubble + BootSequence | Basis UI components |
| 4 | ProfileSetup + Dashboard | Student flow complete |
| 5 | ChatInterface integreren | Student Studio werkend |
| 6 | TechReport + diagnostics | Admin Panel werkend |
| 7 | Teacher features | Cockpit volledig |
| 8 | Gemini service prep | Ready voor backend |

---

## Belangrijke Aandachtspunten

1. **SSOT als Bron van Waarheid** - Alle rubric logica uit de v15.0 SSOT
2. **Logic Gates Respecteren** - K1/K3 triggers HUMAN_GATE voor summatieve impact
3. **Geen API Keys in Browser** - Gemini calls voorbereid voor Edge Functions
4. **Hybrid Persistence** - Werkt offline met localStorage fallback
5. **Markdown/LaTeX Support** - MessageBubble met wiskundige formules

---

## Verwachte Resultaat
Na deze update:
- Volledig werkende Student Studio met chat, profiel setup, en 10D dashboard
- Interactieve Teacher Cockpit met live monitoring
- Complete Admin Panel met SSOT browser en diagnostics
- Production-ready architectuur voor Gemini integratie via Edge Functions
