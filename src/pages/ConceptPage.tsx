import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  Layers, 
  Shield, 
  Sparkles, 
  BookOpen, 
  AlertTriangle, 
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
  Grid3X3,
  Lock
} from 'lucide-react';
import { getDimensionsForUI, getLogicGatesForUI, getDimensionColors } from '@/utils/ssotHelpers';
import { getSSOTVersion } from '@/data/ssot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import FactoryDiagram from '@/components/FactoryDiagram';

const ConceptPage = () => {
  const dimensions = useMemo(() => getDimensionsForUI(), []);
  const logicGates = useMemo(() => getLogicGatesForUI(), []);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  // Key concepts data
  const keyConcepts = [
    {
      icon: Brain,
      title: 'Cognitieve Belasting',
      description: 'De AI stelt steeds één gerichte vraag of geeft één hint — nooit te veel tegelijk.',
      detail: 'Gebaseerd op Cognitive Load Theory (Sweller, 1988; Kirschner et al., 2006).',
    },
    {
      icon: Layers,
      title: 'Eén Bron van Waarheid',
      description: 'Alle didactische regels staan op één plek. De AI voert uit, maar bepaalt niet wat goed onderwijs is.',
      detail: 'Technisch: Single Source of Truth (SSOT) definieert rubrics, niveaus en interventies.',
    },
    {
      icon: Shield,
      title: 'Harde Grenzen',
      description: 'Vaste regels voorkomen dat de AI te snel antwoorden geeft wanneer de leerling zelf moet nadenken.',
      detail: 'Technisch: Logic Gates begrenzen taakdichtheid op basis van kennistype.',
    },
    {
      icon: Sparkles,
      title: 'Kwaliteitscontrole',
      description: 'Elke AI-reactie wordt gecontroleerd: past het antwoord bij wat de leerling echt nodig heeft?',
      detail: 'Technisch: Semantische validatie (G-factor) vóór weergave aan de leerling.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Terug</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider uppercase px-2 py-1 rounded-full bg-primary/10 text-primary">
              EAI v{getSSOTVersion()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Hero Section - Compact */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
            <BookOpen className="w-4 h-4" />
            Wetenschappelijk Fundament
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            EAI Didactisch Model
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            AI die écht begeleidt in plaats van antwoorden weggeeft. Gebouwd op bewezen onderwijswetenschap, met vaste regels die de kwaliteit waarborgen.
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-2xl mt-1 italic">
            Technisch: deterministische didactische policy bovenop probabilistische taalmodellen.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="p-4 rounded-xl border border-border bg-card/50 text-center">
            <div className="text-2xl font-bold text-primary">10</div>
            <div className="text-xs text-muted-foreground">Dimensies</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50 text-center">
            <div className="text-2xl font-bold text-primary">{logicGates.length}</div>
            <div className="text-xs text-muted-foreground">Logic Gates</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50 text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(dimensions.reduce((sum, d) => sum + d.bands.length, 0) / dimensions.length)}</div>
            <div className="text-xs text-muted-foreground">Gem. niveaus/dim</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50 text-center">
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-xs text-muted-foreground">Leerstrategieën</div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start bg-secondary/30 p-1 rounded-xl overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg px-4">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Overzicht</span>
            </TabsTrigger>
            <TabsTrigger value="dimensions" className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg px-4">
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">10D Matrix</span>
            </TabsTrigger>
            <TabsTrigger value="gates" className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg px-4">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Logic Gates</span>
            </TabsTrigger>
            <TabsTrigger value="icap" className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg px-4">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">ICAP & TD</span>
            </TabsTrigger>
            <TabsTrigger value="update2026" className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg px-4">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Update mrt2026</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-300">
            {/* Key Concepts - Compact Cards */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Kernconcepten
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {keyConcepts.map((concept, idx) => (
                  <div 
                    key={idx}
                    className="group p-4 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <concept.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground mb-1">{concept.title}</h3>
                        <p className="text-sm text-muted-foreground">{concept.description}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 italic">{concept.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Dimension Cycle */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-primary" />
                Dimensie Cyclus
              </h2>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-1">
                  Bij elke interactie beoordeelt de AI de leerling op 10 onafhankelijke dimensies — van kennistype tot zelfstandigheid:
                </p>
                <p className="text-[10px] text-muted-foreground/50 italic mb-4">
                  Technisch: 10 orthogonale rubrics in vaste cyclusvolgorde.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {dimensions.map((dim, idx) => {
                    const colors = getDimensionColors(dim.code);
                    return (
                      <div key={dim.code} className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedDimension(expandedDimension === dim.code ? null : dim.code)}
                          className={`px-3 py-1.5 rounded-lg border ${colors.border} ${colors.bg} hover:opacity-80 transition-all cursor-pointer`}
                        >
                          <span className={`font-mono font-bold text-sm ${colors.text}`}>{dim.code}</span>
                        </button>
                        {idx < dimensions.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Expanded dimension detail */}
                {expandedDimension && (
                  <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border animate-in slide-in-from-top-2 duration-200">
                    {(() => {
                      const dim = dimensions.find(d => d.code === expandedDimension);
                      const colors = getDimensionColors(expandedDimension);
                      if (!dim) return null;
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-mono font-bold ${colors.text}`}>{dim.code}</span>
                            <span className="font-medium text-foreground">{dim.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{dim.goal}</p>
                          <div className="flex flex-wrap gap-2">
                            {dim.bands.slice(0, 6).map((band) => (
                              <span 
                                key={band.id}
                                className="text-xs px-2 py-1 rounded bg-background/50 text-muted-foreground border border-border/50"
                                title={band.description}
                              >
                                <span className="font-mono font-medium text-primary">{band.id}</span>
                                <span className="mx-1">·</span>
                                {band.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Dimensions Tab */}
          <TabsContent value="dimensions" className="animate-in fade-in-50 duration-300">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-primary" />
                10 Dimensies (SSOT v{getSSOTVersion()})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Klik op een dimensie om de bands te bekijken.
              </p>
            </div>
            
            <Accordion type="single" collapsible className="space-y-2">
              {dimensions.map((dim, idx) => {
                const colors = getDimensionColors(dim.code);
                return (
                  <AccordionItem 
                    key={dim.code} 
                    value={dim.code}
                    className={`border ${colors.border} rounded-xl overflow-hidden bg-card data-[state=open]:${colors.bg}`}
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <span className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center font-mono font-bold text-sm border ${colors.border}`}>
                          {dim.code}
                        </span>
                        <div className="text-left flex-1">
                          <h3 className="font-medium text-foreground text-sm">{dim.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{dim.goal}</p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                          {dim.bands.length} bands
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {dim.bands.map((band) => (
                          <div 
                            key={band.id}
                            className="p-3 rounded-lg bg-secondary/20 border border-border/50 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-xs font-mono font-bold ${colors.text}`}>{band.id}</span>
                              <span className="text-xs font-medium text-foreground">{band.label}</span>
                              {band.fix && (
                                <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                                  {band.fix}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{band.description}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          {/* Logic Gates Tab */}
          <TabsContent value="gates" className="animate-in fade-in-50 duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Logic Gates: Vaste Didactische Grenzen
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vaste regels die bepalen hoeveel de AI mag voordoen, afhankelijk van wat de leerling al weet.
              </p>
              <p className="text-[10px] text-muted-foreground/50 italic mt-0.5">
                Technisch: taakdichtheid (TD) wordt mechanisch begrensd op basis van kennistype (K-niveau).
              </p>
            </div>

            <div className="space-y-4">
              {logicGates.map((gate, idx) => (
                <div 
                  key={gate.trigger}
                  className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                    gate.priority === 'CRITICAL' 
                      ? 'border-destructive/40 bg-destructive/5 hover:border-destructive/60' 
                      : 'border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg ${
                      gate.priority === 'CRITICAL' 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {gate.trigger}
                    </div>
                    <div className="flex-1">
                     <div className="font-medium text-foreground">{gate.condition}</div>
                      <div className="text-xs text-muted-foreground">Wanneer de leerling op dit niveau zit</div>
                    </div>
                    <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full ${
                      gate.priority === 'CRITICAL' 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {gate.priority}
                    </span>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="font-mono font-semibold text-primary">{gate.enforcement}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{gate.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Why Logic Gates */}
            <div className="mt-8 p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Waarom Logic Gates?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-modellen zijn getraind om zo behulpzaam mogelijk te zijn. In onderwijs is dat soms juist verkeerd: 
                goed onderwijs vraagt soms "stel een vraag" in plaats van "geef het antwoord". 
                Logic Gates zorgen ervoor dat de AI zich aan didactische principes houdt, ook als het model 
                het liefst gewoon het antwoord zou geven.
              </p>
              <p className="text-[10px] text-muted-foreground/50 italic mt-2">
                Technisch: LLM alignment optimaliseert voor helpfulness; Logic Gates overrulen dit met didactische constraints.
              </p>
            </div>
          </TabsContent>

          {/* ICAP Tab */}
          <TabsContent value="icap" className="animate-in fade-in-50 duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                ICAP & Taakdichtheid
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hoe actiever de leerling, hoe dieper het leren. Dit framework bepaalt wanneer de AI moet sturen en wanneer de leerling zelf aan zet is.
              </p>
              <p className="text-[10px] text-muted-foreground/50 italic mt-0.5">
                Gebaseerd op het ICAP-framework (Chi & Wylie, 2014).
              </p>
            </div>

            {/* TD Spectrum */}
            <div className="p-5 rounded-xl border border-border bg-card mb-6">
              <h3 className="font-medium text-foreground mb-4">Taakdichtheid Spectrum</h3>
              <div className="relative">
                {/* Gradient bar */}
                <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 mb-4" />
                
                {/* Labels */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Leerling denkt zelf</span>
                  <span>Samen werken</span>
                  <span>AI doet voor</span>
                </div>
              </div>
            </div>

            {/* TD Levels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-xl border-2 border-green-500/40 bg-green-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-green-500">TD1–TD2</span>
                  <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">Optimaal</span>
                </div>
                <h4 className="font-medium text-foreground mb-2">Leerling Actief</h4>
                <p className="text-sm text-muted-foreground">
                  De leerling denkt zelf na, formuleert antwoorden en bouwt kennis op. De AI stelt vragen en geeft hints.
                </p>
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <span className="text-xs font-medium text-green-600">Constructief & Interactief leren</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border-2 border-yellow-500/40 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-yellow-500">TD3</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">Balans</span>
                </div>
                <h4 className="font-medium text-foreground mb-2">Samen Bouwen</h4>
                <p className="text-sm text-muted-foreground">
                  AI en leerling werken samen. De leerling draagt zichtbaar bij, de AI vult aan en structureert.
                </p>
                <div className="mt-3 pt-3 border-t border-yellow-500/20">
                  <span className="text-xs font-medium text-yellow-600">Actief leren</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border-2 border-destructive/40 bg-destructive/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-destructive">TD4–TD5</span>
                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Risico</span>
                </div>
                <h4 className="font-medium text-foreground mb-2">AI Doet Voor</h4>
                <p className="text-sm text-muted-foreground">
                  De AI geeft het antwoord of doet de stap voor. Alleen nuttig als de leerling écht vastloopt en een voorbeeld nodig heeft.
                </p>
                <div className="mt-3 pt-3 border-t border-destructive/20">
                  <span className="text-xs font-medium text-destructive">Passief ontvangen — alleen voor modeling</span>
                </div>
              </div>
            </div>

            {/* ICAP Explanation */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-3">Niveaus van Leeractiviteit</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { level: 'I', name: 'Interactief', desc: 'In gesprek met anderen leren' },
                  { level: 'C', name: 'Constructief', desc: 'Zelf nieuwe kennis opbouwen' },
                  { level: 'A', name: 'Actief', desc: 'Gericht oefenen en toepassen' },
                  { level: 'P', name: 'Passief', desc: 'Alleen luisteren of lezen' },
                ].map((item) => (
                  <div key={item.level} className="p-3 rounded-lg bg-secondary/20 text-center">
                    <div className="text-lg font-bold text-primary mb-1">{item.level}</div>
                    <div className="text-xs font-medium text-foreground">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                Hoe hoger het niveau, hoe dieper het leren. EAI stuurt actief naar Constructief en Interactief.
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1 italic">
                Bron: ICAP Framework — Chi & Wylie (2014)
              </p>
            </div>
          </TabsContent>

          {/* Update mrt2026 Tab */}
          <TabsContent value="update2026" className="animate-in fade-in-50 duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Architectuur Update — maart 2026
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Overzicht van alle architecturele verbeteringen die in maart 2026 zijn doorgevoerd.
              </p>
            </div>

            <Accordion type="multiple" className="space-y-2">
              {/* 1. Analyse-architectuur */}
              <AccordionItem value="item-1" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</span>
                    <h3 className="font-semibold text-foreground text-left">Analyse-architectuur</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Standaard AI-systemen sturen een vraag naar een LLM en geven het antwoord direct terug — zonder te controleren wat de leerling eigenlijk bedoelt. EAI Hub werkt anders: elke leerling-input doorloopt een <strong className="text-foreground">tweestaps-analyse</strong>. Eerst classificeert een snelle edge-functie de input op 10 didactische dimensies (zoals zelfregulatieniveau, misconcepties en kennisniveau). Daarna controleert de reliabilityPipeline of die classificatie klopt, en corrigeert waar nodig. Pas daarna wordt een respons gegenereerd — op basis van bewezen didactiek, niet op basis van gokken.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 italic">
                    Technisch: edge-classify → reliabilityPipeline.ts → analysisSource tag op elk bericht.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Nuance in classificatie */}
              <AccordionItem value="item-2" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">2</span>
                    <h3 className="font-semibold text-foreground text-left">Nuance in classificatie</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Niet elke leerling-input is eenduidig te classificeren. Daarom geeft het systeem een <strong className="text-foreground">betrouwbaarheidsscore</strong> mee bij elke classificatie. Twijfelgevallen — wanneer een antwoord op de grens zit tussen twee niveaus — worden expliciet als 'borderline' gemarkeerd. In die gevallen reageert het systeem voorzichtiger: het stelt een verduidelijkende vraag in plaats van een aanname te doen. Zo voorkomt EAI Hub dat een leerling onterecht wordt ingeschaald en verkeerde begeleiding krijgt.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 italic">
                    Technisch: confidence levels, knowledge_type K0-K3, borderline-detectie.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Leerlingervaring & rolzichtbaarheid */}
              <AccordionItem value="item-3" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">3</span>
                    <h3 className="font-semibold text-foreground text-left">Leerlingervaring & rolzichtbaarheid</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Dezelfde leersessie wordt vanuit <strong className="text-foreground">drie perspectieven</strong> zichtbaar gemaakt. De leerling ziet een leskaart: een visueel overzicht van waar hij staat en wat de volgende stap is. De docent ziet voortgang, patronen en kan didactische interventies sturen. De beheerder ziet systeemstatus, analyse-kwaliteit en technische gezondheid. Ieder ziet precies wat relevant is voor zijn rol — niet meer, niet minder.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: rolgebaseerde UI met leskaart-panel, docent-cockpit en admin-dashboard.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Auth & rollenmodel */}
              <AccordionItem value="item-4" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">4</span>
                    <h3 className="font-semibold text-foreground text-left">Auth & rollenmodel</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Toegangscontrole is niet optioneel — het is een kernonderdeel van het systeem. EAI Hub werkt met <strong className="text-foreground">vier rollen</strong> (Leerling, Docent, Admin, Superuser), elk met strikt afgebakende rechten. Rollen worden niet in de browser bepaald (wat makkelijk te manipuleren is), maar <strong className="text-foreground">server-side gevalideerd</strong> op elke database-operatie. Een leerling kan nooit bij docentdata, een docent nooit bij admin-functies. Dit is niet alleen privacy, maar ook didactische integriteit.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: RBAC via user_roles tabel, RLS policies op elke tabel, has_role() security definer functie.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 5. EITL */}
              <AccordionItem value="item-5" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">5</span>
                    <h3 className="font-semibold text-foreground text-left">EITL — Education In The Loop</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    EITL staat voor <strong className="text-foreground">Education In The Loop</strong>: het onderwijs — de docent, de didactiek, de schoolvisie — blijft altijd in de beslislus van het systeem, niet de AI. De SSOT (Single Source of Truth) vormt de didactische basis: een wetenschappelijk onderbouwd model dat bepaalt hoe het systeem reageert op leerlinggedrag. Maar wij begrijpen dat elke school een eigen context heeft — een eigen visie, curriculum en pedagogische aanpak. Daarom is er bewust ruimte ingebouwd via het plugin-systeem: scholen kunnen het didactisch model annoteren en aanpassen aan hun specifieke situatie, zonder de wetenschappelijke kern te breken.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: whitelistMerge-strategie, Zod-validatie, EITL Wizard met vrije navigatie. Plugin annoteert, maar herdefinieert niet.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Governance */}
              <AccordionItem value="item-6" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">6</span>
                    <h3 className="font-semibold text-foreground text-left">Governance & versiebeheer</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Transparantie en verantwoording zijn essentieel wanneer AI in het onderwijs wordt ingezet. Elke wijziging aan het didactisch model wordt <strong className="text-foreground">gelogd met wie, wanneer en waarom</strong>. Rollback naar eerdere versies is altijd mogelijk, zodat een fout nooit definitief is. Dit geeft schoolbesturen en docenten de zekerheid dat het systeem controleerbaar en auditeerbaar is — geen black box, maar een open boek.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: ssot_changes audit log, versioning met hash-verificatie, rollback via admin panel.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Observability */}
              <AccordionItem value="item-7" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">7</span>
                    <h3 className="font-semibold text-foreground text-left">Observability & monitoring</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Een didactisch systeem dat je niet kunt monitoren, kun je niet vertrouwen. EAI Hub biedt <strong className="text-foreground">real-time monitoring</strong> van systeemgezondheid: hoe vaak corrigeert het systeem zichzelf (healing), hoe vaak worden didactische grenzen overschreden (breach rate), en is de AI-gateway bereikbaar? Deze signalen worden gevisualiseerd in trending-grafieken, zodat beheerders proactief kunnen ingrijpen in plaats van reactief.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: trending-grafieken voor healing totaalsignaal, breach rate tracking, gateway reachability checks.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 8. Geheugenarchitectuur */}
              <AccordionItem value="item-8" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">8</span>
                    <h3 className="font-semibold text-foreground text-left">Geheugenarchitectuur — kort- & langetermijn</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    De LLM haalt informatie uit twee bronnen: <strong className="text-foreground">lokale opslag</strong> (LocalStorage) voor de lopende sessie, en de <strong className="text-foreground">backend</strong> voor langetermijndata. Dit is bewust afgekeken van hoe het menselijk geheugen werkt. Lokaal = snel, direct, in het moment — vergelijkbaar met het kortetermijngeheugen. Backend = persistent, deelbaar, over sessies heen — vergelijkbaar met het langetermijngeheugen. Door deze samenwerking voert de LLM snellere en vloeiendere gesprekken, zonder context te verliezen wanneer een leerling terugkomt na een pauze of op een ander moment verder werkt.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: LocalStorage voor sessie-state en eaiState, backend sync via student_sessions en chat_messages tabellen.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 9. Beeldondersteuning */}
              <AccordionItem value="item-9" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">9</span>
                    <h3 className="font-semibold text-foreground text-left">Beeldondersteuning (Image)</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Image-generatie is toegevoegd in deze update. Visuele ondersteuning wordt <strong className="text-foreground">alleen actief ingezet wanneer het onderliggende model dit ondersteunt</strong> én wanneer een afbeelding het leren aantoonbaar versterkt — bijvoorbeeld bij biologische structuren, wiskundige grafieken of ruimtelijke concepten. Het systeem genereert geen plaatjes 'omdat het kan', maar omdat het de leerstap visueel verduidelijkt.
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    Technisch: conditionele image-generatie op basis van modelcapabiliteit en didactische relevantie.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* 10. Productielijn — dwarsdoorsnede */}
              <AccordionItem value="item-10" className="rounded-xl border border-border bg-card px-5">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">10</span>
                    <h3 className="font-semibold text-foreground text-left">Productielijn — dwarsdoorsnede</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <p className="text-sm text-muted-foreground mb-4">
                    Geen gestapeld gebouw, maar een <strong className="text-foreground">fabriek van opzij doorgezaagd</strong>: een lange hal met machines naast elkaar, transportbanden tussen de stations, en alles zichtbaar als je er dwars doorheen kijkt. Eén productielijn van links (gebruikersinput) naar rechts (eindantwoord). Klik op een station voor details.
                  </p>
                  <FactoryDiagram />
                  <p className="text-[11px] text-muted-foreground/70 italic mt-3">
                    Technisch: 8 stations representeren de volledige request-response cyclus — van sendMessage() tot MessageBubble render.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 text-center py-8 border-t border-border">
          <h2 className="text-xl font-bold mb-3">Klaar om te starten?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Ervaar didactisch verantwoorde AI-begeleiding met je eigen leervraag.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:scale-105"
          >
            Start een sessie
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ConceptPage;