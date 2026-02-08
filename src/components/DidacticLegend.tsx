import React, { useState } from 'react';

interface DidacticLegendProps {
  onClose: () => void;
}

const DidacticLegend: React.FC<DidacticLegendProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'MODI' | 'KENNIS'>('KENNIS');

  const t = {
    title: 'Didactisch Model',
    subtitle: 'Achtergrond bij de aanpak',
    modes: [
      {
        color: 'bg-blue-600',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        bgLight: 'bg-blue-500/10',
        label: 'Focus & Structuur',
        desc: 'De standaard modus. De AI helpt je stof te ordenen, geeft uitleg en bewaakt de grote lijn. Hier ben je aan het bouwen.'
      },
      {
        color: 'bg-red-600',
        text: 'text-red-500',
        border: 'border-red-500/30',
        bgLight: 'bg-red-500/10',
        label: 'Advocaat van de Duivel',
        desc: 'Kritische modus. De AI valt je argumenten aan, zoekt zwakke plekken en dwingt je om scherper na te denken. Geen genade.'
      },
      {
        color: 'bg-violet-600',
        text: 'text-violet-400',
        border: 'border-violet-500/30',
        bgLight: 'bg-violet-500/10',
        label: 'Meta-Reflectie',
        desc: 'Helikopter view. We stoppen met de inhoud en kijken naar HET PROCES. Hoe leer je? Is deze strategie effectief?'
      },
      {
        color: 'bg-emerald-600',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        bgLight: 'bg-emerald-500/10',
        label: 'Coach & Check',
        desc: 'Toetsende modus. De AI stelt quizvragen, vraagt om samenvattingen of geeft feedback op je antwoorden.'
      }
    ],
    kennis: [
      {
        label: 'K1: Feitenkennis',
        sub: 'Wat is...?',
        desc: 'Hier gaat het om drillen en stampen. De AI geeft directe instructie, flitst begrippen en vraagt niet om "inzicht", maar om parate kennis.',
        color: 'text-yellow-400',
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-900/10'
      },
      {
        label: 'K2: Procedurele Kennis',
        sub: 'Hoe doe je...?',
        desc: 'Hier gaat het om stappenplannen en vaardigheden. De AI doet het voor (Modeling), doet het samen met jou, en laat het je dan zelf doen.',
        color: 'text-cyan-400',
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-900/10'
      },
      {
        label: 'K3: Metacognitie',
        sub: 'Hoe leer je...?',
        desc: 'Hier gaat het om de regie. De AI stelt vragen over je plan, monitort je voortgang en laat je terugkijken (reflectie). Jij bent de baas.',
        color: 'text-purple-400',
        border: 'border-purple-500/30',
        bg: 'bg-purple-900/10'
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b border-border bg-muted/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-foreground font-bold text-sm tracking-wide uppercase">{t.title}</h3>
              <p className="text-[10px] text-muted-foreground">{t.subtitle}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-background/50 rounded-lg">
            <button
              onClick={() => setActiveTab('KENNIS')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'KENNIS' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Kennis (Theorie)
            </button>
            <button
              onClick={() => setActiveTab('MODI')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'MODI' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Modi (Praktijk)
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 h-[400px] overflow-y-auto">
          {activeTab === 'MODI' && t.modes.map((mode, idx) => (
            <div key={idx} className={`flex gap-4 p-3 rounded-lg border ${mode.border} ${mode.bgLight} animate-in slide-in-from-right-4 duration-300`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className={`w-3 h-3 rounded-full ${mode.color} mt-1 shrink-0 shadow-[0_0_8px_currentColor]`}></div>
              <div>
                <h4 className={`text-xs font-bold uppercase mb-1 ${mode.text}`}>{mode.label}</h4>
                <p className="text-[11px] text-foreground/70 leading-relaxed">{mode.desc}</p>
              </div>
            </div>
          ))}

          {activeTab === 'KENNIS' && (
            <div className="space-y-4">
              <p className="text-[10px] text-muted-foreground italic mb-2">
                Gebaseerd op Ruijssenaars et al. We maken onderscheid in type kennis omdat dit de instructie bepaalt.
              </p>
              {t.kennis.map((k, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${k.border} ${k.bg} animate-in slide-in-from-left-4 duration-300`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`text-xs font-bold uppercase ${k.color}`}>{k.label}</h4>
                    <span className="text-[9px] font-mono text-muted-foreground bg-background/50 px-1.5 rounded">{k.sub}</span>
                  </div>
                  <p className="text-[11px] text-foreground/70 leading-relaxed">{k.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-muted/30 p-3 text-center border-t border-border">
          <p className="text-[9px] text-muted-foreground italic">
            De omgeving past zich automatisch aan op basis van jouw antwoorden.
          </p>
        </div>

      </div>
    </div>
  );
};

export default DidacticLegend;
