

# Fix: Command Leaking + Repetitieve Didactische Fixes

## Twee Problemen

### 1. `/intro` lekt door in de chat
De AI schrijft letterlijk `/intro` in het antwoord. De huidige `sanitizeForPresentation` in `MessageBubble.tsx` vangt alleen `/command` aan het begin van een regel (`^\/\w+`), maar de AI schrijft het soms midden in een zin. Bovendien: we moeten de AI ook instrueren om dit nooit te doen.

### 2. Statische fixes zijn repetitief
In `ssot_v15.json` staat bij `/intro` altijd dezelfde tekst: *"Noem 3 begrippen die je met dit onderwerp associeert."* Elke keer dat de AI `/intro` uitvoert, krijgt de leerling exact dezelfde vraag. Na 3x is dat dodelijk voor de motivatie.

## Oplossing

De beste aanpak is **tweeledig**: de AI instrueren om het nooit te doen, en tegelijk de sanitizer versterken als vangnet.

### A. System Prompt aanscherpen (`ssotHelpers.ts`)

In de `generateSystemPrompt` functie twee dingen toevoegen:

1. **Presentation Guard** instructie:
```
## PRESENTATIE REGELS (KRITIEK)
- Schrijf NOOIT slash-commando's (/intro, /devil, /schema, etc.) in je antwoord aan de leerling.
- Slash-commando's zijn interne instructies. De leerling mag ze nooit zien.
- Gebruik GEEN meta-taal zoals 'inventarisatie', 'diagnose', 'strategie', 'volgens mijn analyse'.
```

2. **Variatie-instructie** bij de commando-sectie:
```
## BESCHIKBARE COMMANDO'S
[bestaande lijst]

BELANGRIJK: Wanneer je een commando-actie uitvoert, varieer dan ALTIJD je formulering.
Gebruik het commando als richtlijn voor het TYPE actie, niet als letterlijke tekst.
Voorbeelden van variatie bij /intro:
- "Welke 3 dingen weet je al over [onderwerp]?"
- "Stel je voor dat je [onderwerp] moet uitleggen aan een vriend. Waar begin je?"
- "Wat heb je eerder geleerd dat te maken heeft met [onderwerp]?"
```

### B. Sanitizer versterken (`MessageBubble.tsx`)

De regex `^\/\w+` matcht alleen regelstart. Aanpassen naar een bredere vanger:

```typescript
const FORBIDDEN_PATTERNS = [
  /\/?(?:intro|devil|schema|beeld|flits|chunk|checkin|fase_check|hint|anchor|reflectie|model|exit|quiz|meta|pauze|recap)\b/gi,
  // ... bestaande patronen
];
```

Dit vangt `/intro`, maar ook als de AI het zonder slash schrijft midden in een zin.

### C. Fix-teksten dynamischer maken in prompt (`ssotHelpers.ts`)

In de rubric-tabel die naar de AI wordt gestuurd, de statische fix-tekst vervangen door een variatie-instructie. In plaats van:

```
| P1 | Orientatie | /intro | Activeer voorkennis |
```

Wordt het:

```
| P1 | Orientatie | Activeer voorkennis (varieer aanpak: vraag begrippen, scenario, of real-world connectie) |
```

Dit betekent dat de commando-kolom in de prompt-tabel de fix-naam weglaat en in plaats daarvan het didactisch principe met variatie-hint toont.

## Bestanden die worden gewijzigd

1. **`src/utils/ssotHelpers.ts`** -- Presentation Guard toevoegen aan system prompt, fix-kolom aanpassen naar variatie-instructies
2. **`src/components/MessageBubble.tsx`** -- Sanitizer regex verbreden als vangnet

## Wat niet verandert

- `ssot_v15.json` blijft ongewijzigd (dat is de bron van waarheid)
- De interne analyse in `chatService.ts` blijft `/commands` gebruiken voor detectie
- De toolbox in `LeskaartPanel` stuurt nog steeds `/commands` naar de AI -- die worden alleen niet getoond

