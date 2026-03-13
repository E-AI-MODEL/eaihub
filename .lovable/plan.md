## Plan: Starter cards vervangen door contextgebonden leerdoelen-kiezer

### Wat verandert

De 3 grote starter cards ("Concept uitleggen", "Check-in starten", "Test mijn kennis") in het lege chatscherm worden vervangen door een compact kader met 4 leerdoelen. Deze doelen worden afgeleid uit de beschikbare context (huidig curriculum-node, vak, niveau, leerpad). De gebruiker kiest er één om het gesprek te starten, of klikt het kader weg met een kruisje.

### Hoe de leerdoelen worden bepaald

Geen AI-call nodig. De doelen worden lokaal gegenereerd uit curriculum-data:

1. **Als er een `currentNodeId` is**: gebruik de huidige node + omliggende nodes om 4 doelen te formuleren:
  - "Begrijp [huidige node titel]" (oriëntatie)
  - "Oefen [huidige node mastery_criteria]" (toepassen)  
  - "Vermijd veelgemaakte fouten bij [node titel]" (misconcepties)
  - "Verbind [huidige node] met [volgende/vorige node]" (transfer)
2. **Als er alleen vak+niveau is**: gebruik de eerste 4 nodes uit het leerpad als doelen.
3. **Geen context**: toon een generiek viertal ("Begrip opbouwen", "Oefenen", "Fouten herkennen", "Reflecteren").

### UI-ontwerp

- Compact kader met header "Kies een leerdoel" + `X` knop rechtsboven
- 4 knoppen in een `grid-cols-1 sm:grid-cols-2` layout
- Elke knop: korte doeltekst (1 regel), subtiele beschrijving (10px)
- Bij klik: stuurt een samengesteld bericht naar `handleSend` (bv. "Ik wil werken aan: [doeltekst]")
- Bij `X` klik: kader verdwijnt, leeg chatscherm met alleen het EAI monogram + begroeting
- State: `showGoalPicker` boolean, default `true`, wordt `false` bij klik of dismiss

### Bestanden die wijzigen

1. `**src/components/ChatInterface.tsx**` — enige bestand:
  - Verwijder de 3 starter card buttons (regels ~307-355)
  - Voeg `showGoalPicker` state toe
  - Voeg een `generateGoals()` useMemo toe die 4 doelen berekent uit profile/curriculum
  - Render het leerdoelen-kader in de empty state, of alleen begroeting als weggeklikt
  - EAI monogram + begroeting blijven behouden boven het kader

### Wat niet verandert

- LeskaartPanel toolbox blijft ongewijzigd
- MessageBubble, chatService, curriculum data — ongewijzigd
- Geen nieuwe bestanden of routes
- Buiten deze scope kunnen geen aanpassingen gedaan worden 