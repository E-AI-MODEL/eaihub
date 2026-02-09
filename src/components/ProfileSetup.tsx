import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import type { LearnerProfile } from '../types';
import { getLearningPath, CURRICULUM_PATHS } from '@/data/curriculum';

interface ProfileSetupProps {
  onComplete: (profile: LearnerProfile) => void;
  initialProfile?: LearnerProfile;
  onCancel?: () => void;
}

const LEARNING_ROUTES = [
  { id: 'pilot_bio', label: 'Biologie', level: 'VWO', subject: 'Biologie', desc: 'Eiwitsynthese', icon: '🧬', isPilot: true },
  { id: 'pilot_wis', label: 'Wiskunde B', level: 'VWO', subject: 'Wiskunde B', desc: 'Differentiëren', icon: '📐', isPilot: true },
  { id: 'pilot_eco', label: 'Economie', level: 'HAVO', subject: 'Economie', desc: 'Marktwerking', icon: '💰', isPilot: true },
  { id: 'gen_vmbo', label: 'VMBO', level: 'VMBO', subject: 'Algemeen', desc: 'Vrije ondersteuning', icon: '🎓', isPilot: false },
  { id: 'gen_havo', label: 'HAVO', level: 'HAVO', subject: 'Algemeen', desc: 'Vrije ondersteuning', icon: '🎓', isPilot: false },
  { id: 'gen_vwo', label: 'VWO', level: 'VWO', subject: 'Algemeen', desc: 'Vrije ondersteuning', icon: '🎓', isPilot: false },
];

const STEP_LABELS = ['Naam', 'Vak', 'Leerdoel'];

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, initialProfile, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<typeof LEARNING_ROUTES[0] | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [isFading, setIsFading] = useState(false);

  const curriculumNodes = useMemo(() => {
    if (!selectedRoute) return [];
    const path = getLearningPath(selectedRoute.subject, selectedRoute.level);
    return path?.nodes || [];
  }, [selectedRoute]);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
    }
  }, [initialProfile]);

  const handleStepChange = (nextStep: 1 | 2 | 3) => {
    setIsFading(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsFading(false);
    }, 200);
  };

  const handleRouteSelect = (route: typeof LEARNING_ROUTES[0]) => {
    setSelectedRoute(route);
    setSelectedNodeId(null);
    setCustomSubject('');
    // Always go to step 3 — either node selection or subject input
    handleStepChange(3);
  };

  const handleComplete = () => {
    if (!selectedRoute) return;
    const hasCurriculum = curriculumNodes.length > 0;
    onComplete({
      name,
      subject: hasCurriculum ? selectedRoute.subject : (customSubject.trim() || selectedRoute.subject),
      level: selectedRoute.level,
      grade: null,
      currentNodeId: hasCurriculum ? selectedNodeId : null,
    });
  };

  const goBack = () => {
    if (step === 3) handleStepChange(2);
    else if (step === 2) handleStepChange(1);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-2xl px-6 relative">

        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEP_LABELS.map((label, i) => (
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

          {/* STEP 2 — Vak kiezen */}
          {step === 2 && (
            <div>
              <h2 className="text-sm text-slate-200 font-medium mb-1 text-center">Kies je leerroute</h2>
              <p className="text-[11px] text-slate-500 mb-6 text-center">
                Hoi <span className="text-slate-300">{name}</span>, selecteer een module of start vrij.
              </p>

              {/* Pilot routes */}
              <div className="mb-4">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">SLO Modules</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {LEARNING_ROUTES.filter(r => r.isPilot).map(route => (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelect(route)}
                      className="p-3 border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{route.icon}</span>
                        <span className="text-[9px] font-mono text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5">{route.level}</span>
                      </div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 block font-medium">{route.label}</span>
                      <span className="text-[10px] text-slate-600 block">{route.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* General routes */}
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Vrije Sessie</span>
                <div className="grid grid-cols-3 gap-2">
                  {LEARNING_ROUTES.filter(r => !r.isPilot).map(route => (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelect(route)}
                      className="p-2.5 border border-slate-800/60 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50 transition-all text-left group"
                    >
                      <span className="text-xs text-slate-400 group-hover:text-slate-300 block">{route.label}</span>
                      <span className="text-[10px] text-slate-600 block">{route.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button onClick={goBack} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Terug
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Leerdoel of Vak kiezen */}
          {step === 3 && selectedRoute && (
            <div>
              {curriculumNodes.length > 0 ? (
                /* ── Curriculum route: pick a learning node ── */
                <>
                  <h2 className="text-sm text-slate-200 font-medium mb-1 text-center">Kies je leerdoel</h2>
                  <p className="text-[11px] text-slate-500 mb-1 text-center">
                    <span className="text-slate-300">{selectedRoute.label} {selectedRoute.level}</span> — waar wil je aan werken?
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
                </>
              ) : (
                /* ── General route: ask which subject ── */
                <>
                  <h2 className="text-sm text-slate-200 font-medium mb-1 text-center">Welk vak?</h2>
                  <p className="text-[11px] text-slate-500 mb-6 text-center">
                    Je hebt <span className="text-slate-300">{selectedRoute.level}</span> gekozen. Over welk vak gaat je vraag?
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); if (customSubject.trim()) handleComplete(); }}>
                    <input
                      type="text"
                      autoFocus
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      placeholder="Bijv. Nederlands, Scheikunde, Geschiedenis…"
                      className="w-full max-w-sm mx-auto block bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors text-center"
                    />
                    <div className="mt-8 flex items-center justify-center gap-3">
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
