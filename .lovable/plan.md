

# Fix: Toolbox (leerling) + Chatlog & berichten (docent) — 3 bugs, 2 bestanden

## Bug 1: Toolbox werkt niet (leerling)

**Oorzaak:** `ChatInterface.tsx` regel 142-147 — de `useEffect` die `pendingCommand` afhandelt roept `handleSend` aan, maar `handleSend` staat NIET in de dependency array. React sluit de oude versie van `handleSend` in de closure op. Als `isLoading` inmiddels `true` is (of andere state veranderd is), wordt het commando stilletjes genegeerd door de guard op regel 180: `if (!textToSend || isLoading) return`.

**Fix:** Wrap `handleSend` in `useCallback` met juiste dependencies, en voeg het toe aan de `useEffect` dependency array.

```typescript
// ChatInterface.tsx — handleSend wrappen in useCallback
const handleSend = useCallback(async (textOverride?: string) => {
  // ... bestaande body
}, [input, isLoading, profile, sessionId, userId, onAnalysisUpdate]);

// useEffect — handleSend toevoegen aan deps
useEffect(() => {
  if (pendingCommand) {
    handleSend(pendingCommand);
    onCommandConsumed?.();
  }
}, [pendingCommand, handleSend, onCommandConsumed]);
```

## Bug 2: Docent ziet chatlog count maar geen inhoud

**Oorzaak:** `fetchChatMessages` in `adminDbService.ts` doet `throw error` bij een fout. In TeacherCockpit wordt dit gevangen met `.catch(() => setChatLog([]))` — de docent ziet "Geen chatberichten" terwijl er data is. Als er een subtiele fout optreedt (netwerk, timeout), verdwijnt alles stilletjes.

Daarnaast: de docent mist `useAuth` import, waardoor er geen user context beschikbaar is voor feedback of naamgeving.

**Fix:**
1. `fetchChatMessages` in adminDbService: graceful return (`[]` + console.error) in plaats van `throw`
2. TeacherCockpit: import `useAuth`, gebruik `user` voor teacherName
3. Voeg toast feedback toe bij send succes/fout

## Bug 3: Docent kan geen berichten sturen

**Oorzaak:** `handleSendMessage` (regel 64-77) vangt errors op met alleen `console.error`. Er is geen visuele feedback. De docent weet niet of het bericht is verstuurd of gefaald. Bovendien wordt `teacherName` niet meegegeven aan `sendTeacherMessage` — standaard 'Docent'.

**Fix:**
1. Import `useAuth` + `toast` in TeacherCockpit
2. Gebruik `user?.user_metadata?.name` als teacherName
3. Toast bij succes ("Bericht verzonden") en bij fout ("Verzenden mislukt")

## Wijzigingen

| Bestand | Wat | Impact |
|---|---|---|
| `src/components/ChatInterface.tsx` | `handleSend` → `useCallback`, useEffect deps fix | Toolbox werkt |
| `src/services/adminDbService.ts` | `fetchChatMessages`: graceful error return | Chatlog toont data |
| `src/pages/TeacherCockpit.tsx` | Import useAuth + toast, teacherName fix, send feedback | Berichten werken + feedback |

