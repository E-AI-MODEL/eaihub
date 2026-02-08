import React, { useState } from 'react';
import { SSOT_DATA } from '@/data/ssot';

interface DidacticLegendProps {
  onClose: () => void;
}

const DidacticLegend: React.FC<DidacticLegendProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'KENNIS' | 'DIMENSIES' | 'MODI'>('KENNIS');

  // Get short key from rubric ID (e.g., "K_KennisType" -> "K")
  const getShortKey = (rubricId: string) => rubricId.split('_')[0];

  // Color mapping for dimensions
  const dimensionColors: Record<string, { text: string; border: string; bg: string }> = {
    K: { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-900/10' },
    C: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-900/10' },
    P: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-900/10' },
    TD: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-900/10' },
    V: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-900/10' },
    E: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-900/10' },
    T: { text: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-900/10' },
    S: { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-900/10' },
    L: { text: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-900/10' },
    B: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-900/10' },
  };

  const t = {
    title: 'Didactisch Model',
    subtitle: 'SSOT v15.0.0 - Achtergrond bij de aanpak',
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
        desc: 'Termen, definities, eigenschappen. Doel: snel en foutloos ophalen. AI drillt, bevraagt, corrigeert.',
        logic: 'MAX TD2 — Geen oplossingen geven',
        color: 'text-yellow-400',
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-900/10'
      },
      {
        label: 'K2: Procedurele Kennis',
        sub: 'Hoe doe je...?',
        desc: 'Handelingen, stappen, beslismomenten. Doel: correct uitvoeren. AI doet voor (Modeling), doet samen, laat nadoen.',
        logic: 'ALLOW TD4 — Modeling toegestaan',
        color: 'text-cyan-400',
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-900/10'
      },
      {
        label: 'K3: Metacognitie',
        sub: 'Hoe leer je...?',
        desc: 'Plannen, monitoren, evalueren van aanpak. Doel: betere strategie-keuzes. AI faciliteert reflectie.',
        logic: 'MAX TD2 — AI geeft geen eindconclusie',
        color: 'text-purple-400',
        border: 'border-purple-500/30',
        bg: 'bg-purple-900/10'
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

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

          <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
            <button
              onClick={() => setActiveTab('KENNIS')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'KENNIS' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Kennis
            </button>
            <button
              onClick={() => setActiveTab('DIMENSIES')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'DIMENSIES' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              10D Matrix
            </button>
            <button
              onClick={() => setActiveTab('MODI')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'MODI' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Modi
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 h-[420px] overflow-y-auto">
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
                Gebaseerd op Ruijssenaars et al. Type kennis bepaalt de instructiestrategie en logic gates.
              </p>
              {t.kennis.map((k, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${k.border} ${k.bg} animate-in slide-in-from-left-4 duration-300`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`text-xs font-bold uppercase ${k.color}`}>{k.label}</h4>
                    <span className="text-[9px] font-mono text-muted-foreground bg-background/50 px-1.5 rounded">{k.sub}</span>
                  </div>
                  <p className="text-[11px] text-foreground/70 leading-relaxed mb-2">{k.desc}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{k.logic}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'DIMENSIES' && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground italic mb-2">
                De 10D-matrix uit SSOT v15.0.0. Elke dimensie heeft 6 niveaus (0-5).
              </p>
              {SSOT_DATA.rubrics.map((rubric, idx) => {
                const shortKey = getShortKey(rubric.rubric_id);
                const colors = dimensionColors[shortKey] || { text: 'text-primary', border: 'border-border', bg: 'bg-secondary/30' };
                
                return (
                  <div 
                    key={rubric.rubric_id} 
                    className={`p-3 rounded-lg border ${colors.border} ${colors.bg} animate-in slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold font-mono ${colors.text}`}>{shortKey}</span>
                      <span className="text-xs font-medium text-foreground">{rubric.name}</span>
                    </div>
                    {rubric.goal && (
                      <p className="text-[10px] text-foreground/60 leading-relaxed">{rubric.goal}</p>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {rubric.bands.slice(0, 6).map((band) => (
                        <span 
                          key={band.band_id}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground"
                          title={band.label}
                        >
                          {band.band_id}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
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
