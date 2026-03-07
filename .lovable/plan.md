

## Plan: 3 patches — progress vullen, routerDecision vastleggen, dode types opruimen

### Patch 1 — `progress` vullen vanuit mastery (event-driven, niet polling)

**Probleem:** `upsertSessionState()` schrijft nooit `progress`. De kolom is altijd `0`.

**Aanpak:**
- In `sessionSyncService.ts`: voeg `progress` parameter toe aan `upsertSessionState()` en schrijf mee naar de upsert
- In `chatService.ts` (bij `triggerMasteryUpdate`): na mastery-update, bereken progress als `(MASTERED + CHECKING nodes) / totaal nodes` uit het lokale mastery-object en het curriculum pad
- Geef progress terug aan de caller zodat `ChatInterface` het kan doorgeven aan `upsertSessionState()` via `onAnalysisUpdate` callback — of simpeler: sla progress op in een ref die bij de volgende sync-interval wordt meegestuurd
- **Geen extra fetchMastery() per 10s.** Progress wordt alleen herberekend wanneer mastery daadwerkelijk wijzigt (na een chat-response), en dan lokaal gecached voor de sync

**Bestanden:**
- `src/services/sessionSyncService.ts` — progress parameter toevoegen aan upsert
- `src/components/ChatInterface.tsx` — progress ref bijhouden, meesturen in pushState
- `src/services/chatService.ts` — progress berekenen na triggerMasteryUpdate, meegeven in response of via callback

### Patch 2 — `routerDecision` vastleggen als diagnostisch object

**Probleem:** `determineTaskType()` retourneert alleen een string (`'chat' | 'deep' | 'image'`). De beslisreden wordt niet opgeslagen.

**Aanpak:**
- Maak een `buildRouterDecision()` functie die een `RouterDecision` object retourneert:
  ```
  { target_model, thinking_budget, intent_category, reasoning }
  ```
- `determineTaskType()` blijft bestaan maar wordt intern gevoed door `buildRouterDecision()`
- Het decision-object wordt toegevoegd aan `rawMechanical.routerDecision` voordat het de pipeline in gaat
- Zo wordt het automatisch mee-gepersist in `chat_messages.mechanical` en via session sync in `student_sessions.mechanical`

**Bestand:** `src/services/chatService.ts` — op 3 plekken (sendChat, streamChat, image-path) het decision-object meegeven aan rawMechanical

### Patch 3 — Dode MechanicalState velden opruimen (conservatief)

**Verwijderen:**
- `SupervisorLog` interface + `supervisorLog` veld — nergens runtime gevuld
- `softValidationLog` veld — nergens runtime gevuld
- `RepairLog` interface + `repairLog` veld — nergens runtime gevuld
- Legacy velden `timescale`, `fast`, `mid`, `slow` — nergens runtime gevuld

**Laten staan:**
- `routerDecision` — wordt nu gevuld (patch 2)
- `logicGateBreach` — wordt al berekend in `checkLogicGates()`, toekomstige observability-patch
- `semanticValidation` — wordt gevuld door reliabilityPipeline
- `epistemicGuardResult` — wordt gevuld door reliabilityPipeline
- `healingEventCount` — wordt gevuld door reliabilityPipeline
- `repairAttempts` — wordt gevuld door reliabilityPipeline

**Bestand:** `src/types/index.ts`

### Samenvatting wijzigingen

| Bestand | Wijziging |
|---|---|
| `src/services/sessionSyncService.ts` | `progress` parameter toevoegen |
| `src/components/ChatInterface.tsx` | progress ref + meesturen in sync |
| `src/services/chatService.ts` | `buildRouterDecision()` + progress berekening |
| `src/types/index.ts` | 4 dode velden/interfaces verwijderen |

Geen database-migraties nodig. `progress` kolom bestaat al, `mechanical` is JSONB.

