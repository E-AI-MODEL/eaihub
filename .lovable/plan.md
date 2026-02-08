

# Grondige Audit en Oplossing: SSOT Rubric Metadata

## Analyse: Huidige Status per Rubric

Ik heb alle 10 rubrics geanalyseerd op volledigheid van metadata en koppeling met detectielogica.

### Volledigheidsmatrix

| Rubric | Bands | fix | learner_obs | ai_obs | flag | didactic_principle | mechanistic |
|--------|-------|-----|-------------|--------|------|-------------------|-------------|
| **K (Knowledge)** | K1-K3 | /anchor, /connect, /sequence | ["Vraagt naar feiten"...] | - | FACT_RETRIEVAL, CONCEPTUAL, PROCEDURAL | - | - |
| **P (Precision)** | P1-P5 | - | - | - | - | "Activeer voorkennis"... | - |
| **C (Cognitive)** | C1-C4 | /chunk (alleen C4) | - | - | - | - | timescale/fast/mid/slow |
| **TD (Agency)** | TD1-TD5 | - | - | ["Geeft stapsgewijze uitleg"...] | - | - | - |
| **V (Verification)** | V1-V5 | - | - | - | - | - | - |
| **E (Epistemic)** | E1-E5 | - | - | - | - | - | - |
| **T (Time)** | T1-T5 | - | - | - | - | - | - |
| **S (Scaffolding)** | S1-S5 | - | - | - | - | - | - |
| **L (Modality)** | L1-L4 | - | - | - | - | - | - |
| **B (Behavior)** | B1-B4 | - | - | - | - | - | - |

### Gedetailleerde Problemen

#### 1. Ontbrekende Metadata (6 rubrics incompleet)
- **V, E, T, S, L, B**: Hebben alleen `band_id`, `label`, `description` - geen actionable metadata
- Deze dimensies missen: `fix`, `learner_obs`, `flag`, `didactic_principle`

#### 2. Ontkoppeling SSOT <-> Detectielogica
De `chatService.ts` detecteert bands maar koppelt **niet** aan de SSOT-metadata:

```text
chatService.ts genereerT:
- K-level: gebaseerd op input keywords ("wat is" -> K1)
- active_fix: ALLEEN bij slash-commands, NIET gekoppeld aan gedetecteerde band

SSOT definieert:
- K1.fix = "/anchor"
- K2.fix = "/connect"
- K3.fix = "/sequence"

RESULTAAT: Fix wordt nooit automatisch voorgesteld!
```

#### 3. Learner_obs/ai_obs niet gebruikt
De SSOT definieert observatie-patronen die niet worden toegepast:

```text
SSOT K1.learner_obs = ["Vraagt naar feiten", "Noemt definities"]
SSOT TD2.ai_obs = ["Stelt gerichte vragen", "Biedt hints aan"]

chatService.ts: Geen pattern matching op deze observaties
```

#### 4. Flags niet gebruikt
`FACT_RETRIEVAL`, `CONCEPTUAL`, `PROCEDURAL` worden gedefinieerd maar nergens verwerkt.

---

## Oplossingsplan

### Fase 1: SSOT Metadata Aanvullen

Alle 10 rubrics krijgen volledige, evidence-based metadata:

```text
V (Verification) - Toevoegen:
+----------------+----------------------+------------------------------------------+
| Band           | fix                  | learner_obs                              |
+----------------+----------------------+------------------------------------------+
| V1 Niet Gever. | /clarify             | ["Claimt zonder onderbouwing"]           |
| V2 Zelf-gerap. | /test                | ["Zegt 'ik snap het'", "Claimt begrip"]  |
| V3 Getest      | /elaborate           | ["Beantwoordt testvraag correct"]        |
| V4 Toegepast   | /transfer            | ["Past toe in voorbeeld"]                |
| V5 Transfer    | -                    | ["Past toe in nieuwe context"]           |
+----------------+----------------------+------------------------------------------+

E (Epistemic) - Toevoegen:
+----------------+----------------------+------------------------------------------+
| Band           | fix                  | flag                                     |
+----------------+----------------------+------------------------------------------+
| E1 Onbekend    | /clarify             | EPISTEMIC_UNKNOWN                        |
| E2 Mening      | /justify             | OPINION                                  |
| E3 Interpretatie| /elaborate          | INTERPRETATION                           |
| E4 Consensus   | -                    | SCIENTIFIC_CONSENSUS                     |
| E5 Feit        | -                    | VERIFIED_FACT                            |
+----------------+----------------------+------------------------------------------+

T (Time) - Toevoegen:
+----------------+----------------------+------------------------------------------+
| Band           | didactic_principle   | mechanistic.timescale                    |
+----------------+----------------------+------------------------------------------+
| T1 Onmiddelijk | Quick recall         | immediate                                |
| T2 Kort        | Short processing     | short                                    |
| T3 Medium      | Working memory       | working                                  |
| T4 Lang        | Deep processing      | extended                                 |
| T5 Reflectief  | Metacognitive        | reflective                               |
+----------------+----------------------+------------------------------------------+

S (Scaffolding) - Toevoegen:
+----------------+----------------------+------------------------------------------+
| Band           | fix                  | ai_obs                                   |
+----------------+----------------------+------------------------------------------+
| S1 Vol         | /scaffold_up         | ["Geeft volledige uitleg"]               |
| S2 Hoog        | /hint_hard           | ["Geeft directe hints"]                  |
| S3 Medium      | /hint_soft           | ["Stelt gerichte vragen"]                |
| S4 Laag        | /scaffold_down       | ["Geeft minimale hints"]                 |
| S5 Geen        | -                    | ["Observeert alleen"]                    |
+----------------+----------------------+------------------------------------------+

L (Modality) - Toevoegen:
+----------------+----------------------+------------------------------------------+
| Band           | ai_obs               | flag                                     |
+----------------+----------------------+------------------------------------------+
| L1 Narratief   | ["Gebruikt verhaal"] | NARRATIVE_MODE                           |
| L2 Expositief  | ["Standaard uitleg"] | EXPOSITORY_MODE                          |
| L3 Gestructureerd| ["Gebruikt lijsten"]| STRUCTURED_MODE                         |
| L4 Technisch   | ["Gebruikt code"]    | TECHNICAL_MODE                           |
+----------------+----------------------+------------------------------------------+

B (Behavior) - Toevoegen:
+----------------+----------------------+------------------------------------------+
| Band           | fix                  | learner_obs                              |
+----------------+----------------------+------------------------------------------+
| B1 Passief     | /checkin             | ["Wacht op instructie", "Geeft korte antwoorden"] |
| B2 Reactief    | /elaborate           | ["Beantwoordt vragen", "Volgt instructie"] |
| B3 Actief      | -                    | ["Stelt eigen vragen", "Neemt initiatief"] |
| B4 Proactief   | -                    | ["Plant vooruit", "Anticipeert"]         |
+----------------+----------------------+------------------------------------------+
```

