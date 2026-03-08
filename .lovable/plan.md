

# Fix coregulation_bands regressie: `knowledge_type` toevoegen

## Probleem

De `coregulation_bands` fix (alleen C-bands) heeft twee consumers gebroken die K-bands daaruit lazen, plus de edge function stuurt nog mixed bands aan.

## 6 wijzigingen

### 1. `src/types/index.ts` — veld toevoegen aan `EAIAnalysis`
```ts
knowledge_type?: 'K0' | 'K1' | 'K2' | 'K3';
```

### 2. `src/services/chatService.ts` — `generateAnalysis()` (~r1096)
Voeg `knowledge_type: knowledgeType as any` toe aan het return object.

### 3. `src/services/chatService.ts` — `updateSessionContext()` (r59)
```ts
// Was: analysis.coregulation_bands?.find(b => b.startsWith('K'))
// Wordt: analysis.knowledge_type, met legacy fallback voor oude records
const kBand = analysis.knowledge_type 
  || analysis.coregulation_bands?.find(b => b.startsWith('K')) 
  || null;
```

### 4. `src/pages/TeacherCockpit.tsx` (r324)
```ts
// Was: analysis?.coregulation_bands?.find(c => c.startsWith('K'))
// Wordt: met legacy fallback
analysis?.knowledge_type 
  || analysis?.coregulation_bands?.find(c => c.startsWith('K')) 
  || '—'
```

### 5. `src/services/chatService.ts` — `mergeWithEdge()` (~r1007)
Voeg toe:
```ts
knowledge_type: edgeAnalysis.knowledge_type ?? clientAnalysis.knowledge_type,
```

### 6. `supabase/functions/eai-classify/index.ts` — schema + prompt
- `coregulation_bands` beschrijving → `"Alleen co-regulatie bands (C0-C5)"`
- Nieuw veld in schema:
```ts
knowledge_type: {
  type: "string",
  enum: ["K0", "K1", "K2", "K3"],
  description: "Kennistype: K0=Ongedefinieerd, K1=Reproductie, K2=Toepassing, K3=Metacognitie",
}
```
- Voeg `"knowledge_type"` toe aan `required` array
- Update de classify prompt: maak duidelijk dat K apart gaat van coregulation_bands

## Backward compatibility

De consumers (punten 3 en 4) doen eerst `knowledge_type`, dan fallback naar legacy `coregulation_bands.find('K')`. Hierdoor blijven oude sessies en nog-niet-gedeployde edge responses leesbaar.

## Bestanden geraakt

| Bestand | Wijziging |
|---------|-----------|
| `src/types/index.ts` | `knowledge_type` op `EAIAnalysis` |
| `src/services/chatService.ts` | `generateAnalysis` + `updateSessionContext` + `mergeWithEdge` |
| `src/pages/TeacherCockpit.tsx` | Consumer met fallback |
| `supabase/functions/eai-classify/index.ts` | Schema + prompt |

