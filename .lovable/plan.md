## Plan: 2 chirurgische fixes

### Fix 1 — RouterDecision import naar top

**Bestand:** `src/services/chatService.ts`

- Verwijder regel 149 (`import type { RouterDecision } from '@/types'`)
- Voeg `RouterDecision` toe aan de bestaande type-import op regel 6:
  ```typescript
  import type { ChatRequest, ChatResponse, EAIAnalysis, MechanicalState, LearnerProfile, SessionContext, RouterDecision } from '@/types';
  ```

### Fix 2 — Progress score-drempel toepassen

**Bestand:** `src/services/chatService.ts` (regel 126-128)

- Wijzig de filter van:
  ```typescript
  if (entry.nodeId) completedNodes.add(entry.nodeId);
  ```
  naar:
  ```typescript
  if (entry.nodeId && entry.score != null && entry.score >= 0.6) {
    completedNodes.add(entry.nodeId);
  }
  ```

### Omvang

2 wijzigingen in 1 bestand. Geen migraties. Geen UI-impact.

&nbsp;

Na deze patch zou ik alleen nog even verifiëren:

	•	dat chatService.ts weer buildt

	•	dat progress nu echt boven 0 kan komen

	•	dat repair-ruis nu lager is sinds fix_ref al was aangepast