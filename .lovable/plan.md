
## Animatie toevoegen aan Goal Picker

### Huidige situatie
De Goal Picker is geïmplementeerd in `ChatInterface.tsx` maar heeft geen enter/exit animatie. De kader verschijnt en verdwijnt abrupt.

### Wat er moet gebeuren

Voeg vloeiende fade + scale animaties toe bij:
- **Enter**: kader fade-in van opacity 0→1 met subtle scale 0.98→1 en translateY 8px→0
- **Exit**: kader fade-out naar opacity 0 met scale 0.98 en translateY -8px

### Technische aanpak

1. **CSS keyframes** (in `src/index.css`):
   - Voeg `goal-picker-enter` en `goal-picker-exit` keyframes toe
   - Gebruik bestaande timing (0.25s ease-out) consistent met rest van UI

2. **ChatInterface.tsx wijzigingen**:
   - Verpak het GoalPicker component in een wrapper div met animatie classes
   - Gebruik conditional rendering met CSS transition/animation classes i.p.v. directe conditional render
   - Animatie triggert op state change van `showGoalPicker`

### Bestanden die wijzigen

- `src/index.css` — nieuwe keyframes toevoegen
- `src/components/ChatInterface.tsx` — animatie wrapper om GoalPicker

### Wat niet verandert

- Functionaliteit van GoalPicker zelf (doelen genereren, klik handlers)
- Bestaande animaties in tailwind.config.ts
- LeskaartPanel of andere components
