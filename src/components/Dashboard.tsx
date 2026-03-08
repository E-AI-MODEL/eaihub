import React, { useState } from 'react';
import { X, Activity, Brain, Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle2, Info, ChevronDown } from 'lucide-react';
import { EAIAnalysis, MechanicalState, LearnerProfile } from '../types';
import { getEAICore } from '@/utils/ssotHelpers';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  inline?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  analysis, mechanical, isOpen, onClose, isLoading = false, profile, eaiState, onEditProfile, inline = false
}) => {
  const currentCore = getEAICore();

  const getPhaseData = () => {
    if (!analysis?.process_phases?.length) return null;
    const phaseId = analysis.process_phases[0];
    for (const rubric of currentCore.rubrics) {
      const band = rubric.bands.find(b => b.band_id === phaseId);
      if (band) return { id: phaseId, label: band.label };
    }
    return { id: phaseId, label: 'Onbekend' };
  };

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

  const getSystemStatus = () => {
    if (isLoading) return { label: 'PROCESSING', color: 'bg-amber-500', pulse: true };
    if (!analysis) return { label: 'STANDBY', color: 'bg-slate-500', pulse: false };
    if (mechanical?.repairAttempts && mechanical.repairAttempts > 0) return { label: 'REPAIRED', color: 'bg-amber-500', pulse: false };
    return { label: 'NOMINAL', color: 'bg-emerald-500', pulse: false };
  };

  const systemStatus = getSystemStatus();
  const gFactor = mechanical?.semanticValidation?.gFactor;
  const gFactorPercent = gFactor ? Math.round(gFactor * 100) : null;

  const PHASE_STEPS = ['P1', 'P2', 'P3', 'P4', 'P5'];
  const currentPhaseIdx = phase?.id ? PHASE_STEPS.findIndex(p => phase.id.startsWith(p)) : -1;

  if (inline) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="h-10 px-3 flex items-center justify-between border-b border-slate-700 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.color} ${systemStatus.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{systemStatus.label}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DashboardContent
            phase={phase} epistemic={epistemic} activeFixDetails={activeFixDetails}
            analysis={analysis} mechanical={mechanical} eaiState={eaiState}
            profile={profile} onEditProfile={onEditProfile} gFactorPercent={gFactorPercent}
            currentPhaseIdx={currentPhaseIdx}
          />
        </div>
        <div className="h-8 px-3 flex items-center gap-3 border-t border-slate-700 bg-slate-950 shrink-0">
          <span className="text-[9px] font-mono text-slate-600">{mechanical?.model || 'standby'}</span>
          <span className="text-slate-800">|</span>
          <span className="text-[9px] font-mono text-slate-600">{mechanical?.latencyMs || '—'}ms</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 top-14 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <div className={`
        fixed top-14 bottom-0 right-0 w-full sm:w-[420px]
        bg-slate-950 border-l border-slate-700
        z-50 transform transition-transform duration-300 ease-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
      `}>
        <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${systemStatus.color} ${systemStatus.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{systemStatus.label}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DashboardContent
            phase={phase} epistemic={epistemic} activeFixDetails={activeFixDetails}
            analysis={analysis} mechanical={mechanical} eaiState={eaiState}
            profile={profile} onEditProfile={onEditProfile} gFactorPercent={gFactorPercent}
            currentPhaseIdx={currentPhaseIdx}
          />
        </div>
        <div className="h-10 px-4 flex items-center gap-4 border-t border-slate-700 bg-slate-950 shrink-0">
          <span className="text-[10px] font-mono text-slate-500">model: <span className="text-slate-400">{mechanical?.model || 'standby'}</span></span>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] font-mono text-slate-500">latency: <span className="text-slate-400">{mechanical?.latencyMs || '—'}ms</span></span>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// Section header with collapsible + info tooltip
// ═══════════════════════════════════════════════════════════
interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  info: string;
  isOpen: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, label, info, isOpen }) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="w-2.5 h-2.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            {info}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
  </div>
);

// ═══════════════════════════════════════════════════════════
// Shared content between inline and overlay modes
// ═══════════════════════════════════════════════════════════
interface DashboardContentProps {
  phase: { id: string; label: string } | null;
  epistemic: { id: string; label: string; flag: any } | null;
  activeFixDetails: any;
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  eaiState?: EAIStateLike | null;
  profile?: LearnerProfile | null;
  onEditProfile?: () => void;
  gFactorPercent: number | null;
  currentPhaseIdx: number;
}

const PHASE_STEPS = ['P1', 'P2', 'P3', 'P4', 'P5'];
const PHASE_LABELS = ['Start', 'Uitleg', 'Uitdaging', 'Check', 'Reflectie'];

