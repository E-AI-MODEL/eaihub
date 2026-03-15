

# Code Check Rapport — EAIHUB Pilot

## Oordeel: Publiceerbaar met 2 kleine fixes

De codebase is architecturaal solide en de 4 must-fixes zijn correct geïmplementeerd. Er zijn 2 kleine issues die aandacht verdienen vóór publicatie.

---

## Wat is bevestigd correct

| Check | Status | Bewijs |
|-------|--------|--------|
| `LearningPath.id` aanwezig | ✅ | `types/index.ts` r61: `id: string` |
| Loader vult `id` | ✅ | `curriculumLoader.ts` r102: `id: raw.id` |
| `pathId` via `getPathForNode` | ✅ | `chatService.ts` r110-112 |
| `mastery_criteria` alle items | ✅ | `curriculumLoader.ts` r72-73: `.join(' | ')` |
| `didactic_focus` alle themes | ✅ | `curriculumLoader.ts` r71: `.join(' | ')` |
| Prompt ankerregel | ✅ | `ssotHelpers.ts` r258-263: harde KRITIEK regel |
| `getLearningPath` verwijderd | ✅ | Search: 0 resultaten in hele repo |
| `curriculum.ts` schone re-export | ✅ | Geen legacy functies meer |
| `buildCurriculumContext` verrijkt | ✅ | `chatService.ts` r212-221: bevat micro_steps, illustrations, evidence_types |
| ChatInterface gebruikt loader | ✅ | r10: import uit `curriculumLoader` |
| MessageBubble scroll + letters | ✅ | r217: `max-h-44 overflow-y-auto`, r224: letter-prefix |
| Update banner op landing | ✅ | `LandingPage.tsx` r14-28 |

---

## Issues gevonden

### 1. Console warnings (laag risico, cosmetisch)

**Bron:** `StudentStudio.tsx` r60 en `BootSequence.tsx` r25
**Probleem:** React waarschuwt "Function components cannot be given refs" — er wordt een `ref` doorgegeven aan een function component zonder `forwardRef`.
**Impact:** Geen functioneel effect, maar vervuilt de console en is onprofessioneel bij inspectie.
**Fix:** Wrap `StudentStudio` en/of `BootSequence` met `React.forwardRef`, of verwijder de ref-prop.

### 2. Banner overlapt navigatie (UX)

**Bron:** `LandingPage.tsx` r14-28 en r31-67
**Probleem:** De update banner is `fixed top-0 z-[60]` en de navigatie is `fixed top-0 z-50`. De banner overlapt de nav correct qua z-index, maar wanneer de banner zichtbaar is duwt niets de nav naar beneden — ze liggen over elkaar.
**Impact:** Op mobiel (393px viewport) kan de nav gedeeltelijk onzichtbaar zijn achter de banner.
**Fix:** Voeg `top-10` (of dynamische offset) toe aan de nav wanneer de banner zichtbaar is, of maak de banner niet-fixed (sticky).

---

## Architecturale gezondheid

- **Type-integriteit:** `LearningNode` en `LearningPath` zijn eenmalig gedefinieerd in `types/index.ts`, correct gebruikt overal
- **Data-integriteit:** Loader is enige bron, geen legacy imports, geen supplementary lekkage
- **Prompt-kwaliteit:** Ankerregel aanwezig, microsteps als structuur, misconcepties proactief
- **Mastery-koppeling:** `pathId` correct afgeleid via `getPathForNode`
- **Streaming:** Zowel `sendChat` als `streamChat` gebruiken dezelfde correcte pipeline
- **Legacy:** `getLearningPath` volledig verwijderd, `CURRICULUM_PATHS` bestaat nog als compat-export maar wordt nergens meer geïmporteerd in actieve code

## Eindoordeel

**Publiceerbaar: JA**, mits de banner-overlap op mobiel wordt getest/gefixt. De `forwardRef` warning is cosmetisch en kan na publicatie.

