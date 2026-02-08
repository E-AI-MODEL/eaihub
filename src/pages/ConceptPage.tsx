import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Layers, Shield, Sparkles, BookOpen, AlertTriangle, Zap } from 'lucide-react';
import { getDimensionsForUI, getLogicGatesForUI } from '@/utils/ssotHelpers';
import { SSOT_DATA } from '@/data/ssot';

const ConceptPage = () => {
  // Dynamic SSOT data (cached)
  const dimensions = useMemo(() => getDimensionsForUI(), []);
  const logicGates = useMemo(() => getLogicGatesForUI(), []);

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
            EAI SSOT
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
            <h2 className="text-2xl font-bold">De 10 Dimensies (SSOT v{SSOT_DATA.version})</h2>
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
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{band.description}</p>
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
          <h2 className="text-2xl font-bold mb-4">Klaar om te starten?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Probeer EAI nu met je eigen leervraag en ervaar didactisch verantwoorde AI-begeleiding.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
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