const INFO_TEXTS = {
  procesfase: 'Toont in welke leerfase je zit: van oriëntatie tot reflectie.',
  interventie: 'De actieve didactische actie die de AI nu inzet.',
  epistemisch: 'Hoe de AI jouw kennisopbouw inschat.',
  zelfstandigheid: 'Hoe zelfstandig je werkt — de AI past de begeleiding hierop aan.',
  gfactor: 'Meet hoe goed de AI-analyse overeenkomt met het didactisch model.',
  leerder: 'Jouw profiel en instellingen.',
};

const DashboardContent: React.FC<DashboardContentProps> = ({
  phase, epistemic, activeFixDetails, analysis, mechanical, eaiState, profile, onEditProfile, gFactorPercent, currentPhaseIdx,
}) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['procesfase']));

  const toggle = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <>
      {/* PROCESFASE */}
      <Collapsible open={openSections.has('procesfase')} onOpenChange={() => toggle('procesfase')}>
        <div className="border-b border-slate-800">
          <CollapsibleTrigger className="w-full px-3 py-2.5 hover:bg-slate-900/50 transition-colors cursor-pointer">
            <SectionHeader
              icon={<Brain className="w-3 h-3 text-indigo-400" />}
              label="Procesfase"
              info={INFO_TEXTS.procesfase}
              isOpen={openSections.has('procesfase')}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2.5">
              <div className="flex items-center gap-0.5 mb-1.5">
                {PHASE_STEPS.map((step, i) => (
                  <div key={step} className={`flex-1 h-1 transition-colors ${i <= currentPhaseIdx ? 'bg-indigo-500/70' : 'bg-slate-800'}`} />
                ))}
              </div>
              <div className="flex justify-between mb-2">
                {PHASE_LABELS.map((label, i) => (
                  <span key={label} className={`text-[7px] font-mono uppercase tracking-wider ${i === currentPhaseIdx ? 'text-indigo-300' : 'text-slate-700'}`}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="p-2 border border-indigo-500/60 bg-slate-900/80">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-wider">ACTIEF</span>
                  <span className="text-[9px] font-mono text-slate-500">{phase?.id || '—'}</span>
                </div>
                <div className="text-xs font-semibold text-slate-100 tracking-tight">
                  {phase?.label || 'Wachten op input...'}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* INTERVENTIE */}
      <Collapsible open={openSections.has('interventie')} onOpenChange={() => toggle('interventie')}>
        <div className="border-b border-slate-800">
          <CollapsibleTrigger className="w-full px-3 py-2.5 hover:bg-slate-900/50 transition-colors cursor-pointer">
            <SectionHeader
              icon={<Zap className="w-3 h-3 text-slate-500" />}
              label="Interventie"
              info={INFO_TEXTS.interventie}
              isOpen={openSections.has('interventie')}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2.5">
              {analysis?.active_fix ? (
                <div>
                  <code className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 border border-indigo-500/30">
                    {analysis.active_fix}
                  </code>
                  <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">{activeFixDetails?.description || 'Actieve interventie'}</p>
                </div>
              ) : (
                <span className="text-[9px] text-slate-600 italic">Geen actieve interventie</span>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* EPISTEMISCHE STATUS */}
      <Collapsible open={openSections.has('epistemisch')} onOpenChange={() => toggle('epistemisch')}>
        <div className="border-b border-slate-800">
          <CollapsibleTrigger className="w-full px-3 py-2.5 hover:bg-slate-900/50 transition-colors cursor-pointer">
            <SectionHeader
              icon={<Activity className="w-3 h-3 text-amber-400" />}
              label="Epistemische Status"
              info={INFO_TEXTS.epistemisch}
              isOpen={openSections.has('epistemisch')}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2.5">
              <div className={`p-2 border ${
                epistemic?.flag ? 'border-red-500/60 bg-red-950/20' :
                epistemic?.id === 'E1' ? 'border-amber-500/60 bg-amber-950/20' :
                'border-slate-600 bg-slate-900/40'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {epistemic?.flag ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-slate-500" />}
                    <span className={`text-[10px] font-medium ${epistemic?.flag ? 'text-red-300' : epistemic?.id === 'E1' ? 'text-amber-300' : 'text-slate-300'}`}>
                      {epistemic?.flag ? 'CAUTION' : (epistemic?.label || 'Onbekend')}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{epistemic?.id || '—'}</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* ZELFSTANDIGHEID */}
      {eaiState?.scaffolding && (
        <Collapsible open={openSections.has('zelfstandigheid')} onOpenChange={() => toggle('zelfstandigheid')}>
          <div className="border-b border-slate-800">
            <CollapsibleTrigger className="w-full px-3 py-2.5 hover:bg-slate-900/50 transition-colors cursor-pointer">
              <SectionHeader
                icon={<TrendingUp className="w-3 h-3 text-emerald-400" />}
                label="Zelfstandigheid"
                info={INFO_TEXTS.zelfstandigheid}
                isOpen={openSections.has('zelfstandigheid')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-2.5">
                <div className="p-2 border border-slate-700 bg-slate-900/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg font-mono font-bold text-slate-100">
                      {eaiState.scaffolding.agency_score}<span className="text-[10px] text-slate-500">%</span>
                    </span>
                    <span className={`text-sm ${eaiState.scaffolding.trend === 'RISING' ? 'text-emerald-400' : eaiState.scaffolding.trend === 'FALLING' ? 'text-red-400' : 'text-slate-500'}`}>
                      {eaiState.scaffolding.trend === 'RISING' ? '↑' : eaiState.scaffolding.trend === 'FALLING' ? '↓' : '—'}
                    </span>
                  </div>
                  <div className="h-4 flex items-end gap-0.5 mb-1.5">
                    {eaiState.scaffolding.history_window.map((score, i) => (
                      <div key={i} className="flex-1 bg-slate-800 relative overflow-hidden rounded-sm">
                        <div className={`absolute bottom-0 w-full rounded-sm transition-all duration-300 ${score >= 60 ? 'bg-emerald-600' : score >= 40 ? 'bg-slate-600' : 'bg-amber-600'}`} style={{ height: `${Math.max(score, 5)}%` }} />
                      </div>
                    ))}
                  </div>
                  {eaiState.scaffolding.advice && (
                    <div className="text-[8px] text-amber-300 border-t border-slate-800 pt-1.5 mt-1">💡 {eaiState.scaffolding.advice}</div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* G-FACTOR */}
      {gFactorPercent !== null && (
        <Collapsible open={openSections.has('gfactor')} onOpenChange={() => toggle('gfactor')}>
          <div className="border-b border-slate-800">
            <CollapsibleTrigger className="w-full px-3 py-2.5 hover:bg-slate-900/50 transition-colors cursor-pointer">
              <SectionHeader
                icon={<Cpu className="w-3 h-3 text-slate-400" />}
                label="Semantic Integrity"
                info={INFO_TEXTS.gfactor}
                isOpen={openSections.has('gfactor')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-2.5">
                <div className={`p-2 border ${
                  mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'border-red-500/60 bg-red-950/20' :
                  mechanical?.semanticValidation?.alignment_status === 'DRIFT' ? 'border-amber-500/60 bg-amber-950/20' :
                  'border-slate-600 bg-slate-900/40'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">G-FACTOR</span>
                    <span className={`text-sm font-mono font-bold ${
                      mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'text-red-300' :
                      mechanical?.semanticValidation?.alignment_status === 'DRIFT' ? 'text-amber-300' : 'text-slate-200'
                    }`}>{gFactorPercent}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 overflow-hidden rounded-full">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'bg-red-500' :
                      mechanical?.semanticValidation?.alignment_status === 'DRIFT' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} style={{ width: `${gFactorPercent}%` }} />
                  </div>
                  {mechanical?.semanticValidation?.penalties && mechanical.semanticValidation.penalties.length > 0 && (
                    <div className="text-[8px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-1.5 mt-1.5">
                      {mechanical.semanticValidation.penalties.map((p, i) => (
                        <div key={i} className="flex items-start gap-1"><span className="text-red-400">•</span><span>{p}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* LEERDER CONTEXT */}
      {profile && (
        <Collapsible open={openSections.has('leerder')} onOpenChange={() => toggle('leerder')}>
          <div className="border-b border-slate-800">
            <CollapsibleTrigger className="w-full px-3 py-2.5 hover:bg-slate-900/50 transition-colors cursor-pointer">
              <SectionHeader
                icon={<Brain className="w-3 h-3 text-slate-400" />}
                label="Leerder"
                info={INFO_TEXTS.leerder}
                isOpen={openSections.has('leerder')}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-2.5">
                {onEditProfile && (
                  <div className="flex justify-end mb-1">
                    <button onClick={onEditProfile} className="text-[8px] text-slate-600 hover:text-slate-400 uppercase tracking-wider transition-colors">Wijzig</button>
                  </div>
                )}
                <div className="p-2 border border-slate-800 bg-slate-900/40">
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div><span className="text-slate-600 text-[8px] uppercase block">Naam</span><span className="text-slate-300">{profile.name || '—'}</span></div>
                    <div><span className="text-slate-600 text-[8px] uppercase block">Niveau</span><span className="text-slate-300">{profile.level || '—'}</span></div>
                    <div><span className="text-slate-600 text-[8px] uppercase block">Vak</span><span className="text-slate-300">{profile.subject || '—'}</span></div>
                    <div><span className="text-slate-600 text-[8px] uppercase block">Leerjaar</span><span className="text-slate-300">{profile.grade || '—'}</span></div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </>
  );
};

export default Dashboard;
