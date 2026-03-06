import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import type { LearnerProfile } from '../types';
import { getLearningPath, CURRICULUM_PATHS } from '@/data/curriculum';

interface ProfileSetupProps {
  onComplete: (profile: LearnerProfile) => void;
  initialProfile?: LearnerProfile;
  onCancel?: () => void;
}

// SLO modules mapped by level
const SLO_MODULES: Record<string, { subject: string; desc: string; icon: string }[]> = {
  VWO: [
    { subject: 'Biologie', desc: 'Eiwitsynthese', icon: '🧬' },
    { subject: 'Wiskunde B', desc: 'Differentiëren', icon: '📐' },
  ],
  HAVO: [
    { subject: 'Economie', desc: 'Marktwerking', icon: '💰' },
  ],
  VMBO: [],
};

const LEVELS = ['VMBO', 'HAVO', 'VWO'] as const;
const STEP_LABELS = ['Naam', 'Niveau & Leerjaar', 'Vak', 'Leerdoel'];

const GRADE_OPTIONS: Record<string, string[]> = {
  VMBO: ['1', '2', '3', '4'],
  HAVO: ['1', '2', '3', '4', '5'],
  VWO: ['1', '2', '3', '4', '5', '6'],
};

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, initialProfile, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [isSLO, setIsSLO] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Curriculum nodes for the chosen SLO subject+level
  const curriculumNodes = useMemo(() => {
    if (!subject || !level || !isSLO) return [];
    const path = getLearningPath(subject, level);
    return path?.nodes || [];
  }, [subject, level, isSLO]);

  // Available SLO modules for current level
  const availableSLO = useMemo(() => {
    if (!level) return [];
    return SLO_MODULES[level] || [];
  }, [level]);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
    }
  }, [initialProfile]);

  const handleStepChange = (nextStep: 1 | 2 | 3 | 4) => {
    setIsFading(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsFading(false);
    }, 200);
  };

  const handleLevelSelect = (lvl: string) => {
    setLevel(lvl);
    setGrade(null);
    setSubject(null);
    setCustomSubject('');
    setSelectedNodeId(null);
    setIsSLO(false);
  };

  const handleLevelContinue = () => {
    if (!level || !grade) return;
    handleStepChange(3);
  };

  const handleSLOSelect = (mod: { subject: string }) => {
    setSubject(mod.subject);
    setIsSLO(true);
    setCustomSubject('');
    setSelectedNodeId(null);
    handleStepChange(4);
  };

  const handleCustomSubjectSubmit = () => {
    if (!customSubject.trim()) return;
    onComplete({
      name,
      subject: customSubject.trim(),
      level,
      grade,
      currentNodeId: null,
    });
  };

  const handleComplete = () => {
    onComplete({
      name,
      subject,
      level,
      grade,
      currentNodeId: selectedNodeId,
    });
  };

  const goBack = () => {
    if (step === 4) handleStepChange(3);
    else if (step === 3) handleStepChange(2);
    else if (step === 2) handleStepChange(1);
  };

  // How many steps are visible in the indicator
  const totalSteps = isSLO ? 4 : 3;
  const visibleLabels = STEP_LABELS.slice(0, totalSteps);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-2xl px-6 relative">

        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {visibleLabels.map((label, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div className={`w-12 h-px ${i <= step - 1 ? 'bg-indigo-500/50' : 'bg-slate-800'}`} />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-2 h-2 transition-all duration-300 ${
                  i <= step - 1 ? 'bg-indigo-400' : 'bg-slate-700'
                }`} />
                <span className={`text-[9px] font-mono uppercase tracking-widest ${
                  i === step - 1 ? 'text-indigo-300' : 'text-slate-600'
                }`}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── Step Content ── */}
        <div className={`transition-all duration-200 ${isFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

          {/* STEP 1 — Naam */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-12 h-12 border border-slate-700 bg-slate-800/40 flex items-center justify-center mb-6 mx-auto">
                <span className="text-indigo-400 text-sm font-mono font-bold tracking-tighter">EAI</span>
              </div>
              <h2 className="text-sm text-slate-200 font-medium mb-1">Welkom bij EAI Studio</h2>
              <p className="text-[11px] text-slate-500 mb-8">Laten we je werkplek inrichten. Hoe heet je?</p>

              <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) handleStepChange(2); }}>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Typ je naam…"
                  className="w-full max-w-sm mx-auto block bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors text-center"
                />
                <div className="mt-8 flex items-center justify-center gap-3">
                  {onCancel && (
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
                      Annuleren
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-[10px] font-mono uppercase tracking-wider hover:bg-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Volgende <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2 — Niveau + Leerjaar kiezen */}
          {step === 2 && (
            <div className="text-center">
              <h2 className="text-sm text-slate-200 font-medium mb-1">Kies je niveau en leerjaar</h2>
              <p className="text-[11px] text-slate-500 mb-8">
                Hoi <span className="text-slate-300">{name}</span>, op welk niveau en in welk leerjaar zit je?
              </p>

              <div className="flex justify-center gap-3 mb-6">
                {LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => handleLevelSelect(lvl)}
                    className={`w-24 sm:w-28 py-3 sm:py-4 border transition-all text-center group ${
                      level === lvl
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <span className={`text-xs font-medium block ${level === lvl ? 'text-indigo-200' : 'text-slate-300 group-hover:text-slate-100'}`}>{lvl}</span>
                  </button>
                ))}
              </div>

              {level && (
                <div className="mb-6">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Leerjaar</span>
                  <div className="flex justify-center gap-2">
                    {GRADE_OPTIONS[level]?.map(g => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`w-10 h-10 border transition-all text-center ${
                          grade === g
                            ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200'
                            : 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200'
                        } text-xs font-medium`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-3">
                <button onClick={goBack} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Terug
                </button>
                <button
                  onClick={handleLevelContinue}
                  disabled={!level || !grade}
                  className="flex items-center gap-1.5 px-5 py-2 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-[10px] font-mono uppercase tracking-wider hover:bg-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Volgende <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Vak kiezen */}
          {step === 3 && level && (
            <div className="text-center">
              <h2 className="text-sm text-slate-200 font-medium mb-1">Kies je vak</h2>
              <p className="text-[11px] text-slate-500 mb-6">
                <span className="text-slate-300">{level}</span> — welk vak wil je oefenen?
              </p>

              {/* SLO Modules (if available for this level) */}
              {availableSLO.length > 0 && (
                <div className="mb-5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">SLO Modules</span>
                  <div className={`grid gap-2 max-w-md mx-auto ${availableSLO.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {availableSLO.map(mod => (
                      <button
                        key={mod.subject}
                        onClick={() => handleSLOSelect(mod)}
                        className="p-3 border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm">{mod.icon}</span>
                          <span className="text-[9px] font-mono text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5">SLO</span>
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-slate-100 block font-medium">{mod.subject}</span>
                        <span className="text-[10px] text-slate-600 block">{mod.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom subject input */}
              <div>
                {availableSLO.length > 0 && (
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Of typ een ander vak</span>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleCustomSubjectSubmit(); }}>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    placeholder="Bijv. Nederlands, Scheikunde, Geschiedenis…"
                    className="w-full max-w-sm mx-auto block bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors text-center"
                  />
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button type="button" onClick={goBack} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
                      <ArrowLeft className="w-3 h-3" /> Terug
                    </button>
                    <button
                      type="submit"
                      disabled={!customSubject.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-[10px] font-mono uppercase tracking-wider hover:bg-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Start Sessie <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-4 flex justify-center">
              </div>
            </div>
          )}

          {/* STEP 4 — Leerdoel kiezen (SLO only) */}
          {step === 4 && subject && level && (
            <div>
              <h2 className="text-sm text-slate-200 font-medium mb-1 text-center">Kies je leerdoel</h2>
              <p className="text-[11px] text-slate-500 mb-1 text-center">
                <span className="text-slate-300">{subject} {level}</span> — waar wil je aan werken?
              </p>
              <p className="text-[10px] text-slate-600 mb-6 text-center">
                Je kunt dit later altijd wijzigen via de header.
              </p>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {curriculumNodes.map((node, i) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full p-3 border text-left transition-all group ${
                      selectedNodeId === node.id
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-[10px] font-mono mt-0.5 shrink-0 ${
                        selectedNodeId === node.id ? 'text-indigo-400' : 'text-slate-600'
                      }`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className={`text-xs block font-medium ${
                          selectedNodeId === node.id ? 'text-indigo-200' : 'text-slate-300 group-hover:text-slate-100'
                        }`}>
                          {node.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{node.description}</span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-mono text-slate-600">~{node.study_load_minutes} min</span>
                          {node.common_misconceptions && node.common_misconceptions.length > 0 && (
                            <span className="text-[9px] font-mono text-amber-500/60">
                              {node.common_misconceptions.length} aandachtspunten
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={goBack} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Terug
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!selectedNodeId}
                  className="flex items-center gap-1.5 px-5 py-2 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-[10px] font-mono uppercase tracking-wider hover:bg-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Start Sessie <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
