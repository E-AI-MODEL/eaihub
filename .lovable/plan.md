
# Architectuur Roadmap — Post Dev-verslag v3

## Huidige staat (geverifieerd)

EAIHUB werkt als een **classificatie- en validatiepijplijn**, niet als een centrale gewogen formule.

- `generateAnalysis()` in `chatService.ts`: 10 losse `detect*()` functies, client-side regex, single-label per dimensie
- `reliabilityPipeline.ts`: SSOT-heal → epistemic guard → semantic validation
- `eaiLearnAdapter.ts`: parallelle interpretatielaag (scaffolding, agency, G-factor, gates) — **overlapt deels met pipeline**
- UI toont alleen afgeleide labels, geen brondata of nuance

## Afgesproken volgorde

```
1. Analyse naar edge function verplaatsen (LLM doet 10D-classificatie)
2. Dubbele validatie opruimen (pipeline vs adapter overlap)
3. EAIAnalysis uitbreiden met nuancevelden (confidence, secondaryBand, borderline)
4. UI aanpassen voor overgang/confidence
```

## Wat NIET doen

- 3-lagenarchitectuur bouwen terwijl brondata regex-gebaseerd is
- EAIAnalysis uitbreiden met velden die geen producer kan vullen
- UI refactoren voor nuance die er nog niet is

## Technische schuld

- `eaiLearnAdapter.ts` bevat `validateAnalysisAgainstSSOT()` + `calculateGFactor()` die overlappen met `reliabilityPipeline.ts`
- Adapter heeft extra `COMMAND_FUZZY_MAP` die pipeline mist
- `repairAttempts` is binary (0/1), niet echt aantal — granulaire tellers (`ssotHealingCount`, `commandNullCount`, `parseRepairCount`) zijn toegevoegd maar nog niet in Admin UI

---

# Eerdere plannen

## Fix: Command Leaking + Repetitieve Didactische Fixes

### Twee Problemen

#### 1. `/intro` lekt door in de chat
De AI schrijft letterlijk `/intro` in het antwoord. De huidige `sanitizeForPresentation` in `MessageBubble.tsx` vangt alleen `/command` aan het begin van een regel (`^\/\w+`), maar de AI schrijft het soms midden in een zin.

#### 2. Statische fixes zijn repetitief
In `ssot_v15.json` staat bij `/intro` altijd dezelfde tekst. Na 3x is dat dodelijk voor de motivatie.

### Oplossing
- System Prompt: Presentation Guard + variatie-instructies
- Sanitizer: regex verbreden als vangnet
- Fix-teksten: dynamischer maken via variatie-hints in prompt
