import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Eye, HandHeart, Frame, CircleDot } from 'lucide-react';

/* ──────────────────────────────────────────────
   Didactische leer-pagina  /leren
   Toon: warm, rustig, onderwijsgericht
   Doelgroep: ouder, leerling, professional
   ────────────────────────────────────────────── */

const pillars = [
  {
    icon: Compass,
    title: 'Richting geven',
    body: 'Elke leerling begint op een ander punt. EAIHUB brengt in kaart waar iemand staat en wijst een logische volgende stap aan — geen willekeurige opgave, maar een stap die past bij het huidige begrip.',
  },
  {
    icon: Eye,
    title: 'Leren zichtbaar maken',
    body: 'Voortgang is meer dan een percentage. EAIHUB maakt inzichtelijk welke fasen een leerling doorloopt: oriëntatie, begrip, oefening, toepassing en reflectie. Zo wordt duidelijk wat lukt en waar het hapert.',
  },
  {
    icon: HandHeart,
    title: 'Hulp laten aansluiten',
    body: 'Ondersteuning werkt het beste als die past bij het moment. Een leerling die aan het oriënteren is, heeft iets anders nodig dan iemand die aan het toepassen is. EAIHUB stemt de hulp af op de leerfase.',
  },
  {
    icon: Frame,
    title: 'Ruimte binnen kaders',
    body: 'Zelfstandig leren vraagt vrijheid, maar ook structuur. EAIHUB biedt een heldere route met ruimte om zelf te denken, te proberen en fouten te maken — binnen een kader dat de docent kan instellen.',
  },
];

const journey = [
  {
    phase: 'Oriënteren',
    student: 'De leerling verkent het onderwerp en brengt eigen voorkennis in beeld.',
    eaihub: 'EAIHUB stelt verkennende vragen en brengt het startniveau in kaart, zonder te beoordelen.',
  },
  {
    phase: 'Begrijpen',
    student: 'De leerling werkt aan het doorgronden van concepten en verbanden.',
    eaihub: 'EAIHUB geeft gerichte uitleg en verduidelijkt stap voor stap, afgestemd op wat nog onduidelijk is.',
  },
  {
    phase: 'Oefenen',
    student: 'De leerling past het geleerde toe in herkenbare situaties.',
    eaihub: 'EAIHUB biedt oefenvragen die aansluiten bij het bereikte niveau en geeft inhoudelijke feedback.',
  },
  {
    phase: 'Toepassen',
    student: 'De leerling gebruikt kennis in nieuwe of onbekende contexten.',
    eaihub: "EAIHUB daagt uit met scenario's die transfer vragen, zonder het antwoord voor te kauwen.",
  },
  {
    phase: 'Reflecteren',
    student: 'De leerling kijkt terug op het leerproces en trekt eigen conclusies.',
    eaihub: 'EAIHUB stelt reflectievragen die helpen om het eigen leerproces te begrijpen en te waarderen.',
  },
];

const comparisons = [
  { dimension: 'Route', generic: 'Willekeurig of op basis van zoekgedrag', eaihub: 'Opgebouwd rond leerfasen die op elkaar voortbouwen' },
  { dimension: 'Fase van leren', generic: 'Geen onderscheid tussen oriëntatie en toepassing', eaihub: 'Herkent de fase en stemt ondersteuning daarop af' },
  { dimension: 'Zicht op ontwikkeling', generic: 'Score of percentage als enige maat', eaihub: 'Inzicht in welke stappen doorlopen zijn en wat aandacht nodig heeft' },
  { dimension: 'Didactisch ontwerp', generic: 'Gericht op informatie aanbieden', eaihub: 'Gericht op begrip opbouwen, oefenen en reflecteren' },
];

