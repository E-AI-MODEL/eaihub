import React from 'react';
import { X } from 'lucide-react';
import { EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { getEAICore } from '@/utils/ssotHelpers';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';

interface DashboardProps {
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: any; // Legacy prop, ignored
  isLoading?: boolean;
  profile?: LearnerProfile | null;
  eaiState?: EAIStateLike | null;
  onEditProfile?: () => void;
}

export const Dashboard = React.forwardRef<HTMLDivElement, DashboardProps>(({ 
  analysis, 
  mechanical, 
  isOpen, 
  onClose, 
  isLoading = false, 
  profile, 
  eaiState, 
  onEditProfile 
}, ref) => {
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

  // Epistemic status styling
  const getEpistemicStyle = () => {
    if (!epistemic) return { border: 'border-slate-700', text: 'text-slate-400' };
    if (epistemic.flag) return { border: 'border-red-500/60', text: 'text-red-300' };
    if (epistemic.id === 'E1') return { border: 'border-amber-500/60', text: 'text-amber-300' };
    return { border: 'border-slate-600', text: 'text-slate-300' };
  };

  const epStyle = getEpistemicStyle();

  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-14 bg-black/60 z-40 lg:hidden" 
          onClick={onClose} 
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DASHBOARD CONTAINER — 420px fixed width, slides from right
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className={`
          fixed top-14 bottom-0 right-0 w-full sm:w-[420px] 
          bg-slate-900 border-l border-slate-700 
          z-50 transform transition-transform duration-300 ease-in-out 
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
        `}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            DASHBOARD HEADER — 48px
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : (analysis ? 'bg-green-500' : 'bg-slate-600')}`} />
            <span className="text-sm font-medium text-slate-100">Glass Box Dashboard</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            DASHBOARD CONTENT — Scrollable
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* ═══════════════════════════════════════════════════════════════════
              PANEL 1 — DIDACTISCHE TOESTAND (DOMINANT)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="m-0 mb-4 p-4 border border-indigo-500/60 bg-slate-800/40">
            <div className="mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">PROCESFASE</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold text-slate-100">
                {phase?.label || 'Analyseren...'}
              </span>
              <span className="font-mono text-sm text-slate-300">
                {phase?.id || '-'}
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PANEL 2 — ACTIEVE INTERVENTIE
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-4 p-3 border border-slate-700 bg-slate-900/60">
            {analysis?.active_fix ? (
              <>
                <div className="font-mono text-sm text-slate-300 mb-1">
                  {analysis.active_fix}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {activeFixDetails?.description || 'Actieve interventie'}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500">
                Geen actieve interventie
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PANEL 3 — EPISTEMISCHE STATUS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className={`mb-4 p-3 border ${epStyle.border} bg-slate-800/30`}>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              EPISTEMIC STATUS
            </div>
            <div className={`text-sm font-medium ${epStyle.text}`}>
              {epistemic?.flag ? 'CAUTION' : (epistemic?.label || 'Onbekend')}
            </div>
            {epistemic?.flag && (
              <div className="text-xs text-slate-400 mt-1">
                Begrip nog niet geverifieerd
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PANEL 4 — MECHANISCH (STRIP)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mt-auto p-3 border border-slate-800 bg-slate-950 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>model: {mechanical?.model || 'gemini-2.5'}</span>
              <span>latency: {mechanical?.latencyMs || '-'}ms</span>
              <span>repairs: {mechanical?.repairAttempts || 0}</span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PROFILE CONTEXT (Optional)
              ═══════════════════════════════════════════════════════════════════ */}
          {profile && (
            <div className="mt-4 p-3 border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Leerder Context</span>
                {onEditProfile && (
                  <button 
                    onClick={onEditProfile}
                    className="text-[10px] text-slate-400 hover:text-slate-100 uppercase tracking-wider"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Naam:</span>
                  <span className="ml-2 text-slate-300">{profile.name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Niveau:</span>
                  <span className="ml-2 text-slate-300">{profile.level || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Vak:</span>
                  <span className="ml-2 text-slate-300">{profile.subject || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Leerjaar:</span>
                  <span className="ml-2 text-slate-300">{profile.grade || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SCAFFOLDING TRENDS (if available)
              ═══════════════════════════════════════════════════════════════════ */}
          {eaiState?.scaffolding && (
            <div className="mt-4 p-3 border border-slate-700 bg-slate-900/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Zelfstandigheid</span>
                <span className="font-mono text-xs text-slate-300">
                  {eaiState.scaffolding.agency_score}%
                  <span className="ml-1 text-slate-500">
                    {eaiState.scaffolding.trend === 'RISING' ? '▲' : 
                     eaiState.scaffolding.trend === 'FALLING' ? '▼' : '▬'}
                  </span>
                </span>
              </div>
              <div className="h-6 flex items-end gap-1">
                {eaiState.scaffolding.history_window.map((score, i) => (
                  <div key={i} className="flex-1 bg-slate-800 relative">
                    <div 
                      className={`absolute bottom-0 w-full ${score >= 50 ? 'bg-slate-600' : 'bg-amber-600/60'}`}
                      style={{ height: `${score}%` }}
                    />
                  </div>
                ))}
              </div>
              {eaiState.scaffolding.advice && (
                <div className="mt-2 text-[10px] text-amber-300 border-t border-slate-800 pt-2">
                  {eaiState.scaffolding.advice}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              G-FACTOR / SEMANTIC INTEGRITY
              ═══════════════════════════════════════════════════════════════════ */}
          {mechanical?.semanticValidation && (
            <div className={`mt-4 p-3 border ${
              mechanical.semanticValidation.alignment_status === 'CRITICAL' ? 'border-red-500/60 bg-red-900/10' :
              mechanical.semanticValidation.alignment_status === 'DRIFT' ? 'border-amber-500/60 bg-amber-900/10' :
              'border-slate-600 bg-slate-900/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">G-Factor</span>
                <span className={`font-mono text-sm ${
                  mechanical.semanticValidation.alignment_status === 'CRITICAL' ? 'text-red-300' :
                  mechanical.semanticValidation.alignment_status === 'DRIFT' ? 'text-amber-300' :
                  'text-slate-300'
                }`}>
                  {(mechanical.semanticValidation.gFactor * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1 w-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    mechanical.semanticValidation.alignment_status === 'CRITICAL' ? 'bg-red-500' :
                    mechanical.semanticValidation.alignment_status === 'DRIFT' ? 'bg-amber-500' :
                    'bg-slate-500'
                  }`}
                  style={{ width: `${mechanical.semanticValidation.gFactor * 100}%` }}
                />
              </div>
              {mechanical.semanticValidation.penalties.length > 0 && (
                <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                  {mechanical.semanticValidation.penalties.map((p, i) => (
                    <div key={i} className="flex gap-1">
                      <span className="text-red-400">•</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
