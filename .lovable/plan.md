
# EAI Hub - Implementatieplan

## 🎯 Projectoverzicht
Een AI-ondersteund leerHUB van EAI voor voortgezetonderwijs.

---

## 📱 Fase 1: Fundament & Landing Page

### 1.1 Landing Page
- **Hero sectie** met animatie en branding "EAI Studio 10.0"
- **Feature highlights** voor de drie gebruikersrollen (Student, Docent, Admin)
- **Call-to-action** knoppen naar de verschillende dashboards
- **Responsive design** met dark theme (Slate 950 + Teal accenten)

### 1.2 Navigatie
- **Top navigation bar** met role-based routing
- **Conditional visibility** (verborgen op landing/concept pages)
- **Active state indicators** met teal highlighting

---

## 🎓 Fase 2: Student Studio

### 2.1 Chat Interface
- **Real-time AI conversatie** met message bubbles
- **7 didactische thema's** (Default, Devil's Advocate, Meta, Creative, Coach, System, Pragmatic)
- **Model selectie** (Gemini Flash vs Pro)
- **Idle nudges** die studenten activeren na inactiviteit

### 2.2 Scaffolding Visualisatie
- **10D Rubric Dashboard** met live feedback op alle dimensies
- **Knowledge Level indicators** (K1/K2/K3)
- **Agency score tracking** met trend visualisatie
- **Repair badges** wanneer AI-output wordt gecorrigeerd

### 2.3 Profiel Setup
- **5-stappen onboarding flow**
- **Vak, niveau, leerdoel selectie**
- **Opslaan in localStorage/Supabase**

---

## 👨‍🏫 Fase 3: Teacher Cockpit

### 3.1 Klassikaal Dashboard
- **Live overzicht** van alle actieve student-sessies
- **Real-time analytics** per student
- **Interventie mogelijkheden** om scaffolding aan te passen

### 3.2 Run Approval System
- **Queue van lopende opdrachten**
- **Approve/Reject functionaliteit**
- **Historisch overzicht van interventies**

### 3.3 Analytics Visualisatie
- **Class-wide statistieken**
- **Individual progress tracking**
- **Heatmaps van knowledge levels**

---

## 🔧 Fase 4: Admin Panel

### 4.1 System Monitoring
- **Health status** van alle services
- **SSOT integrity checks**
- **Browser environment diagnostics**

### 4.2 SSOT Browser
- **Interactieve weergave** van alle 10 dimensies
- **Logic Gate regels** met voorbeelden
- **Command library** met documentatie

### 4.3 Developer Tools
- **Tech Report** met PAPER, SSOT, TRACE, TELEMETRY tabs
- **Audit log viewer**
- **API call monitoring**

---

## 📄 Fase 5: Concept Page (Whitepaper)

### 5.1 Content
- **Wetenschappelijke onderbouwing** van de 10D Matrix
- **Ruijssenaars-theorie uitleg**
- **Praktische voorbeelden** en case studies

### 5.2 Interactieve Elementen
- **Expandable sections**
- **Visualisaties** van het rubric systeem

---

## 🔌 Fase 6: Backend Integratie

### 6.1 Supabase Setup
- **Database tabellen** voor users, sessions, mastery_states, audit_logs
- **Row Level Security** voor multi-tenant veiligheid
- **Real-time subscriptions** voor live updates

### 6.2 AI Service
- **Gemini API integratie** (via Edge Function - geen browser API keys)
- **SSOT-validatie** van AI outputs
- **Logic Gate enforcement** om antwoord-weggeven te voorkomen

### 6.3 Hybrid Persistence
- **Automatische fallback** naar localStorage zonder Supabase
- **Sync mechanisme** voor offline-first support

---

## 🎨 Design Specificaties

### Kleurenpalet
- **Primary**: Slate 950 (#020617) - donkere achtergrond
- **Accent**: Teal 400 - interactieve elementen
- **Text**: Slate 50 - leesbare tekst
- **Borders**: Slate 800 - subtiele scheiding

### UI Stijl
- **Dark theme** als default
- **Minimalistisch** met focus op content
- **Smooth animaties** en transitions
- **Custom scrollbars** voor premium feel

---

## 📋 Implementatie Volgorde

| Stap | Onderdeel | Geschatte Tijd |
|------|-----------|----------------|
| 1 | Landing Page + Navigatie | Klein |
| 2 | Student Studio basis (Chat) | Medium |
| 3 | Scaffolding Dashboard | Medium |
| 4 | Teacher Cockpit | Medium |
| 5 | Admin Panel | Medium |
| 6 | Supabase Backend | Medium |
| 7 | AI Service (Edge Function) | Medium |
| 8 | Polish & Testing | Klein |

---

## ⚠️ Belangrijke Aandachtspunten

1. **Geen API keys in browser** - Gemini calls via Supabase Edge Functions
2. **SSOT als bron van waarheid** - Alle rubric logica uit ssot.ts
3. **Logic Gates respecteren** - AI mag nooit direct antwoorden geven bij K1/K3
4. **Hybrid persistence** - App moet werken zonder Supabase connectie

De originele prompt had dit :

TITEL (ENGLISH):
EAI HUB. SSOT. DIDACTICS FIRST.

CONTEXT
I uploaded a zip “eai-studio-10.0.zip”. Keep ALL content. Do NOT delete files. If you need a clean app structure, create a NEW folder (e.g., /lovable-app) and copy the required frontend source there, but preserve the original files for reference.

GOAL
Build a polished, responsive website + prototype UI in Lovable (dark/teal, minimal, dashboard-first), using Dutch copy (except the title).
Pages:
1) Landing
2) Student Studio
3) Docent Cockpit
4) Admin/Docs placeholder (optional)

IMPORTANT
- Prefer the frontend code under /apps/web/src if present.
- Keep mock data and prepare a Supabase-ready data layer.
- Never put LLM API keys in the browser.

DELIVERABLE
A Lovable project that runs cleanly, plus an unchanged /sources snapshot of the original repository content.


IMPORTANT: Ignore the folder _sources/. It is only a reference snapshot.


NOTE: Summative (summatief) impact triggers a HUMAN GATE. Student Studio will not call the model. Teacher Cockpit can Approve/Reject the run.


