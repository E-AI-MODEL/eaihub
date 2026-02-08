import React, { useState } from 'react';
import { SSOT_DATA } from '@/data/ssot';

interface DidacticLegendProps {
  onClose: () => void;
}

const DidacticLegend: React.FC<DidacticLegendProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'KENNIS' | 'DIMENSIES' | 'GATES'>('KENNIS');

  // Get short key from rubric ID (e.g., "K_KennisType" -> "K")
  const getShortKey = (rubricId: string) => rubricId.split('_')[0];

  // EAI MODEL 8.0 aligned dimension metadata with accurate goals from whitepaper
  const dimensionMeta: Record<string, { text: string; border: string; bg: string; goal: string }> = {
    K: { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-900/10', goal: 'Kennisobject bepalen en passende didactiek afdwingen.' },
    P: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-900/10', goal: 'Fase van het leerproces bepalen voor passende interventie.' },
    TD: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-900/10', goal: 'Wie doet het werk? Balanceert leerlingactiviteit versus AI-overname.' },
    C: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-900/10', goal: 'Mate van gedeelde regie (AI-monoloog → leerling-geankerd).' },
    V: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', goal: 'Soort leerhandeling en vaardigheidsdiepte.' },
    T: { text: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-900/10', goal: 'Transparantie en kritisch partnerschap met AI.' },
    E: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-900/10', goal: 'Van schijnzekerheid naar geverifieerde autoriteit.' },
    L: { text: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-900/10', goal: 'Leercontinuïteit en transfer over tijd en contexten.' },
    S: { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-900/10', goal: 'Sociale laag: isolatie → katalysator voor samenwerking.' },
    B: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-900/10', goal: 'Van blind naar systemisch corrigeren.' },
  };

  // EAI MODEL 8.0 — Exacte K-niveau definities uit whitepaper
  const knowledgeLevels = [
    {
      id: 'K1',
      label: 'Feitenkennis',
      desc: 'Termen, definities, eigenschappen en losse feiten. Doel: snel en foutloos ophalen.',
      gate: 'MAX_TD = TD2',
      gateDesc: 'Alleen bevragen, corrigeren, herhalen. Geen conceptuele uitleg.',
      fix: '/flits',
      color: 'text-yellow-400',
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-900/10'
    },
    {
      id: 'K2',
      label: 'Procedurele Kennis',
      desc: 'Handelingen, stappen en beslismomenten. Doel: correct uitvoeren.',
      gate: 'ALLOW_TD = TD4',
      gateDesc: 'Modeling toegestaan: voordoen (hardop), samen oefenen, daarna nadoen.',
      fix: '/modelen',
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-900/10'
    },
    {
      id: 'K3',
      label: 'Metacognitie',
      desc: 'Plannen, monitoren en evalueren van aanpak. Doel: betere strategie-keuzes.',
      gate: 'MAX_TD = TD2',
      gateDesc: 'Reflectie en regulatie centraal. AI geeft geen oplossing of eindconclusie.',
      fix: '/meta',
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-900/10'
    }
  ];

  // Logic gates from EAI MODEL 8.0
  const logicGates = [
    {
      trigger: 'K1',
      condition: 'Feitenkennis',
      enforcement: 'MAX_TD = TD2',
      desc: 'Doel: ophalen en automatiseren. Geen conceptuele uitleg; alleen bevragen, corrigeren, herhalen.',
      priority: 'CRITICAL'
    },
    {
      trigger: 'K2',
      condition: 'Procedurele kennis',
      enforcement: 'ALLOW_TD = TD4',
      desc: 'Modeling toegestaan: voordoen (hardop), samen oefenen, daarna laten nadoen.',
      priority: 'HIGH'
    },
    {
      trigger: 'K3',
      condition: 'Metacognitie',
      enforcement: 'MAX_TD = TD2',
      desc: 'Reflectie en regulatie centraal. AI geeft geen oplossing of eindconclusie.',
      priority: 'CRITICAL'
    }
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b border-border bg-muted/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-foreground font-bold text-sm tracking-wide uppercase">SSOT v15 Didactiek</h3>
              <p className="text-[10px] text-muted-foreground">EAI MODEL 8.0 — Wetenschappelijk fundament</p>
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
              Kennis (K)
            </button>
            <button
              onClick={() => setActiveTab('GATES')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'GATES' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Logic Gates
            </button>
            <button
              onClick={() => setActiveTab('DIMENSIES')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'DIMENSIES' ? 'bg-secondary text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              10D Matrix
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 h-[420px] overflow-y-auto">
          
          {activeTab === 'KENNIS' && (
            <div className="space-y-4">
              <p className="text-[10px] text-muted-foreground italic mb-2">
                Kennistype bepaalt de logic gate en daarmee de maximale taakdichtheid (TD). 
                Gebaseerd op Ruijssenaars et al. en cognitieve belastingstheorie.
              </p>
              {knowledgeLevels.map((k, idx) => (
                <div key={k.id} className={`p-3 rounded-lg border ${k.border} ${k.bg} animate-in slide-in-from-left-4 duration-300`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-xs font-bold uppercase ${k.color}`}>{k.id}: {k.label}</h4>
                    <span className="text-[9px] font-mono text-muted-foreground bg-background/50 px-1.5 rounded">{k.fix}</span>
                  </div>
                  <p className="text-[11px] text-foreground/70 leading-relaxed mb-2">{k.desc}</p>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] font-mono text-primary">{k.gate}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">{k.gateDesc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'GATES' && (
            <div className="space-y-4">
              <p className="text-[10px] text-muted-foreground italic mb-2">
                Logic gates dwingen het systeem om taakdichtheid te begrenzen. 
                Dit voorkomt dat de AI 'behulpzaam' te snel oplossingen geeft.
              </p>
              {logicGates.map((gate, idx) => (
                <div 
                  key={gate.trigger} 
                  className={`p-3 rounded-lg border animate-in slide-in-from-right-4 duration-300 ${
                    gate.priority === 'CRITICAL' 
                      ? 'border-red-500/30 bg-red-900/10' 
                      : 'border-yellow-500/30 bg-yellow-900/10'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold font-mono text-foreground">{gate.trigger}</span>
                    <span className="text-[10px] text-muted-foreground">{gate.condition}</span>
                    <span className={`ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      gate.priority === 'CRITICAL' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {gate.priority}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-primary mb-1">{gate.enforcement}</p>
                  <p className="text-[10px] text-foreground/60">{gate.desc}</p>
                </div>
              ))}
              
              <div className="mt-4 p-3 rounded-lg border border-border bg-secondary/20">
                <h4 className="text-[10px] font-bold text-foreground uppercase mb-2">Waarom Logic Gates?</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  LLM's zijn door alignment getraind om 'behulpzaam' te zijn. In onderwijs ontstaat spanning: 
                  didactiek vraagt soms "geef geen antwoord; stel een vraag", terwijl alignment het model duwt 
                  naar "geef een bruikbaar antwoord". Logic gates borgen didactische hardheid.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'DIMENSIES' && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground italic mb-2">
                Cyclus: K → P → TD → C → V → T → E → L → S → B. Elke dimensie heeft 6 niveaus (0–5).
              </p>
              {SSOT_DATA.metadata.cycle.order.map((rubricId, idx) => {
                const rubric = SSOT_DATA.rubrics.find(r => r.rubric_id === rubricId);
                if (!rubric) return null;
                
                const shortKey = getShortKey(rubricId);
                const meta = dimensionMeta[shortKey] || { text: 'text-primary', border: 'border-border', bg: 'bg-secondary/30', goal: '' };
                
                return (
                  <div 
                    key={rubric.rubric_id} 
                    className={`p-3 rounded-lg border ${meta.border} ${meta.bg} animate-in slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold font-mono ${meta.text}`}>{shortKey}</span>
                      <span className="text-xs font-medium text-foreground">{rubric.name}</span>
                    </div>
                    <p className="text-[10px] text-foreground/60 leading-relaxed mb-2">{meta.goal}</p>
                    <div className="flex gap-1 flex-wrap">
                      {rubric.bands.slice(0, 6).map((band) => (
                        <span 
                          key={band.band_id}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground cursor-help"
                          title={`${band.label}: ${band.description}`}
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
            Bron: EAI MODEL 8.0 Whitepaper — Wetenschappelijk fundament voor evidence-informed AI in onderwijs.
          </p>
        </div>

      </div>
    </div>
  );
};

export default DidacticLegend;
