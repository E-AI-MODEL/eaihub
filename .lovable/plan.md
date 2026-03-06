

## Admin Panel & Teacher Cockpit — Mobiel bruikbaar maken

### Probleem

Beide pagina's zijn gebouwd voor desktop en breken op mobiel:

**Admin Panel:**
- 5 tabs ("System Health", "Database", "Storage Inspector", "Admin Actions", "SSOT Browser") passen niet op 375px
- Cards en grids overlopen
- Issues-lijst wordt een eindeloze scroll

**Teacher Cockpit:**
- Vaste `w-[360px]` sidebar past niet op mobiel — inhoud wordt afgekapt
- Detail panel is onbereikbaar

### Aanpak

**Horizontaal scrollbare tabs** — simpelste en meest herkenbare patroon op mobiel. Geen popups of uitklapmenu's nodig; tabs zijn al de navigatiestructuur.

### Wijzigingen

| Bestand | Wat |
|---------|-----|
| `src/pages/AdminPanel.tsx` | 1. TabsList: `overflow-x-auto` + `w-full` zodat tabs horizontaal scrollen op mobiel 2. Kortere tablabels op mobiel via `hidden sm:inline` spans (bijv. "Health" ipv "System Health") 3. Header: flex-wrap op mobiel, kleinere padding 4. Monitoring grid `grid-cols-1` altijd op mobiel (al zo) 5. Issues-lijst: max-height + scroll (al deels, bevestigen) |
| `src/pages/TeacherCockpit.tsx` | 1. Master-detail patroon: sessie-lijst full-width op mobiel, verborgen bij selectie 2. Detail panel full-width op mobiel met terug-knop 3. Sidebar `w-full md:w-[360px]` 4. Textarea `text-[16px]` voor iOS |

Twee bestanden, puur responsieve CSS-condities + een mobiele terug-knop in TeacherCockpit.

