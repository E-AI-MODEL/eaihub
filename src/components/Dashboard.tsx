import React from 'react';
import { X, Activity, Brain, Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { getEAICore } from '@/utils/ssotHelpers';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';

interface DashboardProps {
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: any;
  isLoading?: boolean;
  profile?: LearnerProfile | null;
  eaiState?: EAIStateLike | null;
  onEditProfile?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  analysis, 
  mechanical, 
  isOpen, 
  onClose, 
  isLoading = false, 
  profile, 
  eaiState, 
  onEditProfile 
}) => {
  const currentCore = getEAICore();

  // Get phase data
  const getPhaseData = () => {
    if (!analysis?.process_phases?.length) return null;
    const phaseId = analysis.process_phases[0];
    for (const rubric of currentCore.rubrics) {
      const band = rubric.bands.find(b => b.band_id === phaseId);
      if (band) return { id: phaseId, label: band.label };
    }
    return { id: phaseId, label: 'Onbekend' };
  };

  // Get epistemic status
  const getEpistemicStatus = () => {
    if (!analysis?.secondary_dimensions?.length) return null;
    const epCode = analysis.secondary_dimensions.find(c => c.startsWith('E'));
    if (!epCode) return null;
    
    for (const rubric of currentCore.rubrics) {
      const band = rubric.bands.find(b => b.band_id === epCode);
      if (band) return { id: epCode, label: band.label, flag: band.flag };
    }
    return { id: epCode, label: 'Onbekend', flag: null };
  };

  const phase = getPhaseData();
  const epistemic = getEpistemicStatus();
  const activeFixDetails = analysis?.active_fix 
    ? currentCore.commands.find(c => c.command === analysis.active_fix) 
    : null;

  // Status indicators
  const getSystemStatus = () => {
    if (isLoading) return { label: 'PROCESSING', color: 'bg-amber-500', pulse: true };
    if (!analysis) return { label: 'STANDBY', color: 'bg-slate-500', pulse: false };
    if (mechanical?.repairAttempts && mechanical.repairAttempts > 0) return { label: 'REPAIRED', color: 'bg-amber-500', pulse: false };
    return { label: 'NOMINAL', color: 'bg-emerald-500', pulse: false };
  };

  const systemStatus = getSystemStatus();
  const gFactor = mechanical?.semanticValidation?.gFactor;
  const gFactorPercent = gFactor ? Math.round(gFactor * 100) : null;

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-14 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden" 
          onClick={onClose} 
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DASHBOARD CONTAINER — 420px, slides from right
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className={`
          fixed top-14 bottom-0 right-0 w-full sm:w-[420px] 
          bg-slate-950 border-l border-slate-700 
          z-50 transform transition-transform duration-300 ease-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
        `}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER — System status bar
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${systemStatus.color} ${systemStatus.pulse ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                {systemStatus.label}
              </span>
            </div>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-sm font-medium text-slate-100">Glass Box</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTENT — Scrollable panel stack
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">
          
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: DIDACTISCHE ANALYSE
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Didactische Analyse
              </span>
            </div>

            {/* PANEL 1 — PROCESFASE (DOMINANT) */}
            <div className="p-4 border-2 border-indigo-500/60 bg-slate-900/80 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">PROCESFASE</span>
                <span className="text-xs font-mono text-slate-500">{phase?.id || '—'}</span>
              </div>
              <div className="text-xl font-semibold text-slate-100 tracking-tight">
                {phase?.label || 'Analyseren...'}
              </div>
            </div>

            {/* PANEL 2 — ACTIEVE INTERVENTIE */}
            <div className="p-3 border border-slate-700 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">INTERVENTIE</span>
              </div>
              {analysis?.active_fix ? (
                <>
                  <div className="font-mono text-sm text-slate-200 mb-1">
                    {analysis.active_fix}
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {activeFixDetails?.description || 'Actieve interventie'}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-600 italic">
                  Geen actieve interventie
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: EPISTEMISCHE STATUS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Epistemische Status
              </span>
            </div>

            {/* PANEL 3 — EPISTEMIC GAUGE */}
            <div className={`p-3 border ${
              epistemic?.flag ? 'border-red-500/60 bg-red-950/20' :
              epistemic?.id === 'E1' ? 'border-amber-500/60 bg-amber-950/20' :
              'border-slate-600 bg-slate-900/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {epistemic?.flag ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    epistemic?.flag ? 'text-red-300' :
                    epistemic?.id === 'E1' ? 'text-amber-300' :
                    'text-slate-300'
                  }`}>
                    {epistemic?.flag ? 'CAUTION' : (epistemic?.label || 'Onbekend')}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">{epistemic?.id || '—'}</span>
              </div>
              {epistemic?.flag && (
                <div className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2">
                  Begrip nog niet geverifieerd
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: SCAFFOLDING METRICS
              ═══════════════════════════════════════════════════════════════════ */}
          {eaiState?.scaffolding && (
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Zelfstandigheid
                </span>
              </div>

              <div className="p-3 border border-slate-700 bg-slate-900/60">
                {/* Agency Score Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-mono font-bold text-slate-100">
                    {eaiState.scaffolding.agency_score}
                    <span className="text-sm text-slate-500">%</span>
                  </span>
                  <span className={`text-lg ${
                    eaiState.scaffolding.trend === 'RISING' ? 'text-emerald-400' :
                    eaiState.scaffolding.trend === 'FALLING' ? 'text-red-400' :
                    'text-slate-500'
                  }`}>
                    {eaiState.scaffolding.trend === 'RISING' ? '↑' : 
                     eaiState.scaffolding.trend === 'FALLING' ? '↓' : '—'}
                  </span>
                </div>

                {/* History Sparkline */}
                <div className="h-8 flex items-end gap-0.5 mb-2">
                  {eaiState.scaffolding.history_window.map((score, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-slate-800 relative overflow-hidden"
                    >
                      <div 
                        className={`absolute bottom-0 w-full transition-all duration-300 ${
                          score >= 60 ? 'bg-emerald-600' : 
                          score >= 40 ? 'bg-slate-600' : 
                          'bg-amber-600'
                        }`}
                        style={{ height: `${Math.max(score, 5)}%` }}
                      />
                    </div>
                  ))}
                </div>

                {/* Advice */}
                {eaiState.scaffolding.advice && (
                  <div className="text-[10px] text-amber-300 border-t border-slate-800 pt-2 mt-2">
                    💡 {eaiState.scaffolding.advice}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: G-FACTOR / SEMANTIC INTEGRITY
              ═══════════════════════════════════════════════════════════════════ */}
          {gFactorPercent !== null && (
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Semantic Integrity
                </span>
              </div>

              <div className={`p-3 border ${
                mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'border-red-500/60 bg-red-950/20' :
                mechanical?.semanticValidation?.alignment_status === 'DRIFT' ? 'border-amber-500/60 bg-amber-950/20' :
                'border-slate-600 bg-slate-900/40'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">G-FACTOR</span>
                  <span className={`text-lg font-mono font-bold ${
                    mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'text-red-300' :
                    mechanical?.semanticValidation?.alignment_status === 'DRIFT' ? 'text-amber-300' :
                    'text-slate-200'
                  }`}>
                    {gFactorPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800 overflow-hidden mb-2">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'bg-red-500' :
                      mechanical?.semanticValidation?.alignment_status === 'DRIFT' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${gFactorPercent}%` }}
                  />
                </div>

                {/* Penalties */}
                {mechanical?.semanticValidation?.penalties && mechanical.semanticValidation.penalties.length > 0 && (
                  <div className="text-[10px] text-slate-400 space-y-1 border-t border-slate-800 pt-2 mt-2">
                    {mechanical.semanticValidation.penalties.map((p, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION: LEERDER CONTEXT
              ═══════════════════════════════════════════════════════════════════ */}
          {profile && (
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Leerder Context
                </span>
                {onEditProfile && (
                  <button 
                    onClick={onEditProfile}
                    className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors"
                  >
                    Wijzig
                  </button>
                )}
              </div>

              <div className="p-3 border border-slate-800 bg-slate-900/40">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-600 text-[10px] uppercase">Naam</span>
                    <span className="text-slate-300 font-medium">{profile.name || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-600 text-[10px] uppercase">Niveau</span>
                    <span className="text-slate-300 font-medium">{profile.level || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-600 text-[10px] uppercase">Vak</span>
                    <span className="text-slate-300 font-medium">{profile.subject || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-600 text-[10px] uppercase">Leerjaar</span>
                    <span className="text-slate-300 font-medium">{profile.grade || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER — MECHANICAL STRIP
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="h-10 px-4 flex items-center gap-4 border-t border-slate-700 bg-slate-950 shrink-0">
          <span className="text-[10px] font-mono text-slate-500">
            model: <span className="text-slate-400">{mechanical?.model || 'gemini-2.5'}</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] font-mono text-slate-500">
            latency: <span className="text-slate-400">{mechanical?.latencyMs || '—'}ms</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className={`text-[10px] font-mono ${mechanical?.repairAttempts ? 'text-amber-400' : 'text-slate-500'}`}>
            repairs: <span className={mechanical?.repairAttempts ? 'text-amber-300' : 'text-slate-400'}>{mechanical?.repairAttempts || 0}</span>
          </span>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
