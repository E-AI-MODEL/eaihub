

# Plan: FactoryDiagram inhoudelijk corrigeren — juiste volgorde en beschrijvingen

## Gevonden fouten

Na analyse van `chatService.ts`, `reliabilityPipeline.ts` en de edge functions blijkt de **stationsvolgorde fout**:

| # | Huidig diagram | Werkelijke volgorde in code |
|---|---|---|
| 1 | INPUT | INPUT — gebruiker typt bericht |
| 2 | AUTH | **SSOT/PROMPT** — systeem-prompt gebouwd uit reeds geladen SSOT |
| 3 | SSOT | **AUTH** — JWT token opgehaald |
| 4 | CLASSIFY | **CHAT** — eai-chat edge function (streaming antwoord) |
| 5 | PIPELINE | **CLASSIFY** — eai-classify edge function (NA het antwoord) |
| 6 | CHAT | **PIPELINE** — reliability pipeline op de classificatie |
| 7 | DATABASE | DATABASE — persistChatMessage() |
| 8 | OUTPUT | OUTPUT — render in rol-view |

### Specifieke fouten in huidige teksten

1. **SSOT** wordt getoond als "per bericht laden" — in werkelijkheid laadt `useSchoolPlugin` de SSOT bij app-bootstrap. Per bericht wordt alleen `generateSystemPrompt()` aangeroepen.
2. **CLASSIFY staat VOOR CHAT** — fout. In `chatService.ts` regel 452: `attemptEdgeClassification()` wordt pas aangeroepen NADAT het streaming-antwoord volledig is.
3. **PIPELINE staat TUSSEN CLASSIFY en CHAT** — fout. `executePipeline()` draait na zowel chat als classify (regel 472).
4. **CHAT whatHappens** zegt "het eindantwoord wordt gegenereerd" — maar CHAT is niet het einde, er komt nog CLASSIFY + PIPELINE + DATABASE + OUTPUT.
5. **AUTH** beschrijving klopt wel, maar de positie is fout (staat nu voor SSOT, moet na SSOT/PROMPT).

## Wijzigingen

### `src/components/FactoryDiagram.tsx` — STATIONS array herschrijven

Nieuwe volgorde met gecorrigeerde inhoud:

1. **INPUT** (groen) — "Je typt een vraag. Profiel, vak, niveau, sessionId en curriculumContext worden automatisch toegevoegd."
2. **PROMPT** (amber) — "Het systeem-prompt wordt samengesteld uit de SSOT die bij het opstarten is geladen. School-plugins zijn al samengevoegd via whitelistMerge()." Modules: `generateSystemPrompt()`, `getEffectiveSSOT()`, `10D rubrics`, `interventies`
3. **AUTH** (paars) — "Je JWT-token wordt opgehaald en meegegeven. De edge function valideert je identiteit en rol server-side." Modules: `getAuthToken()`, `JWT validatie`, `has_role()`, `RLS`
4. **CHAT** (cyaan) — "Je bericht wordt naar de AI gestuurd. De Model Router kiest FAST (Gemini Flash) of SLOW (Gemini Pro) op basis van kennistype en gespreksdiepte." Modules: `eai-chat edge fn`, `Model Router`, `FAST → gemini-3-flash-preview`, `SLOW → gemini-2.5-pro`, `streaming response`
5. **CLASSIFY** (cyaan) — "Na het antwoord analyseert een tweede AI-call je interactie langs 10 dimensies. Dit gebeurt NADAT je het antwoord al ziet." Modules: `eai-classify edge fn`, `Gemini tool-calling`, `10D: K·P·C·TD·V·E·T·S·L·B`
6. **PIPELINE** (groen) — "De ruwe classificatie doorloopt 9 automatische controles." Modules: de 9 stappen. Detail corrigeren: pipeline draait op de CLASSIFICATIE, niet op het chat-antwoord.
7. **DATABASE** (indigo) — ongewijzigd, klopt
8. **OUTPUT** (groen) — ongewijzigd, klopt

### Geen wijzigingen aan `LandingPage.tsx`

De component-integratie blijft hetzelfde, alleen de data in STATIONS wijzigt.

### Technisch
- 1 bestand wijzigen (`FactoryDiagram.tsx`)
- Alleen de STATIONS array en labels herschrijven
- SVG-structuur en animaties blijven intact

