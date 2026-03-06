

## Bevindingen

### 1. Leerjaar — wordt NIET meegenomen in context

- `LearnerProfile` heeft een `grade` veld (type `string | null`)
- Het Dashboard toont het als "Leerjaar" label
- **Maar**: `ProfileSetup.tsx` zet `grade: null` hardcoded — er is geen invoerveld voor leerjaar
- **Maar**: `generateSystemPrompt()` in `ssotHelpers.ts` stuurt alleen `subject`, `level`, `name`, `goal` mee — `grade` ontbreekt volledig in de AI-context
- **Maar**: de edge function ontvangt alleen `profile.subject`, `profile.level`, `profile.name`, `profile.goal` — geen `grade`

**Conclusie**: Leerjaar bestaat als dataveld maar wordt nergens ingevuld en nergens meegegeven aan de AI.

### 2. Taalniveau aanpassing — bestaat NIET

- Er is geen enkele referentie naar taalniveau, taalregister, of woordenschatcomplexiteit in de codebase
- De system prompt zegt alleen "Pas je modaliteit aan op de leerling" — maar er is geen concrete instructie om taal te vereenvoudigen voor bijv. VMBO vs VWO, of leerjaar 1 vs leerjaar 6
- `level` (HAVO/VWO) zou hiervoor kunnen dienen, maar wordt niet vertaald naar een taalinstructie

**Conclusie**: De AI past taal niet aan op basis van context.

---

## Plan: Leerjaar + Taalniveau Integratie

### Wijzigingen

**1. `src/components/ProfileSetup.tsx`** — Leerjaar invoerveld toevoegen
- Dropdown/select met leerjaren (1-6) na de niveau-selectie
- Waarde opslaan in `profile.grade`

**2. `src/utils/ssotHelpers.ts`** — Twee aanpassingen in `generateSystemPrompt()`:

a) `grade` toevoegen aan HUIDIGE CONTEXT sectie:
```
Leerjaar: ${profile.grade || 'Onbekend'}
```

b) Taalniveau-instructie toevoegen in RESPONSE FORMAT, afgeleid van `level` + `grade`:
```
## TAALREGISTER
Pas je taalgebruik aan op het niveau van de leerling:
- VMBO: Korte zinnen, eenvoudige woorden, veel voorbeelden uit het dagelijks leven
- HAVO: Helder taalgebruik, vakbegrippen introduceren met uitleg
- VWO: Academisch register, vakjargon mag, complexere zinsstructuren
- Leerjaar 1-2: Extra toegankelijk, concrete voorbeelden
- Leerjaar 5-6: Examenniveau, formele terminologie
```

**3. `supabase/functions/eai-chat/index.ts`** — `grade` toevoegen aan `profile` interface (zodat het beschikbaar is als fallback)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/ProfileSetup.tsx` | Leerjaar dropdown toevoegen |
| `src/utils/ssotHelpers.ts` | `grade` in context + taalregister-instructie in prompt |
| `supabase/functions/eai-chat/index.ts` | `grade` in profile interface |

