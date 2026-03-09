import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, BarChart3, ShieldCheck } from 'lucide-react';
import FactoryDiagram from '@/components/FactoryDiagram';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden flex flex-col">
      
      {/* NAVIGATION */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center bg-gradient-to-b from-background via-background/90 to-transparent backdrop-blur-sm border-b border-border/50" 
        aria-label="Hoofdnavigatie"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse eai-glow-teal" aria-hidden="true" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">
            EAI Hub
          </span>
        </div>
        <ul className="flex gap-2 sm:gap-6 text-[10px] sm:text-xs font-bold tracking-widest uppercase items-center list-none m-0 p-0">
          <li className="hidden sm:block">
            <Link 
              to="/concept" 
              className="text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-primary pb-0.5"
            >
              Architectuur & Uitleg
            </Link>
          </li>
          
          <li className="hidden sm:block" aria-hidden="true">
            <div className="h-4 w-px bg-border" />
          </li>

          <li>
            <Link 
              to="/student" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Leerling
            </Link>
          </li>
          <li>
            <Link 
              to="/teacher" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Docent
            </Link>
          </li>
          <li className="hidden sm:block">
            <Link 
              to="/admin" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Admin
            </Link>
          </li>
          <li>
            <Link 
              to="/auth" 
              className="bg-primary text-primary-foreground border border-primary px-3 py-1.5 sm:px-5 sm:py-2 rounded hover:bg-primary/90 transition-all sm:eai-glow-teal"
            >
              Start EAI Hub
            </Link>
          </li>
        </ul>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow">
      
        {/* HERO SECTION */}
        <header className="relative min-h-screen flex flex-col justify-center px-4 sm:px-12 border-b border-border/50 eai-hero-gradient">
          
          {/* Background decorations */}
          <div className="absolute inset-0 eai-grid-pattern pointer-events-none" aria-hidden="true" />
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

          <div className="max-w-7xl mx-auto w-full pt-20 relative z-10">
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-6 sm:mb-8">
              <span className="block text-muted-foreground">VAN CHATBOT</span>
              <span className="block text-foreground">NAAR</span>
              <span className="block eai-text-gradient">
                DIDACTISCHE ENGINE.
              </span>
            </h1>
            
            <div className="max-w-3xl mt-6 sm:mt-10 border-l-2 border-primary/50 pl-4 sm:pl-8">
              <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-light">
                Standaard AI gokt het volgende woord. <strong className="text-foreground">EAI Hub berekent de volgende leerstap.</strong>
                <br/><br/>
                Wij vervangen de 'Black Box' door een transparant didactisch model (SSOT). 
                Zo krijgt de leerling geen antwoorden, maar inzicht. En de docent geen zorgen, maar controle.
              </p>
              
              <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-4 sm:gap-5">
                <Link 
                  to="/auth" 
                  className="group bg-foreground text-background hover:bg-foreground/90 px-8 py-4 rounded text-center text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                  aria-label="Start EAI Hub"
                >
                  Start EAI Hub 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
                <Link 
                  to="/concept" 
                  className="border border-border hover:border-foreground text-muted-foreground hover:text-foreground px-8 py-4 rounded text-center text-sm font-bold uppercase tracking-widest transition-all"
                >
                  Hoe werkt het?
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ROLE CARDS SECTION */}
        <section className="py-12 sm:py-24 px-4 sm:px-6 bg-background border-t border-border/50" aria-labelledby="access-title">
          <h2 id="access-title" className="sr-only">Kies uw rol</h2>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Leerling Card */}
              <Link 
                to="/student" 
                className="group relative block eai-card-gradient border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <article className="p-6 sm:p-10 h-full flex flex-col">
                  <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
                    <BookOpen className="w-20 sm:w-32 h-20 sm:h-32 text-foreground" strokeWidth={1} />
                  </div>
                  <header className="mb-4">
                    <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">Voor Leerlingen</span>
                    <h3 className="text-2xl font-bold text-foreground">Leerlingomgeving</h3>
                  </header>
                  <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed flex-1">
                    AI die je laat nadenken in plaats van antwoorden weggeeft. Start een sessie voor Biologie, Wiskunde of Economie en leer dieper.
                  </p>
                  <div className="inline-flex items-center text-primary font-bold uppercase text-xs tracking-widest group-hover:gap-3 transition-all">
                    Start Sessie <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </div>
                </article>
              </Link>

              {/* Teacher Card */}
              <Link 
                to="/teacher" 
                className="group relative block eai-card-gradient border border-border rounded-3xl overflow-hidden hover:border-eai-purple/50 transition-all hover:shadow-2xl hover:shadow-eai-purple/10 focus:outline-none focus:ring-2 focus:ring-eai-purple"
              >
                <article className="p-6 sm:p-10 h-full flex flex-col">
                  <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
                    <BarChart3 className="w-20 sm:w-32 h-20 sm:h-32 text-foreground" strokeWidth={1} />
                  </div>
                  <header className="mb-4">
                    <span className="text-eai-purple font-bold text-xs uppercase tracking-widest block mb-2">Voor Docenten</span>
                    <h3 className="text-2xl font-bold text-foreground">Docentomgeving</h3>
                  </header>
                  <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed flex-1">
                    Kijk "onder de motorkap". Bekijk live analytics, detecteer welke leerlingen vastlopen en stuur didactische interventies.
                  </p>
                  <div className="inline-flex items-center text-eai-purple font-bold uppercase text-xs tracking-widest group-hover:gap-3 transition-all">
                    Open Dashboard <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </div>
                </article>
              </Link>

              {/* Admin Card */}
              <Link 
                to="/admin" 
                className="group relative block eai-card-gradient border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <article className="p-6 sm:p-10 h-full flex flex-col">
                  <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
                    <ShieldCheck className="w-20 sm:w-32 h-20 sm:h-32 text-foreground" strokeWidth={1} />
                  </div>
                  <header className="mb-4">
                    <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">Voor Admins</span>
                    <h3 className="text-2xl font-bold text-foreground">Admin Panel</h3>
                  </header>
                  <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed flex-1">
                    Beheer gebruikers, rollen, plugins en SSOT-configuratie. Observability dashboard en governance audit trail.
                  </p>
                  <div className="inline-flex items-center text-primary font-bold uppercase text-xs tracking-widest group-hover:gap-3 transition-all">
                    Open Admin <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </div>
                </article>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-12 px-6 bg-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="text-lg font-bold tracking-tight text-foreground mb-1">EAIHUB</div>
            <p className="text-xs text-muted-foreground">EAIHUB is een product van EAI Analys&amp;Advies — H. Visser</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border" role="status">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-[10px] font-mono text-green-500 uppercase">System Operational</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
