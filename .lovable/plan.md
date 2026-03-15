## Beoordeling: Klopt je feedback?

**Kort antwoord: ja, je feedback klopt volledig.** Elk punt is verifieerbaar in de code. Hieronder de bevestiging per claim.

---

### Wat je bevestigt — allemaal correct


| Jouw claim                                                   | Code-bewijs                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `curriculumLoader.ts` is enige bron, laadt alleen pilot_core | Loader regels 6-7: importeert uitsluitend `pilot_core` JSON                     |
| `curriculum.ts` is re-export, geen demo-data                 | Bevestigd: alleen `export type` en re-exports uit loader                        |
| `LearningNode` niet meer dubbel                              | Canoniek in `types/index.ts` r46-60, loader importeert `from '@/types'`         |
| `LearningPath` mist `id`                                     | `types/index.ts` r62-67: alleen `subject, level, topic, nodes` — geen `id`      |
| `getLearningPath` negeert `level`                            | Loader r161-168: matcht alleen op `subject.toLowerCase()`, `level` ongebruikt   |
| `chatService.ts` bouwt kunstmatig `pathId`                   | r110: ``${profile.subject}_${profile.level}`.toUpperCase().replace(/\s/g, '')`` |
| `mastery_criteria` = alleen eerste `can_demonstrate`         | Loader r72: `raw.mastery.can_demonstrate?.[0]`                                  |
| `didactic_focus` = eerste theme tag of 'Kerndoel'            | Loader r71: `raw.tags.theme?.[0] || 'Kerndoel'`                                 |
| ProfileSetup/TopicSelector matchen op `p.topic` string       | Bevestigd in eerdere analyse                                                    |
| adminService correct met `PILOT_NODE_COUNT`                  | Bevestigd                                                                       |
| ssotHelpers injecteert rijke velden maar zonder ankerregel   | r251-289: velden staan erin, maar geen "MOET verwijzen naar" instructie         |


### Je correctie op `buildCurriculumContext()` — klopt

Je zegt: het probleem is niet primair dat `buildCurriculumContext()` (chatService r208-219) afgeslankte data naar edge stuurt, maar dat de **totale systeemprompt** de curriculumcontext niet sturend genoeg maakt.

**Bevestigd.** De systeemprompt (`generateSystemPrompt`, ssotHelpers r297-456) plaatst de curriculumcontext als **laatste sectie** (r450-454) na ~3000+ woorden SSOT-rubric. De context zelf bevat geen harde ankerregel. `buildCurriculumContext()` is een secundair probleem — het grotere issue is promptdominantie.

### Je nuance over supplementary — klopt

De loader importeert alleen pilot_core bestanden (code-bewijs). Of de pilot_core **data zelf** ongewenste records bevat is inderdaad een datacontrole, niet aantoonbaar uit de code. Correcte nuancering.

---

### Conclusie

Je feedback is 100% verifieerbaar en accuraat. De 4 must-fixes die je benoemt zijn exact de juiste prioriteiten:

1. `**LearningPath.id**` toevoegen
2. `**pathId**` afleiden via `getPathForNode(currentNodeId)` i.p.v. `subject_level`
3. `**mastery_criteria**` uitbreiden naar alle `can_demonstrate` items
4. **Prompt-ankerregel** toevoegen

Wil je dat ik deze 4 fixes als implementatieplan uitwerk?

&nbsp;

Doe dit pas aan voer uit en controleer de volledige implementatie incl. Goed zichtbare update melding op de homepage 