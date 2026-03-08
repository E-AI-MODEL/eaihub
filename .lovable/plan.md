

# Plan: Footer + Update mrt2026 verrijken

## 1. Footer aanpassen
**Bestand:** `src/pages/LandingPage.tsx`
- Titel: "EAIHUB"
- Ondertitel: "EAIHUB is een product van EAI Analys&Advies — H. Visser"

## 2. Update mrt2026 items verrijken + uitbreiden
**Bestand:** `src/pages/ConceptPage.tsx` (regels 480-591)

### Bestaande items herschrijven met meer context:
- **Item 5 (EITL)**: Toevoegen dat EITL staat voor **Education In The Loop** — het onderwijs (docent, didactiek, schoolvisie) blijft altijd in de beslislus. De SSOT is de didactische basis, maar er is bewust ruimte voor schooleigen context via plugins.

### Nieuwe items toevoegen:

- **Item 8: Geheugenarchitectuur — LLM met twee bronnen**
  De LLM haalt informatie uit twee plekken: lokale opslag (LocalStorage) voor de lopende sessie, en de backend voor langetermijndata. Dit is geïnspireerd op hoe kort- en langetermijngeheugen werkt. Lokaal = snel, direct, in het moment. Backend = persistent, deelbaar, over sessies heen. Door deze samenwerking voert de LLM snellere en vloeiendere gesprekken, zonder context te verliezen.

- **Item 9: Beeldondersteuning (Image)**
  Image-generatie is toegevoegd en wordt alleen actief wanneer het onderliggende model dit ondersteunt én visuele ondersteuning het leren aantoonbaar versterkt.

### Technisch
- 2 bestanden wijzigen
- Bestaande nummering en kaartstijl behouden
- Items 8 en 9 in dezelfde stijl als 1-7

