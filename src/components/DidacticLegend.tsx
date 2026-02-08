import React, { useState, useMemo } from 'react';
import { SSOT_DATA } from '@/data/ssot';
import { getDimensionMeta, getKnowledgeLevelsForUI, getLogicGatesForUI } from '@/utils/ssotHelpers';

interface DidacticLegendProps {
  onClose: () => void;
}

const DidacticLegend: React.FC<DidacticLegendProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'KENNIS' | 'DIMENSIES' | 'GATES'>('KENNIS');

  // Get short key from rubric ID (e.g., "K_KennisType" -> "K")
  const getShortKey = (rubricId: string) => rubricId.split('_')[0];

  // Dynamic SSOT data (cached)
  const dimensionMeta = useMemo(() => getDimensionMeta(), []);
  const knowledgeLevels = useMemo(() => getKnowledgeLevelsForUI(), []);
  const logicGates = useMemo(() => getLogicGatesForUI(), []);

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b border-border bg-muted/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-foreground font-bold text-sm tracking-wide uppercase">SSOT v{SSOT_DATA.version} Didactiek</h3>
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
                      ? 'border-destructive/30 bg-destructive/10' 
                      : 'border-yellow-500/30 bg-yellow-900/10'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold font-mono text-foreground">{gate.trigger}</span>
                    <span className="text-[10px] text-muted-foreground">{gate.condition}</span>
                    <span className={`ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      gate.priority === 'CRITICAL' 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {gate.priority}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-primary mb-1">{gate.enforcement}</p>
                  <p className="text-[10px] text-foreground/60">{gate.description}</p>
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