

## Fix: verplaats setSessionOffline naar dedicated useEffect

**Probleem:** `setSessionOffline` zit in de cleanup van het sync-effect (regel 136-140) dat 6 dependencies heeft. Bij elke state-update wordt de sessie offline gezet en direct weer online — status-flapping.

**Wijziging in `src/components/ChatInterface.tsx`:**

1. **Verwijder** `setSessionOffline(capturedSessionId)` uit de sync-effect cleanup (regel 135-140). Cleanup wordt alleen `clearInterval(interval)`.

2. **Voeg nieuw effect toe** direct na het sync-effect:
```typescript
// Mark old session offline only on sessionId change or unmount
useEffect(() => {
  const captured = sessionId;
  return () => {
    setSessionOffline(captured);
  };
}, [sessionId]);
```

Geen andere bestanden worden geraakt. Issues 1 en 2 blijven ongewijzigd.

