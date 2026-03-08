

# Plan: Dashboard info-knoppen + inklapbare secties + ConceptPage "Update mrt2026" tab

## Status check

- **Update mrt2026 tab op ConceptPage**: is **nog niet gebouwd**. Geen spoor van in de code. De ConceptPage heeft nog steeds 4 tabs (Overzicht, 10D Matrix, Logic Gates, ICAP & TD).
- **Dashboard info-knoppen en inklapbaarheid**: niet aanwezig. Alle secties staan altijd open, zonder uitleg.

## Wat te bouwen

### 1. Dashboard: info-knoppen (ⓘ) + inklapbare secties

**Bestand: `src/components/Dashboard.tsx`**

- Importeer `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` uit `@/components/ui/collapsible`
- Importeer `Info` icon uit lucide-react
- Elke sectie (Procesfase, Interventie, Epistemische Status, Zelfstandigheid, G-Factor, Leerder) wordt:
  - Standaard **ingeklapt** (behalve Procesfase die open start)
  - **Klikbaar op de header** om uit/in te klappen
  - Voorzien van een klein **(ⓘ) tooltip/popover** naast de titel met een korte uitleg in begrijpelijke taal
- Gebruik `Collapsible` + lokale state (`useState` met set van open secties)
- Info-teksten per sectie:
  - Procesfase: "Toont in welke leerfase je zit: van oriëntatie tot reflectie"
  - Interventie: "De actieve didactische actie die de AI nu inzet"
  - Epistemische Status: "Hoe de AI jouw kennisopbouw inschat"
  - Zelfstandigheid: "Hoe zelfstandig je werkt — de AI past de begeleiding hierop aan"
  - G-Factor: "Meet hoe goed de AI-analyse overeenkomt met het didactisch model"
  - Leerder: "Jouw profiel en instellingen"

### 2. ConceptPage: nieuwe tab "Update mrt2026"

**Bestand: `src/pages/ConceptPage.tsx`**

- Voeg 5e `TabsTrigger` "Update mrt2026" toe
- Voeg `TabsContent` toe met 7 secties (eerder afgesproken):
  1. Analyse-architectuur (edge-classify, reliabilityPipeline, analysisSource)
  2. Nuance in classificatie (confidence, K0-K3, borderline)
  3. Leerlingervaring & rolzichtbaarheid (leskaart, drie perspectieven)
  4. Auth & rollenmodel (RBAC, RLS, has_role)
  5. EITL plugin-architectuur (whitelistMerge, Zod validatie, wizard)
  6. Governance (versioning, rollback, audit log)
  7. Observability (trending-grafieken, healing totaalsignaal, breach rate)
- Consistent met bestaande card-stijl, geen "toekomst"-sectie

Geschatte omvang: ~50 regels Dashboard wijzigingen, ~160 regels ConceptPage toevoeging.

