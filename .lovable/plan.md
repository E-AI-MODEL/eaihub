## Plan: Interactieve chat-UX verbeteringen — meerkeuze-knoppen + meer

### Overzicht

Drie kleine UI/UX aanpassingen die de chatervaring lichter en sneller maken, zonder grote architectuurwijzigingen:

1. **Meerkeuze-knoppen bij AI-vragen** — Als de LLM een meerkeuzevraag stelt, worden de opties automatisch als klikbare knoppen getoond onder het bericht
2. **Collapsible lange berichten** — Model-berichten boven een bepaalde lengte worden ingeklapt met "Lees meer"
3. **Typing indicator verbetering** — Subtielere shimmer met contextuele tekst

---

### 1. Meerkeuze-knoppen (grootste impact)

**Hoe het werkt:**

- De LLM stuurt al regelmatig meerkeuzevragen in markdown (bijv. `A)`, `B)`, `1.`, `2.` patronen, of lijsten met opties)
- `MessageBubble.tsx` detecteert deze patronen in het **laatste** model-bericht via regex
- Wanneer gedetecteerd: toon klikbare knoppen onder het bericht
- Bij klik: roep `onOptionSelect(optionText)` aan → dit stuurt het antwoord als gebruikersbericht via `handleSend`

**Detectiepatronen:**

```
/^[A-D][).]\s+/gm        → A) Zwaartekracht  B) Wrijving
/^\d+[).]\s+/gm          → 1) Eerste optie   2) Tweede optie
```

**Wijzigingen:**

- `**src/types/index.ts**` — Voeg `options?: string[]` toe aan `Message` interface
- `**src/components/MessageBubble.tsx**`:
  - Voeg een `extractOptions(text)` functie toe die opties uit de tekst haalt
  - Render knoppen onder het bericht als opties gevonden zijn EN het het laatste bericht is
  - Accepteer nieuwe prop `onOptionSelect?: (text: string) => void` en `isLast?: boolean`
- `**src/components/ChatInterface.tsx**`:
  - Geef `onOptionSelect={handleSend}` en `isLast` door aan de laatste `MessageBubble`

**UI:** Compacte knoppen in een flex-wrap layout, stijl consistent met GoalPicker (border-slate-800, hover:border-indigo-500/40). Na klik verdwijnen de knoppen (eenmalig gebruik).

### 2. Collapsible lange berichten

**Wat:** Model-berichten langer dan ~600 tekens worden ingeklapt tot ~300 tekens met een "Lees meer ↓" knop.

**Wijzigingen:** Alleen in `MessageBubble.tsx`:

- `isExpanded` state, default `false`
- Toon truncated tekst + gradient overlay + "Lees meer" knop
- Laatste bericht altijd volledig getoond (niet inklapbaar)

### 3. Typing indicator met context

**Wat:** De huidige "Verwerken..." tekst vervangen door iets informatiever: "Even denken hoor" bij deep model, "Verwerken..." bij flash. En "Aan het tekenen..." bij flash image. 

**Wijziging:** Kleine aanpassing in `ChatInterface.tsx` — de loading indicator krijgt een tekst op basis van de huidige context.

---

### Bestanden die wijzigen


| Bestand                            | Wijziging                             |
| ---------------------------------- | ------------------------------------- |
| `src/types/index.ts`               | `options?: string[]` op Message       |
| `src/components/MessageBubble.tsx` | Optie-extractie, knoppen, collapsible |
| `src/components/ChatInterface.tsx` | Props doorgeven, typing indicator     |


### Wat niet verandert

- chatService, edge functions, systeemprompt — ongewijzigd
- GoalPicker, LeskaartPanel — ongewijzigd
- Geen database-wijzigingen