import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Layers, Shield, Sparkles } from 'lucide-react';

const ConceptPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Terug naar Home</span>
          </Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Whitepaper
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16 text-center">
          <span className="text-primary text-xs font-bold uppercase tracking-widest mb-4 block">
            Architectuur & Uitleg
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            De 10D Didactische Matrix
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hoe EAI Studio de &quot;Black Box&quot; vervangt door een transparant, wetenschappelijk onderbouwd model.
          </p>
        </div>

        {/* Key Concepts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-border bg-card">
            <Brain className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ruijssenaars-theorie</h3>
            <p className="text-sm text-muted-foreground">
              Gebaseerd op het wetenschappelijke kader van educatieve diagnostiek. 
              Het model analyseert leerprocessen langs 10 dimensies voor optimale begeleiding.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <Layers className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">SSOT Principe</h3>
            <p className="text-sm text-muted-foreground">
              Single Source of Truth - Alle didactische logica wordt centraal beheerd. 
              Dit voorkomt inconsistenties en maakt het systeem volledig transparant.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Logic Gates</h3>
            <p className="text-sm text-muted-foreground">
              Strikte regels die voorkomen dat de AI ooit direct antwoorden geeft. 
              Bij K1/K3 niveaus wordt een Human Gate geactiveerd.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <Sparkles className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Adaptive Scaffolding</h3>
            <p className="text-sm text-muted-foreground">
              Het ondersteuningsniveau past zich dynamisch aan op basis van de 
              gemeten Agency Score en Knowledge Level van de leerling.
            </p>
          </div>
        </div>

        {/* 10D Dimensions */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">De 10 Dimensies</h2>
          <div className="space-y-4">
            {[
              { code: 'K', name: 'Knowledge', desc: 'Huidige kennisstand en conceptueel begrip' },
              { code: 'C', name: 'Cognitive Load', desc: 'Mentale belasting en werkgeheugen' },
              { code: 'P', name: 'Precision', desc: 'Nauwkeurigheid van leerling-input' },
              { code: 'TD', name: 'Task Difficulty', desc: 'Complexiteit van de leertaak' },
              { code: 'V', name: 'Verification', desc: 'Verificatie en validatie status' },
              { code: 'E', name: 'Engagement', desc: 'Betrokkenheid en motivatie' },
              { code: 'T', name: 'Time', desc: 'Tijdsfactoren en leertempo' },
              { code: 'S', name: 'Scaffolding', desc: 'Niveau van ondersteuning' },
              { code: 'L', name: 'Learning Modality', desc: 'Content type (narratief/technisch)' },
              { code: 'B', name: 'Behavior', desc: 'Gedragspatronen en interactie' },
            ].map((dim, i) => (
              <div 
                key={dim.code}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <span className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-mono font-bold text-sm">
                  {dim.code}
                </span>
                <div>
                  <span className="text-sm font-medium text-foreground">{dim.name}</span>
                  <p className="text-xs text-muted-foreground">{dim.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge Levels */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Knowledge Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
              <span className="text-2xl font-bold text-yellow-500">K1</span>
              <p className="text-sm text-muted-foreground mt-2">
                Basisbegrip ontbreekt. Maximale scaffolding vereist. Human Gate mogelijk.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-primary/30 bg-primary/5">
              <span className="text-2xl font-bold text-primary">K2</span>
              <p className="text-sm text-muted-foreground mt-2">
                Ontwikkelend begrip. Adaptieve ondersteuning met Socratische methode.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
              <span className="text-2xl font-bold text-green-500">K3</span>
              <p className="text-sm text-muted-foreground mt-2">
                Diep begrip. Minimale scaffolding. Uitdaging en verdieping mogelijk.
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
