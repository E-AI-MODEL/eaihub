

## Onderzoeksresultaten

### Wat betekent "repair" nu precies?

**Bron:** `healAnalysisToSSOT()` in `reliabilityPipeline.ts:107-225`. Dit is de enige plek waar healing-events ontstaan.

**5 event-prefixes bestaan al:**
| Prefix | Wat het doet | Categorie |
|---|---|---|
| `PRUNE_UNKNOWN_BAND:*` | Onbekende coregulation_band verwijderd | SSOT healing |
| `PRUNE_UNKNOWN_PHASE:*` | Onbekende process_phase verwijderd | SSOT healing |
| `PRUNE_UNKNOWN_TD:*` | Onbekende task_density verwijderd | SSOT healing |
| `PRUNE_UNKNOWN_SECONDARY:*` | Onbekende secondary_dimension verwijderd | SSOT healing |
| `NULL_UNKNOWN_COMMAND:*` | Ongeldige active_fix genulled | Command null |

Er is **geen** parse-repair in deze functie — dat zou elders zitten (edge function JSON parse). `parseRepairCount` is dus een reserved slot voor later.

### Wat wordt nu opgeslagen?

In `MechanicalState` (types/index.ts:123-140):
- `repairAttempts` — binary (0 of 1), niet het echte aantal
- `healingEventCount` — totaal aantal events, zonder categorisatie

### Welke consumers lezen dit?

| Bestand | Veld | Wat het toont |
|---|---|---|
| `MessageBubble.tsx:35,160` | `repairAttempts` | "X repair(s)" badge |
| `TechReport.tsx:51,369` | `repairAttempts` | "HEALED" status + count |
| `TeacherCockpit.tsx:329` | `repairAttempts` | "Repairs" metric cell |
| `AdminPanel.tsx:468,536,670` | `repairAttempts` + `healingEventCount` | Tabel + aggregatie |

**Conclusie:** Alle consumers lezen `repairAttempts` als primair veld. Alleen AdminPanel leest ook `healingEventCount`. Nieuwe velden toevoegen breekt niets.

---

## Patchvoorstel

**Doel:** Repair van grove ja/nee-indicatie naar bruikbare observability, zonder bestaande UI te breken.

### Bestand 1: `src/types/index.ts`

3 optionele velden toevoegen aan `MechanicalState` (na regel 139):

```typescript
ssotHealingCount?: number;
commandNullCount?: number;
parseRepairCount?: number;
```

`repairAttempts` en `healingEventCount` blijven als backwards-compatible aggregaat.

### Bestand 2: `src/lib/reliabilityPipeline.ts`

**A.** Return type van `healAnalysisToSSOT()` uitbreiden:
```typescript
): { healed: EAIAnalysis; events: string[]; ssotHealingCount: number; commandNullCount: number }
```

Na de bestaande event-logica, events categoriseren op prefix:
```typescript
const ssotHealingCount = events.filter(e => e.startsWith('PRUNE_UNKNOWN_')).length;
const commandNullCount = events.filter(e => e.startsWith('NULL_UNKNOWN_COMMAND')).length;
```

**B.** In `executePipeline()` (regel 406): destructure de nieuwe tellers en schrijf ze naar `enhancedMechanical`:
```typescript
const { healed, events: healingEvents, ssotHealingCount, commandNullCount } = healAnalysisToSSOT(analysis, sessionId);

// In enhancedMechanical:
ssotHealingCount,
commandNullCount,
parseRepairCount: 0,
```

### Omvang
- 2 bestanden, geen migraties, geen UI-wijzigingen
- Bestaande `repairAttempts` en `healingEventCount` blijven ongewijzigd
- Nieuwe velden zijn direct beschikbaar voor toekomstige Admin/Teacher UI