### Fase 2: Detectielogica Koppelen aan SSOT

Nieuwe utility functie in `chatService.ts`:

```typescript
// Haal fix op uit SSOT gebaseerd op gedetecteerde band
function getFixForBand(bandId: string): string | null {
  const rubric = SSOT_DATA.rubrics.find(r => 
    r.bands.some(b => b.band_id === bandId)
  );
  const band = rubric?.bands.find(b => b.band_id === bandId);
  return band?.fix || null;
}

// Gebruik in generateAnalysis:
const suggestedFix = isCommand 
  ? input.split(' ')[0] 
  : getFixForBand(knowledgeLevel) || getFixForBand(cognitiveLoad);
```

### Fase 3: Learner_obs Pattern Matching

Uitbreiding van K-level detectie met SSOT-patronen:

```typescript
function detectKnowledgeLevel(input: string): string {
  const lowerInput = input.toLowerCase();
  
  // SSOT K1.learner_obs: ["Vraagt naar feiten", "Noemt definities"]
  const k1Patterns = /wat is|definitie|noem|betekent|heet/;
  
  // SSOT K2.learner_obs: ["Legt verbanden", "Vergelijkt concepten"]
  const k2Patterns = /waarom|verband|verschil|vergelijk|relatie/;
  
  // SSOT K3.learner_obs: ["Beschrijft stappen", "Past procedures toe"]
  const k3Patterns = /hoe|stappen|methode|procedure|aanpak/;
  
  if (k1Patterns.test(lowerInput)) return 'K1';
  if (k3Patterns.test(lowerInput)) return 'K3';
  return 'K2'; // Default conceptueel
}
```

### Fase 4: Flag Propagatie

Flags worden doorgegeven in de analysis response:

```typescript
interface EAIAnalysis {
  // ... bestaande velden
  active_flags: string[]; // Nieuw: ["FACT_RETRIEVAL", "NARRATIVE_MODE"]
}

// In generateAnalysis:
const activeFlags: string[] = [];
if (knowledgeLevel === 'K1') activeFlags.push('FACT_RETRIEVAL');
if (hasList) activeFlags.push('STRUCTURED_MODE');
if (hasCode) activeFlags.push('TECHNICAL_MODE');
```

---

## Technische Implementatie

### Bestanden die aangepast worden:

| Bestand | Wijziging |
|---------|-----------|
| `src/data/ssot.ts` | Metadata toevoegen aan V, E, T, S, L, B rubrics |
| `src/services/chatService.ts` | SSOT-koppeling voor fix/flags/obs, nieuwe detectiefuncties |
| `src/types/index.ts` | `active_flags: string[]` toevoegen aan EAIAnalysis |
| `src/utils/ssotParser.ts` | Geen wijziging nodig (parsed al alle velden) |
| `supabase/functions/eai-chat/index.ts` | Sync system prompt met nieuwe metadata |

### Volgorde van implementatie:

1. **SSOT metadata aanvullen** - Alle rubrics krijgen volledige velden
2. **Types updaten** - `active_flags` toevoegen
3. **chatService refactoren** - SSOT-gekoppelde detectie en fix-suggesties
4. **Edge function syncen** - System prompt bijwerken
5. **Testen** - Verifieer dat fixes en flags correct worden gegenereerd

---

## Resultaat na implementatie

- Alle 10 rubrics hebben consistente metadata
- Gedetecteerde bands triggeren automatisch bijbehorende fixes
- Learner_obs patterns worden gebruikt voor nauwkeurigere detectie
- Flags worden gepropageerd voor downstream processing
- SSOT is de echte "single source of truth" voor alle didactische logica

