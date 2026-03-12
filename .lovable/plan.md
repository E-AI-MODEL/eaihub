

# Beperkte Stap 2 — Verificatie en Implementatieplan

## FASE A — Zelfverificatie

### 1. Vertaling `scaffolding.advice` → docenttaal
**Status: puur vertaalwerk, veilig.**
Regel 367 toont `eai.scaffolding.advice` letterlijk: `💡 {eai.scaffolding.advice}`. De drie mogelijke waarden zijn hardcoded in `eaiLearnAdapter.ts` r80-82:
- `"CRITICAL DEPENDENCY DETECTED. INITIATE FADING (FORCE TD2/TD3)."`
- `"AGENCY DROPPING. REDUCE SUPPORT LEVEL."`
- `"HIGH AGENCY. INCREASE COMPLEXITY (E4/S5)."`

Dit zijn exact drie strings. Een `translateAdvice()` met drie vaste vertalingen is zuiver presentatie, geen interpretatie. **Veilig.**

### 2. Kwalitatief agency-label ("Laag / Matig / Goed")
**Status: minimale interpretatielogica, maar veilig.**
Agency is al een afgeleid getal (TD-band → percentage via vaste mapping in `eaiLearnAdapter.ts` r63). Een kwalitatief label is een tweede afleiding bovenop een bestaande afleiding. Maar de drempels (< 40 = Laag, 40-70 = Matig, > 70 = Goed) volgen dezelfde logica als de al bestaande urgentie-indeling in `getUrgencyLevel()`. Geen nieuwe semantiek. **Veilig.**

### 3. Vertaling chatlog-tags
**Status: puur vertaalwerk, veilig.**
Regels 484-501 tonen `process_phases` als ruwe P-codes, `active_fix` als slash-commando, `confidence` als percentage, en `borderline_dimensions` als codes. `translatePhase()` en `translateFix()` bestaan al. `confidence` en `borderline` zijn technische metrics — die kunnen als-is blijven of naar een toggle. **Veilig.**

### 4. Compacte docentregel per leerling
**Status: kleine interpretatielogica, acceptabel mits minimaal.**
De gevraagde labels ("Heeft nu hulp nodig", "Wordt zelfstandiger", "Werkt zelfstandig", "Check begrip") zijn direct afleidbaar uit bestaande signalen:
- agency < 40 → "Heeft hulp nodig" (= bestaande urgentie high)
- trend RISING → "Wordt zelfstandiger" (= bestaande translateTrend)
- agency > 70 + STABLE/RISING → "Werkt zelfstandig"
- K0/K1 + agency 40-70 → "Check begrip"

Dit is een dunne combinatie van twee bestaande velden, geen weegmodel. **Veilig mits de regels expliciet en minimaal blijven.**

### Samenvatting verificatie

| Onderdeel | Type | Veilig? | Uitvoeren? |
|---|---|---|---|
| `scaffolding.advice` vertalen | Puur presentatie (3 strings) | Ja | Ja |
| Kwalitatief agency-label | Minimale afleiding op bestaand getal | Ja | Ja |
| Chatlog-tags vertalen | Puur presentatie met bestaande helpers | Ja | Ja |
| Docentregel per leerling | Dunne combinatie agency+trend+K | Ja | Ja, minimaal |

---

## FASE B — Implementatie

### Wijzigingen in `src/utils/teacherTranslations.ts`

1. **`translateAdvice(advice: string): string`** — drie vaste vertalingen van de drie hardcoded Engelse strings uit `eaiLearnAdapter.ts`.

2. **`getAgencyLabel(score: number): { label: string; color: string }`** — "Laag" (< 40), "Matig" (40-70), "Goed" (> 70). Drempels consistent met bestaande `getUrgencyLevel()`.

3. **`getTeacherStatusLine(session: StudentSessionRow): string`** — minimale combinatie:
   - agency < 40 → "Heeft hulp nodig"
   - trend === 'FALLING' → "Wordt afhankelijker"
   - agency > 70 && trend !== 'FALLING' → "Werkt zelfstandig"
   - K0/K1 && agency 40-70 → "Check begrip"
   - fallback → "Actief"

### Wijzigingen in `src/pages/TeacherCockpit.tsx`

1. **Overzicht-tab, r348**: Vervang `{agencyScore}%` door kwalitatief label + percentage als subtitle.

2. **Overzicht-tab, r366-368**: Vervang `{eai.scaffolding.advice}` door `translateAdvice()`.

3. **Sessie-lijst**: Voeg compacte docentregel toe als subtitle onder de bestaande metadata.

4. **Chatlog-tab, r484-501**: Vervang `{p}` door `translatePhase(p)`, vervang `{active_fix}` door `translateFix(active_fix)`. Laat `confidence` en `borderline` als-is (technische tags, horen bij chatlog-detail).

### Wat ik bewust NIET doe
- Geen `learner_obs[]` toevoegen — dat is een rijkere verdiepingsstap
- Geen herstructurering van het leerlingdetail-panel
- Geen nieuwe weegfactoren in urgentielogica
- Geen backendwijzigingen

