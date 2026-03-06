

## Mobile UI/UX Audit & Fixes

### Bevindingen

**1. Auto-zoom op iOS Safari/Chrome**
- `index.html` viewport meta mist `maximum-scale=1` — iOS zoomt automatisch in op `<input>` en `<textarea>` met font-size < 16px
- De chat textarea gebruikt `text-sm` (14px) en ProfileSetup inputs ook `text-sm` — dit triggert auto-zoom op iOS
- Fix: viewport meta uitbreiden + input font-sizes naar 16px op mobiel

**2. Landing page te groot op mobiel**
- H1 is `text-5xl` (3rem/48px) op mobiel — veel te groot, wordt afgekapt bij "DIDACTISCHE ENGINE."
- De beschrijvingstekst `text-xl` (20px) is ook groot voor mobiel
- Cards hebben `p-10` — te ruim op een klein scherm
- Nav padding `py-6` duwt content ver naar beneden
- Fix: kleinere mobiele breakpoints voor typografie en padding

**3. Chat interface — minor fixes**
- Input dock: "Enter" hint label overlapt met tekst op smal scherm (absolute positioning `right-10`)
- Starter cards grid is `sm:grid-cols-3` — op ~400px schermen worden ze te smal
- Mechanical footer timestamps worden afgekapt op smalle schermen
- Fix: aanpassingen in spacing en hide "Enter" hint op mobiel

**4. ProfileSetup mobiel**
- Level knoppen `w-28` x 3 = 336px + gaps — past net op 375px maar is krap
- Grade knoppen naast level knoppen zijn prima
- Fix: level knoppen smaller op mobiel

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `index.html` | Viewport meta: `maximum-scale=1, user-scalable=no` toevoegen |
| `src/pages/LandingPage.tsx` | Mobiele typografie verkleinen (h1: `text-3xl` op mobiel, tekst: `text-base`), padding reduceren, card padding `p-6` op mobiel |
| `src/components/ChatInterface.tsx` | Textarea font-size 16px op mobiel (voorkomt iOS zoom), "Enter" hint verbergen op mobiel, starter cards altijd 1 kolom op <640px |
| `src/components/ProfileSetup.tsx` | Level knoppen `w-24` op mobiel, input font-size 16px |
| `src/index.css` | Utility voor `text-[16px]` op inputs mobiel (optioneel, kan inline) |

### Prioriteit

1. Auto-zoom fix (viewport + font-size) — hoogste impact, laagste risico
2. Landing page typografie — visueel meest zichtbaar
3. Chat minor fixes — polish

