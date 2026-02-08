import React, { useState } from 'react';
import { EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { getEAICore } from '@/utils/ssotHelpers';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';

type Theme = {
  bg: string;
  sidebar: string;
  border: string;
  accent: string;
  accentText: string;
  buttonActive: string;
  bubbleUser: string;
  glow: string;
};

interface DashboardProps {
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  isLoading?: boolean;
  profile?: LearnerProfile | null;
  eaiState?: EAIStateLike | null;
  onEditProfile?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  analysis, 
  mechanical, 
  isOpen, 
  onClose, 
  theme, 
  isLoading = false, 
  profile, 
  eaiState, 
  onEditProfile 
}) => {
  const currentCore = getEAICore();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const getBandData = (prefix: string) => {
    if (!analysis) return null;
    
    const allCodes = [
      ...(analysis.process_phases || []),
      ...(analysis.coregulation_bands || []),
      ...(analysis.task_densities || []),
      ...(analysis.secondary_dimensions || [])
    ];
    
    const foundCode = allCodes.find(c => {
      if (prefix === 'T') return c.startsWith('T') && !c.startsWith('TD');
      return c.startsWith(prefix);
    });

    if (!foundCode) return null;

    for (const rubric of currentCore.rubrics) {
      const band = rubric.bands.find(b => b.band_id === foundCode);
      if (band) return { id: foundCode, band, rubricName: rubric.name };
    }
    return { id: foundCode, band: null, rubricName: 'Unknown' };
  };

  const dimK = getBandData('K');
  const dimP = getBandData('P');
  const dimC = getBandData('C');
  const dimTD = getBandData('TD');
  const dimE = getBandData('E');
  const dimT = getBandData('T');

  const activeFixDetails = analysis?.active_fix 
    ? currentCore.commands.find(c => c.command === analysis.active_fix) 
    : null;
  
  const scaffolding = eaiState?.scaffolding;
  const semVal = mechanical?.semanticValidation;

  const t = {
    status_active: 'SSOT UPLINK ACTIEF',
    status_scanning: 'STREAM SCANNEN...',
    sections: {
      profile: 'LEERDER CONTEXT',
      scaffolding: 'LEERCURVE & ONTWIKKELING',
      integrity: 'SEMANTISCHE INTEGRITEIT',
      dimensions: 'DIDACTISCHE INSPECTIE',
      logic: 'REDENEER ENGINE',
      mech: 'SYSTEEM TELEMETRIE'
    },
    labels: {
      kennis: 'Kennis Type',
      phase: 'Procesfase',
      coreg: 'Co-Regulatie',
      task: 'Taakdichtheid',
      epistemic: 'Epistemische Veiligheid',
      tool: 'Tool Awareness',
      fix: 'INTERVENTIE',
      unknown: 'Analyseren...',
      principle: 'Didactisch Principe',
      fix_action: 'Systeem Actie',
      flag: 'SSOT Flag'
    }
  };

  const containerClasses = `
    fixed top-14 bottom-0 right-0 w-full sm:w-96 bg-[#0b1120] border-l border-slate-700 
    z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
    ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
  `;

  const renderDimCard = (
    label: string,
    data: ReturnType<typeof getBandData>,
    colorClass: string,
    bgClass: string,
    icon: React.ReactNode,
    key: string
  ) => {
    const isActive = !!data;
    const bandId = data?.id || '-';
    const bandLabel = data?.band?.label || t.labels.unknown;
    const isExpanded = expandedCard === key;
    const flag = data?.band?.flag;

    return (
      <div 
        onClick={() => isActive && setExpandedCard(isExpanded ? null : key)}
        className={`rounded border overflow-hidden mb-3 transition-all duration-300 ${isActive ? `${colorClass} ${bgClass} cursor-pointer hover:bg-opacity-20` : 'border-slate-800 bg-slate-900/50 opacity-60'}`}
      >
        <div className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm grayscale opacity-80">{icon}</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block">{label}</span>
              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>{bandLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {flag && (
              <span className="text-[8px] font-bold bg-red-900/50 text-red-300 px-1 py-0.5 rounded border border-red-800 animate-pulse" title="System Flag Detected">
                ⚠️
              </span>
            )}
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-black/40 text-white border border-white/10' : 'bg-slate-800 text-slate-600'}`}>
              {bandId}
            </span>
            {isActive && (
              <svg className={`w-3 h-3 text-slate-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        {isActive && isExpanded && data?.band && (
          <div className="bg-black/20 border-t border-white/5 p-3 animate-in slide-in-from-top-2">
            <div className="mb-2">
              <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-slate-600 pl-2">
                "{data.band.description}"
              </p>
            </div>
            
            {flag && (
              <div className="bg-red-900/20 border border-red-500/30 p-2 rounded mb-2">
                <span className="text-[9px] uppercase text-red-400 font-bold block mb-1">{t.labels.flag}</span>
                <span className="text-[10px] text-red-200 font-mono">{flag}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 mt-3">
              <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">{t.labels.principle}</span>
                <span className="text-[10px] text-cyan-300 font-medium">{data.band.didactic_principle || '-'}</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">{t.labels.fix_action}</span>
                <span className="text-[10px] text-orange-300 font-medium">{data.band.fix || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 top-14 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <div className={containerClasses} style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orange-400 animate-ping' : (analysis ? 'bg-green-500' : 'bg-red-500')}`}></div>
            <span className={`font-mono text-xs font-bold tracking-widest uppercase ${isLoading ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
              {isLoading ? t.status_scanning : t.status_active}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-white/5 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-[#0b1120] relative">
          
          {/* Profile Context */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-3 border-b border-slate-800 pb-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.sections.profile}</h3>
              {onEditProfile && (
                <button onClick={onEditProfile} className="text-[9px] text-cyan-500 hover:text-cyan-300 uppercase font-bold flex items-center gap-1 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                  </svg>
                  EDIT
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase">Naam</span>
                <span className="text-xs text-white font-medium truncate block">{profile?.name || '-'}</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase">Niveau</span>
                <span className="text-xs text-cyan-400 font-medium truncate block">{profile?.level || '-'}</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase">Vak</span>
                <span className="text-xs text-slate-300 font-medium truncate block">{profile?.subject || '-'}</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase">Leerjaar</span>
                <span className="text-xs text-slate-300 font-medium truncate block">{profile?.grade || '-'}</span>
              </div>
            </div>
          </div>
          
          {/* Semantic Integrity (G-Factor) */}
          {semVal && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">{t.sections.integrity}</h3>
              
              <div className={`border rounded p-3 mb-2 transition-colors ${
                semVal.alignment_status === 'CRITICAL' ? 'bg-red-900/20 border-red-500/50' : 
                (semVal.alignment_status === 'DRIFT' ? 'bg-amber-900/20 border-amber-500/50' : 'bg-emerald-900/20 border-emerald-500/50')
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400">G-Factor (Reliability)</span>
                  <span className={`text-xs font-mono font-bold ${
                    semVal.alignment_status === 'CRITICAL' ? 'text-red-400' : 
                    (semVal.alignment_status === 'DRIFT' ? 'text-amber-400' : 'text-emerald-400')
                  }`}>
                    {(semVal.gFactor * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      semVal.alignment_status === 'CRITICAL' ? 'bg-red-500' : 
                      (semVal.alignment_status === 'DRIFT' ? 'bg-amber-500' : 'bg-emerald-500')
                    }`}
                    style={{ width: `${semVal.gFactor * 100}%` }}
                  ></div>
                </div>

                {semVal.penalties.length > 0 ? (
                  <div className="space-y-1 mt-2">
                    {semVal.penalties.map((p, i) => (
                      <div key={i} className="flex gap-2 items-start text-[9px]">
                        <span className="text-red-400 font-bold shrink-0">[-XX]</span>
                        <span className="text-slate-300 leading-tight">{p}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-emerald-300 italic">✅ System Alignment Optimal. No Hallucinations Detected.</p>
                )}
              </div>
            </div>
          )}

          {/* Scaffolding & Trends */}
          {scaffolding && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">{t.sections.scaffolding}</h3>
              
              <div className="bg-[#0f172a] border border-slate-700 rounded p-3 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Mate van Zelfstandigheid</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-mono font-bold ${scaffolding.trend === 'RISING' ? 'text-green-400' : (scaffolding.trend === 'FALLING' ? 'text-red-400' : 'text-slate-400')}`}>
                      {scaffolding.agency_score}%
                    </span>
                    <span className="text-[9px] text-slate-600">
                      {scaffolding.trend === 'RISING' ? '▲' : (scaffolding.trend === 'FALLING' ? '▼' : '▬')}
                    </span>
                  </div>
                </div>
                
                <div className="h-8 flex items-end gap-1 mb-2">
                  {scaffolding.history_window.map((score, i) => (
                    <div key={i} className="flex-1 bg-slate-800 rounded-sm relative group">
                      <div 
                        className={`absolute bottom-0 w-full rounded-sm transition-all duration-500 ${score >= 50 ? 'bg-cyan-600' : 'bg-orange-600'}`}
                        style={{ height: `${score}%` }}
                      ></div>
                    </div>
                  ))}
                </div>

                {scaffolding.advice && (
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2 animate-pulse">
                    <span className="text-[8px] font-bold text-orange-400 uppercase block">Scaffolding Advies</span>
                    <span className="text-[9px] text-orange-200">{scaffolding.advice}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dimensions */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">{t.sections.dimensions}</h3>
            {renderDimCard(t.labels.kennis, dimK, 'border-yellow-500/50', 'bg-yellow-900/10', '🧠', 'K')}
            {renderDimCard(t.labels.phase, dimP, 'border-blue-500/50', 'bg-blue-900/10', '⏱️', 'P')}
            {renderDimCard(t.labels.coreg, dimC, 'border-purple-500/50', 'bg-purple-900/10', '🤝', 'C')}
            {renderDimCard(t.labels.task, dimTD, 'border-green-500/50', 'bg-green-900/10', '⚖️', 'TD')}
            
            <div className="mb-3 px-1">
              <div className="flex justify-between text-[8px] text-slate-500 mb-1 uppercase font-mono">
                <span>AI (0%)</span>
                <span className="text-slate-300 font-bold">{analysis?.task_density_balance ?? 50}%</span>
                <span>Leerling (100%)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/50 via-green-900/50 to-blue-900/50"></div>
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] transition-all duration-500" style={{ left: `${analysis?.task_density_balance ?? 50}%` }}></div>
              </div>
            </div>
            
            {renderDimCard(t.labels.epistemic, dimE, 'border-red-500/50', 'bg-red-900/10', '🛡️', 'E')}
            {renderDimCard(t.labels.tool, dimT, 'border-orange-500/50', 'bg-orange-900/10', '🤖', 'T')}
          </div>

          {/* Logic / Fix */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">{t.sections.logic}</h3>
            {analysis?.active_fix ? (
              <div className={`border ${theme.border} bg-black/20 rounded p-3 relative overflow-hidden ${theme.glow} mb-3`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.accentText} bg-black/40 px-1 rounded`}>{t.labels.fix}</span>
                  <span className="text-xs font-mono text-white">{analysis.active_fix}</span>
                </div>
                <p className="text-xs text-white font-medium leading-tight mb-2">
                  {activeFixDetails ? activeFixDetails.description : '...'}
                </p>
              </div>
            ) : (
              <div className="p-3 border border-slate-800 rounded bg-slate-900/20 mb-3">
                <span className="text-[10px] text-slate-500 uppercase">Geen actieve interventie</span>
              </div>
            )}
            <div className="bg-black/30 p-3 rounded border border-white/5">
              <span className="text-[9px] text-slate-500 uppercase block mb-1">Reasoning Engine</span>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                {analysis ? `> ${analysis.reasoning}` : '> Waiting for logic stream...'}
              </p>
            </div>
          </div>

          {/* Telemetry */}
          {mechanical && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">{t.sections.mech}</h3>
              
              {mechanical.routerDecision && (
                <div className="bg-[#0f172a] border border-cyan-500/30 rounded p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">INTENT ROUTER</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        mechanical.routerDecision.intent_category === 'SLOW' ? 'bg-purple-900/50 text-purple-300' :
                        mechanical.routerDecision.intent_category === 'MID' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {mechanical.routerDecision.intent_category}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {mechanical.routerDecision.thinking_budget > 0 ? `Thinking: ${mechanical.routerDecision.thinking_budget}` : 'Std Inference'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono leading-relaxed border-l-2 border-slate-700 pl-2">
                    {mechanical.routerDecision.reasoning}
                  </p>
                </div>
              )}

              {mechanical.repairLog && (
                <div className="bg-red-900/20 border border-red-900/50 rounded p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">CRITICAL REPAIR LOG</span>
                  </div>
                  <div className="text-[9px] font-mono text-red-300 mb-2 p-2 bg-black/40 rounded border border-red-900/30 break-words">
                    {mechanical.repairLog.error}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                <div className="bg-slate-900/50 p-1.5 rounded border border-slate-800 flex justify-between">
                  <span>LATENCY</span>
                  <span className={mechanical.latencyMs > 1500 ? 'text-orange-400' : 'text-green-400'}>{mechanical.latencyMs}ms</span>
                </div>
                <div className="bg-slate-900/50 p-1.5 rounded border border-slate-800 flex justify-between">
                  <span>TOKENS</span>
                  <span>{mechanical.outputTokens}</span>
                </div>
                <div className="bg-slate-900/50 p-1.5 rounded border border-slate-800 flex justify-between col-span-2">
                  <span>MODEL</span>
                  <span className="text-white">{mechanical.model}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
