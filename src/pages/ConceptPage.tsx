import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Layers, Shield, Sparkles, BookOpen, AlertTriangle, Zap } from 'lucide-react';

const ConceptPage = () => {
  // SSOT v15 / EAI MODEL 8.0 — Exacte definities uit whitepaper
  const dimensions = [
    { 
      code: 'K', 
      name: 'Kennis & Automatisering',
      goal: 'Kennisobject bepalen (feit / procedure / metacognitie) en daarbij passende didactiek afdwingen.',
      bands: [
        { id: 'K0', label: 'Ongedefinieerd', desc: 'Het gevraagde kennisobject is nog niet scherp.' },
        { id: 'K1', label: 'Feitenkennis', desc: 'Termen, definities, eigenschappen (doel: snel en foutloos ophalen).' },
        { id: 'K2', label: 'Procedurele Kennis', desc: 'Handelingen, stappen en beslismomenten (doel: correct uitvoeren).' },
        { id: 'K3', label: 'Metacognitie', desc: 'Plannen, monitoren en evalueren van aanpak (doel: betere strategie-keuzes).' },
      ]
    },
    { 
      code: 'P', 
      name: 'Procesfase',
      goal: 'Fase van het leerproces bepalen voor passende interventie.',
      bands: [
        { id: 'P0', label: 'Ongedefinieerd', desc: 'Procesfase is niet te bepalen.' },
        { id: 'P1', label: 'Oriëntatie', desc: 'Verkennen van opdracht, eisen, context en startpunt.' },
        { id: 'P2', label: 'Voorkennis', desc: 'Voorkennis activeren en ordenen om een werkbaar schema te bouwen.' },
        { id: 'P3', label: 'Instructie', desc: 'Begrip opbouwen en relaties verklaren.' },
        { id: 'P4', label: 'Toepassen', desc: 'Oefenen in een (nieuwe) context en fouten gebruiken als leersignaal.' },
        { id: 'P5', label: 'Evaluatie', desc: 'Kwaliteit toetsen aan criteria en conclusies trekken.' },
      ]
    },
    { 
      code: 'TD', 
      name: 'Taakdichtheid',
      goal: 'Wie doet het werk? Balanceert leerlingactiviteit versus AI-overname.',
      bands: [
        { id: 'TD0', label: 'Ongedefinieerd', desc: 'Verdeling van taken is onduidelijk.' },
        { id: 'TD1', label: 'Leerling-dominant', desc: 'Leerling voert vrijwel alles zelf uit; AI is klankbord.' },
        { id: 'TD2', label: 'Leerling-geleid', desc: 'Leerling doet kernwerk; AI structureert en ondersteunt.' },
        { id: 'TD3', label: 'Gedeeld', desc: 'Co-constructie; leerling en AI bouwen om beurten aan resultaat.' },
        { id: 'TD4', label: 'AI-geleid', desc: 'AI neemt tijdelijk de leiding om een procedure te modelleren.' },
        { id: 'TD5', label: 'AI-dominant', desc: 'AI doet vrijwel alles; hoog risico op agency-verlies.' },
      ]
    },
    { 
      code: 'C', 
      name: 'Co-regulatie',
      goal: 'Mate van gedeelde regie (AI-monoloog → leerling-geankerd).',
      bands: [
        { id: 'C0', label: 'Ongedefinieerd', desc: 'Interactieregie is onduidelijk of afwezig.' },
        { id: 'C1', label: 'AI-monoloog', desc: 'De leerling levert te weinig eigen taal/denken.' },
        { id: 'C2', label: 'AI-geleid', desc: 'AI bepaalt tempo en volgorde; leerling volgt.' },
        { id: 'C3', label: 'Gedeelde start', desc: 'Leerling neemt initiatief, maar zoekt nog regie-bevestiging.' },
        { id: 'C4', label: 'Gedeelde regie', desc: 'Dialoog over inhoud én aanpak; leerling verantwoordt keuzes.' },
        { id: 'C5', label: 'Leerling-geankerd', desc: 'Leerling stuurt het proces en beoordeelt de kwaliteit.' },
      ]
    },
    { 
      code: 'V', 
      name: 'Vaardigheidspotentieel',
      goal: 'Soort leerhandeling en vaardigheidsdiepte.',
      bands: [
        { id: 'V0', label: 'Ongedefinieerd', desc: 'Er is nog geen herkenbare denkhandeling of leeractiviteit zichtbaar.' },
        { id: 'V1', label: 'Verkennen', desc: 'Ophalen, verkennen en vragen genereren.' },
        { id: 'V2', label: 'Verbinden', desc: 'Relaties leggen, vergelijken en patronen herkennen.' },
        { id: 'V3', label: 'Toepassen', desc: 'Kennis inzetten in een specifieke context of casus.' },
        { id: 'V4', label: 'Herzien', desc: 'Evalueren, fouten diagnosticeren en verbeteren.' },
        { id: 'V5', label: 'Verankeren', desc: 'Integreren en transfer naar nieuwe domeinen.' },
      ]
    },
    { 
      code: 'T', 
      name: 'Tool Awareness',
      goal: 'Transparantie en kritisch partnerschap met AI.',
      bands: [
        { id: 'T0', label: 'Ongedefinieerd', desc: 'Onheldere rol van AI/tool in het leerproces.' },
        { id: 'T1', label: 'Opaque', desc: 'AI wordt behandeld als orakel; weinig controle of begrip.' },
        { id: 'T2', label: 'Functioneel', desc: 'AI wordt gebruikt als gereedschap voor deeltaken.' },
        { id: 'T3', label: 'Transparant', desc: 'De werkwijze is bespreekbaar en navolgbaar (Glass Box).' },
        { id: 'T4', label: 'Synergetisch', desc: 'Leerling en AI versterken elkaar; leerling gebruikt AI als sparring.' },
        { id: 'T5', label: 'Kritisch Partnerschap', desc: 'Wederzijdse correctie en bias-bewust gebruik.' },
      ]
    },
    { 
      code: 'E', 
      name: 'Epistemische Veiligheid',
      goal: 'Van schijnzekerheid naar geverifieerde autoriteit.',
      bands: [
        { id: 'E0', label: 'Schijnzekerheid', desc: 'Er wordt met te veel zekerheid gesproken zonder basis.' },
        { id: 'E1', label: 'Ongeverifieerd', desc: 'Claims staan los van bronnen of controleerbare gegevens.' },
        { id: 'E2', label: 'Bron-Noodzaak', desc: 'Uitspraak vereist onderbouwing voordat je verder bouwt.' },
        { id: 'E3', label: 'Geverifieerd', desc: 'Er is controle uitgevoerd met betrouwbare bronnen.' },
        { id: 'E4', label: 'Kritisch', desc: 'Er wordt actief gezocht naar tegenbewijs en randgevallen.' },
        { id: 'E5', label: 'Autoriteit', desc: 'Conclusies zijn gebaseerd op weging van bewijs en onzekerheden.' },
      ]
    },
    { 
      code: 'L', 
      name: 'Leercontinuïteit',
      goal: 'Leercontinuïteit en transfer over tijd en contexten heen.',
      bands: [
        { id: 'L0', label: 'Ongedefinieerd', desc: 'Er is nog geen afronding of borging.' },
        { id: 'L1', label: 'Gefragmenteerd', desc: 'Resultaat is taak- of momentgebonden en moeilijk te herhalen.' },
        { id: 'L2', label: 'Taakgebonden', desc: 'Leerling kan de taak uitvoeren maar mist het onderliggende principe.' },
        { id: 'L3', label: 'Conceptueel', desc: 'Leerling begrijpt het principe en kan het verwoorden.' },
        { id: 'L4', label: 'Transfer', desc: 'Leerling kan het toepassen in een andere, nieuwe context.' },
        { id: 'L5', label: 'Duurzaam', desc: 'Kennis/vaardigheid is verankerd en zelfstandig inzetbaar.' },
      ]
    },
    { 
      code: 'S', 
      name: 'Sociale Interactie',
      goal: 'Sociale laag: isolatie → katalysator voor samenwerking.',
      bands: [
        { id: 'S0', label: 'Ongedefinieerd', desc: 'Sociale context is niet gespecificeerd.' },
        { id: 'S1', label: 'Isolatie', desc: 'Menselijke feedback/peers verdwijnen uit beeld.' },
        { id: 'S2', label: 'Tutor', desc: '1-op-1 leren met AI als functionele coach.' },
        { id: 'S3', label: 'Brug', desc: 'Voorbereiding op een gesprek/feedback met een mens.' },
        { id: 'S4', label: 'Partner', desc: 'AI werkt mee als teamlid in een groepstaak.' },
        { id: 'S5', label: 'Katalysator', desc: 'AI ondersteunt collectieve intelligentie en synthese.' },
      ]
    },
    { 
      code: 'B', 
      name: 'Bias & Inclusie',
      goal: 'Van blind naar systemisch corrigeren.',
      bands: [
        { id: 'B0', label: 'Ongedefinieerd', desc: 'Bias/inclusie is (nog) niet relevant voor de taak.' },
        { id: 'B1', label: 'Blind', desc: 'Stereotypen of eenzijdige aannames worden ongemerkt gereproduceerd.' },
        { id: 'B2', label: 'Impliciet', desc: 'Er is lichte spanning/uitsluiting, maar het blijft onbesproken.' },
        { id: 'B3', label: 'Bewust', desc: 'Bias wordt herkend en er is intentie tot neutraler taalgebruik.' },
        { id: 'B4', label: 'Correctie', desc: 'Actieve aanpassing van framing, voorbeelden en perspectieven.' },
        { id: 'B5', label: 'Systemisch', desc: 'Analyse van oorzaken van bias en impact op besluitvorming.' },
      ]
    },
  ];

  const logicGates = [
    {
      trigger: 'K1',
      condition: 'Feitenkennis',
      enforcement: 'MAX_TD = TD2',
      description: 'Doel: ophalen en automatiseren. Geen conceptuele uitleg; alleen bevragen, corrigeren, herhalen.',
      priority: 'CRITICAL'
    },
    {
      trigger: 'K2', 
      condition: 'Procedurele kennis',
      enforcement: 'ALLOW_TD = TD4',
      description: 'Modeling toegestaan: voordoen (hardop), samen oefenen, daarna laten nadoen.',
      priority: 'HIGH'
    },
    {
      trigger: 'K3',
      condition: 'Metacognitie',
      enforcement: 'MAX_TD = TD2',
      description: 'Reflectie en regulatie centraal. AI geeft geen oplossing of eindconclusie.',
      priority: 'CRITICAL'
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Terug naar Home</span>
          </Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            EAI MODEL 8.0
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16 text-center">
          <span className="text-primary text-xs font-bold uppercase tracking-widest mb-4 block">
            Wetenschappelijk Fundament
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            SSOT v15 Didactische Matrix
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Evidence-informed AI in het onderwijsleerproces. Deterministische didactische policy bovenop een probabilistisch model.
          </p>
        </div>

        {/* Key Concepts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-border bg-card">
            <Brain className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cognitieve Belasting</h3>
            <p className="text-sm text-muted-foreground">
              Micro-interventies: één stap, één vraag, één check. Scaffolding aanbieden zonder alles in te vullen. 
              Gebaseerd op Sweller (1988) en Kirschner, Sweller & Clark (2006).
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <Layers className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">SSOT als Policy</h3>
            <p className="text-sm text-muted-foreground">
              Single Source of Truth definieert rubrics, bands, fixes en commands. 
              De LLM is uitvoerend, niet normerend. Policy is data, niet prompttekst.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Logic Gates</h3>
            <p className="text-sm text-muted-foreground">
              Harde regels die taakdichtheid begrenzen afhankelijk van kennistype (K). 
              Dit voorkomt dat de AI 'behulpzaam' te snel oplossingen geeft.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <Sparkles className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Semantische Integriteit</h3>
            <p className="text-sm text-muted-foreground">
              Structurele integriteit (JSON valide) is niet genoeg. De leerlingtekst moet 
              doen wat de band-keuze claimt. Semantische guard vóór weergave.
            </p>
          </div>
        </div>

        {/* Logic Gates Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-2xl font-bold">Logic Gates: Didactische Hardheid</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Logic gates dwingen het systeem om de taakdichtheid (TD) te begrenzen afhankelijk van het kennistype. 
            Dit operationaliseert het principe dat verschillende kennisobjecten andere begeleiding vragen.
          </p>
          <div className="space-y-4">
            {logicGates.map((gate) => (
              <div 
                key={gate.trigger}
                className={`p-4 rounded-xl border ${
                  gate.priority === 'CRITICAL' 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : 'border-yellow-500/50 bg-yellow-500/5'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-lg text-foreground">{gate.trigger}</span>
                  <span className="text-sm text-muted-foreground">{gate.condition}</span>
                  <span className={`ml-auto text-xs font-bold uppercase px-2 py-1 rounded ${
                    gate.priority === 'CRITICAL' 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-yellow-500/20 text-yellow-600'
                  }`}>
                    {gate.priority}
                  </span>
                </div>
                <p className="text-sm font-mono text-primary mb-1">{gate.enforcement}</p>
                <p className="text-sm text-muted-foreground">{gate.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 10D Dimensions */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">De 10 Dimensies (SSOT v15)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Elke interactie wordt geclassificeerd langs 10 orthogonale rubrics. 
            De cyclus (volgorde) is expliciet: K → P → TD → C → V → T → E → L → S → B.
          </p>
          
          <div className="space-y-6">
            {dimensions.map((dim) => (
              <div 
                key={dim.code}
                className="border border-border rounded-xl bg-card overflow-hidden"
              >
                <div className="p-4 bg-secondary/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-mono font-bold text-sm">
                      {dim.code}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{dim.name}</h3>
                      <p className="text-xs text-muted-foreground">{dim.goal}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dim.bands.map((band) => (
                      <div 
                        key={band.id}
                        className="p-2 rounded-lg bg-secondary/20 border border-border/50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-primary">{band.id}</span>
                          <span className="text-xs font-medium text-foreground">{band.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{band.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ICAP & TD */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">ICAP & Taakdichtheid</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Het ICAP-framework (Chi & Wylie, 2014) stelt dat diep leren ontstaat wanneer leerlingen constructief of interactief bezig zijn. 
            EAI Model 8.0 koppelt ICAP aan TD:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
              <span className="text-sm font-bold text-green-500">TD1–TD2</span>
              <p className="text-sm text-muted-foreground mt-2">
                Leerling actief/constructief. AI stelt vragen, leerling produceert.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
              <span className="text-sm font-bold text-yellow-500">TD3</span>
              <p className="text-sm text-muted-foreground mt-2">
                Gedeeld (co-constructie), mits leerling zichtbaar werk doet.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <span className="text-sm font-bold text-destructive">TD4–TD5</span>
              <p className="text-sm text-muted-foreground mt-2">
                Risico op passiviteit. AI doet het werk; leerling consumeert.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-12 border-t border-border">
          <p className="text-muted-foreground mb-6">
            Klaar om het in actie te zien?
          </p>
          <Link 
            to="/student" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
          >
            Start Student Studio
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ConceptPage;