const parentFaqs = [
  {
    q: 'Helpt dit echt bij leren?',
    a: 'EAIHUB is ontworpen vanuit onderwijskundige principes. Het doel is niet sneller klaar zijn, maar beter begrijpen. Leerlingen doorlopen herkenbare leerfasen en krijgen ondersteuning die past bij hun ontwikkeling.',
  },
  {
    q: 'Blijft de leerling zelf actief?',
    a: 'Ja. EAIHUB geeft geen kant-en-klare antwoorden. Het stelt vragen, geeft hints en laat de leerling zelf nadenken. De leerling blijft aan het werk — EAIHUB begeleidt.',
  },
  {
    q: 'Kan een docent volgen wat er gebeurt?',
    a: 'Docenten hebben inzicht in de voortgang, de leerfase en de hulpbehoefte van iedere leerling. Ze kunnen interventies sturen en het didactisch kader aanpassen.',
  },
  {
    q: 'Is dit ingericht vanuit onderwijs?',
    a: 'EAIHUB is gebouwd rond didactische modellen zoals het ICAP-raamwerk en werkt met leerroutes die aansluiten bij de vakinhoud. Het is geen algemeen taalmodel met een schooljasje.',
  },
];

const principles = [
  {
    title: 'Leren verloopt in fasen',
    body: 'Van eerste kennismaking tot diep begrip doorloopt een leerling herkenbare stappen. EAIHUB volgt dat pad en stemt de ondersteuning erop af.',
  },
  {
    title: 'Begrip groeit in stappen',
    body: 'Inzicht bouw je niet in één keer op. Elke stap brengt een leerling dichter bij het volgende niveau — op een tempo dat past.',
  },
  {
    title: 'Ondersteuning moet passen',
    body: 'Te veel hulp remt zelfstandigheid, te weinig hulp leidt tot vastlopen. EAIHUB zoekt de balans op basis van het moment in het leerproces.',
  },
  {
    title: 'Reflectie hoort erbij',
    body: 'Terugkijken op wat je geleerd hebt versterkt het begrip. EAIHUB bouwt reflectiemomenten in als vast onderdeel van het leerproces.',
  },
  {
    title: 'Zichtbaarheid helpt begeleiden',
    body: 'Wanneer leerling, docent en ouder kunnen zien welke stappen doorlopen zijn, wordt begeleiding gerichter en waardevoller.',
  },
];

/* ─── Helpers ─── */

const SectionHeading = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="mb-10 md:mb-14">
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-snug">{children}</h2>
    {sub && <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl">{sub}</p>}
  </div>
);

/* ─── Page ─── */

const LearningPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">

      {/* NAV — lightweight, warm */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 flex justify-between items-center bg-background/90 backdrop-blur-sm border-b border-border/40" aria-label="Navigatie">
        <Link to="/" className="flex items-center gap-2.5 group">
          <CircleDot className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">EAI Hub</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5 text-xs font-medium tracking-wide uppercase">
          <Link to="/concept" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Hoe werkt het?</Link>
          <Link to="/auth" className="bg-primary/90 text-primary-foreground px-4 py-1.5 rounded hover:bg-primary transition-colors">Inloggen</Link>
        </div>
      </nav>

      <main className="flex-grow">

        {/* ═══ 1. HERO ═══ */}
        <header className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.15] text-foreground mb-6">
              Niet het antwoord centraal.
              <br />
              <span className="text-primary">Wel de stap die verder helpt.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              EAIHUB is ontworpen als leeromgeving. Het helpt leerlingen bij begrijpen, oefenen, toepassen en reflecteren — met ondersteuning die past bij waar zij in hun leerproces zijn.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#leeromgeving" className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Lees hoe het werkt <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a href="#principes" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground">
                Bekijk de leerprincipes
              </a>
            </div>
          </div>
        </header>

        {/* ═══ 2. WAT VOOR LEEROMGEVING ═══ */}
        <section id="leeromgeving" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/30">
          <div className="max-w-5xl mx-auto">
            <SectionHeading sub="EAIHUB is gebouwd rond vier uitgangspunten die bepalen hoe de leeromgeving werkt.">
              Wat voor leeromgeving is dit?
            </SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pillars.map((p) => (
                <div key={p.title} className="rounded-xl border border-border/40 bg-card/50 p-6 sm:p-8 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <p.icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3. HOE EEN LEERLING DIT ERVAART ═══ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-card/30 border-t border-border/30">
          <div className="max-w-4xl mx-auto">
            <SectionHeading sub="Een leerling doorloopt vijf herkenbare fasen. Bij elke fase past andere ondersteuning.">
              Hoe ervaart een leerling dit?
            </SectionHeading>
            <ol className="space-y-6">
              {journey.map((step, i) => (
                <li key={step.phase} className="relative pl-12 sm:pl-16">
                  {/* step indicator */}
                  <div className="absolute left-0 top-0 flex flex-col items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {i < journey.length - 1 && (
                      <div className="w-px flex-1 min-h-[2rem] bg-border/40 mt-1" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-base font-semibold text-foreground mb-2">{step.phase}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground leading-relaxed">
                      <div>
                        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-1">De leerling</span>
                        {step.student}
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-wider text-primary/60 mb-1">EAIHUB</span>
                        {step.eaihub}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══ 4. WAT EAIHUB DIDACTISCH ANDERS MAAKT ═══ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/30">
          <div className="max-w-4xl mx-auto">
            <SectionHeading sub="Geen ranglijst, maar een eerlijke vergelijking op vier punten die ertoe doen.">
              Wat maakt EAIHUB didactisch anders?
            </SectionHeading>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="py-3 pr-4 font-medium text-muted-foreground w-1/4" />
                    <th className="py-3 pr-4 font-medium text-muted-foreground">Algemeen digitaal hulpmiddel</th>
                    <th className="py-3 font-medium text-primary">EAIHUB</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => (
                    <tr key={c.dimension} className="border-b border-border/20">
                      <td className="py-4 pr-4 font-medium text-foreground align-top">{c.dimension}</td>
                      <td className="py-4 pr-4 text-muted-foreground leading-relaxed align-top">{c.generic}</td>
                      <td className="py-4 text-muted-foreground leading-relaxed align-top">{c.eaihub}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═══ 5. DE ROL VAN DE DOCENT ═══ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-card/30 border-t border-border/30">
          <div className="max-w-3xl mx-auto">
            <SectionHeading>De rol van de docent</SectionHeading>
            <div className="space-y-5 text-[15px] text-muted-foreground leading-relaxed">
              <p>
                EAIHUB neemt niets over van de docent. Het maakt juist zichtbaar wat anders verborgen blijft: welke leerlingen vastlopen, in welke fase dat gebeurt en welke hulpbehoefte daarachter zit.
              </p>
              <p>
                De docent behoudt volledige <strong className="text-foreground">ruimte voor professioneel oordeel</strong>. EAIHUB levert het zicht — de docent bepaalt de actie. Dat kan een gerichte interventie zijn, een aanpassing in het didactisch kader of simpelweg het bevestigen dat een leerling op koers ligt.
              </p>
              <p>
                Voortgang is niet alleen zichtbaar als cijfer. Docenten zien welke leerfasen doorlopen zijn, waar het begrip stokt en welke leerlingen extra aandacht nodig hebben — zonder dat ze elk gesprek hoeven na te lezen.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 6. VOOR OUDERS EN SCHOOL ═══ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/30">
          <div className="max-w-3xl mx-auto">
            <SectionHeading sub="Vier veelgestelde vragen, helder beantwoord.">
              Voor ouders en school
            </SectionHeading>
            <dl className="space-y-8">
              {parentFaqs.map((faq) => (
                <div key={faq.q}>
                  <dt className="text-base font-semibold text-foreground mb-2">{faq.q}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ═══ 7. LEERPRINCIPES ═══ */}
        <section id="principes" className="py-16 sm:py-24 px-4 sm:px-6 bg-card/30 border-t border-border/30">
          <div className="max-w-4xl mx-auto">
            <SectionHeading sub="Vijf uitgangspunten die onder elke interactie in EAIHUB doorwerken.">
              De leerprincipes onder de oppervlakte
            </SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {principles.map((pr, i) => (
                <div key={pr.title} className={`rounded-xl border border-border/30 bg-background p-6 ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{pr.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pr.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 8. AFSLUITENDE CTA ═══ */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 border-t border-border/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-4">
              Wilt u zien hoe dit in de praktijk werkt?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Bekijk de technische architectuur achter EAIHUB of start direct met de leeromgeving.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Start EAIHUB <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/concept"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground"
              >
                Bekijk de technische conceptpagina
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/30 py-10 px-6 bg-card/40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground">
          <div className="text-center md:text-left">
            <span className="font-bold text-foreground tracking-tight">EAIHUB</span>
            <span className="mx-2 text-border">·</span>
            Een product van EAI Analys&Advies — H. Visser
          </div>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/concept" className="hover:text-foreground transition-colors">Concept</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Inloggen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearningPage;
