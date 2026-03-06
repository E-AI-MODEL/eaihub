

## Probleemanalyse

Na inspectie van de volledige codebase zijn er **vijf samenhangende problemen** gevonden:

### 1. "Concept uitleggen" knop is contextloos
`ChatInterface.tsx` regel 252: `setInput("Ik begrijp dit concept niet: ")` — zet een halve zin in het invoerveld. De `currentNodeId` en bijbehorende metadata (vak, niveau, onderwerp) zijn beschikbaar in de `profile` prop maar worden niet gebruikt. De AI krijgt geen context en vraagt dus "waarover?".

### 2. Chatgeschiedenis wordt niet opgeslagen in de database
De `sessionHistory` in `chatService.ts` is een **in-memory Map** (regel 32). Berichten bestaan alleen in het geheugen van de browser. De `student_sessions` tabel slaat alleen metadata op (analysis, mechanical, message count, last preview) maar **niet de berichten zelf**. Gevolg: het Teacher Dashboard en Admin Panel kunnen geen gesprekken inzien.

### 3. Teacher Dashboard toont beperkte data
`TeacherCockpit.tsx` toont alleen: fase-stepper, 4 metrics, agency sparkline, en laatste bericht-preview (100 chars). Er is geen mogelijkheid om de volledige gesprekshistorie van een leerling te bekijken, en geen inzicht in de 10D-analyse over tijd.

### 4. Admin Panel heeft geen database-beheer
`AdminPanel.tsx` beheert alleen **localStorage** (client-side). Er zijn geen tools om de Supabase tabellen (`student_sessions`, `teacher_messages`) te inspecteren, berichten te verwijderen, of sessies te beheren.

### 5. Fix-herhaling (eerder besproken)
De `VARIATION_HINTS` in `ssotHelpers.ts` dekken slechts 11 van ~50 commands. Er is geen `SessionContext` die bijhoudt welke fixes al zijn uitgevoerd.

---

## Plan

### A. Database: Chatberichten opslaan (nieuwe tabel)

Nieuwe migratie: `chat_messages` tabel

```text
chat_messages
├── id (uuid, PK)
├── session_id (text, NOT NULL)
├── role (text: 'user' | 'model' | 'teacher')  
├── content (text, NOT NULL)
├── analysis (jsonb, nullable)
├── mechanical (jsonb, nullable)
├── created_at (timestamptz)
```

RLS: open (demo mode, geen auth). Realtime enabled.

### B. chatService.ts: Berichten naar DB schrijven

Na elke succesvolle chat-response, beide berichten (user + model) inserten in `chat_messages`. De bestaande in-memory `sessionHistory` Map blijft intact voor de prompt-history.

### C. ChatInterface.tsx: Starter-knoppen contextbewust

- "Concept uitleggen": als `profile.currentNodeId` gezet is, direct `handleSend("Leg het concept '${node.title}' uit")` aanroepen i.p.v. halve zin in input
- "Test mijn kennis": als `currentNodeId` gezet is, stuur `"/quizgen ${node.title}"`
- Alle knoppen: voeg vak/niveau context toe wanneer `currentNodeId` ontbreekt maar `profile.subject` wel beschikbaar is

### D. TeacherCockpit.tsx: Uitbreiden met gespreksgeschiedenis + 10D-inzicht

- **Chatlog tab**: Volledige gesprekshistorie ophalen uit `chat_messages` voor geselecteerde sessie. Read-only weergave met kleurcodes per rol.
- **10D Analyse tab**: Alle 10 dimensies tonen (niet alleen 4 metrics). Data uit `student_sessions.analysis`.
- **Sessie-acties**: Mogelijkheid om sessie als "bekeken" te markeren.

### E. AdminPanel.tsx: Database-beheer toevoegen

Nieuwe tab "Database" in Admin Panel:
- **Sessies tabel**: Alle `student_sessions` ophalen en tonen. Per sessie: verwijder-knop, status toggle (ONLINE/OFFLINE).
- **Berichten tabel**: Alle `chat_messages` en `teacher_messages` ophalen. Filter op session_id. Verwijder individuele berichten of alle berichten van een sessie.
- **Bulk acties**: "Wis alle sessies", "Wis alle berichten", "Wis offline sessies".

Nieuwe service `src/services/adminDbService.ts`:
- `fetchAllSessionsAdmin()` — alle sessies ophalen
- `deleteSession(sessionId)` — sessie + bijbehorende berichten verwijderen
- `fetchChatMessages(sessionId?)` — berichten ophalen (optioneel per sessie)
- `deleteChatMessage(id)` — enkel bericht verwijderen
- `deleteAllSessionData()` — alles wissen
- `deleteTeacherMessage(id)` — docent-bericht verwijderen

### F. ssotHelpers.ts + chatService.ts: Fix-variatie + SessionContext

- **COMMAND_INTENTS map** uitbreiden naar alle ~50 commands (niet alleen 11)
- **SessionContext tracker** in chatService: bijhouden van `topics_covered`, `fixes_applied`, `turn_count`, `current_topic`
- **SessionContext als JSON-blok** meegeven in system prompt
- **Herhaling Guard** instructie toevoegen aan prompt
- **Metadata-injectie**: vak, niveau, huidig onderwerp prominent in prompt + bij elke user message als context wanneer relevant

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/migrations/` | Nieuwe migratie: `chat_messages` tabel + RLS + realtime |
| `src/services/adminDbService.ts` | **Nieuw**: CRUD operaties op Supabase tabellen voor admin |
| `src/services/chatService.ts` | Berichten naar DB schrijven; SessionContext tracker |
| `src/utils/ssotHelpers.ts` | COMMAND_INTENTS uitbreiden; SessionContext blok; Herhaling Guard |
| `src/components/ChatInterface.tsx` | Starter-knoppen contextbewust maken |
| `src/pages/TeacherCockpit.tsx` | Chatlog tab; 10D analyse tab; uitgebreider detail panel |
| `src/pages/AdminPanel.tsx` | Nieuwe "Database" tab met sessie/berichten-beheer |
| `src/types/index.ts` | SessionContext interface |

### Wat NIET verandert
- `ssot_v15.json` — bron van waarheid blijft intact
- `supabase/functions/eai-chat/index.ts` — edge function ontvangt gewoon de verrijkte prompt
- Bestaande tabellen `student_sessions` en `teacher_messages` — schema blijft, alleen nieuwe tabel erbij

