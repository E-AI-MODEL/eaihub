import React, { useState, useEffect } from 'react';
import { LearnerProfile } from '../types';

interface ProfileSetupProps {
  onComplete: (profile: LearnerProfile, goal: string) => void;
  isOpen: boolean;
  currentProfile?: LearnerProfile;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, isOpen, currentProfile }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<LearnerProfile>({
    name: '',
    subject: '',
    level: '',
    grade: ''
  });
  const [goal, setGoal] = useState('');
  const [isFading, setIsFading] = useState(false);

  const LEARNING_ROUTES = [
    {
      id: 'pilot_bio',
      label: '🧬 Biologie',
      levelLabel: 'VWO',
      subject: 'Biologie',
      level: 'VWO',
      desc: 'Module: Eiwitsynthese',
      isPilot: true
    },
    {
      id: 'pilot_wis',
      label: '📐 Wiskunde B',
      levelLabel: 'VWO',
      subject: 'Wiskunde B',
      level: 'VWO',
      desc: 'Module: Differentiëren',
      isPilot: true
    },
    {
      id: 'pilot_eco',
      label: '💰 Economie',
      levelLabel: 'HAVO',
      subject: 'Economie',
      level: 'HAVO',
      desc: 'Module: Marktwerking',
      isPilot: true
    },
    {
      id: 'gen_vmbo',
      label: '🎓 VMBO',
      levelLabel: 'Algemeen',
      subject: 'Algemeen',
      level: 'VMBO',
      desc: 'Vrije ondersteuning',
      isPilot: false
    },
    {
      id: 'gen_havo',
      label: '🎓 HAVO',
      levelLabel: 'Algemeen',
      subject: 'Algemeen',
      level: 'HAVO',
      desc: 'Vrije ondersteuning',
      isPilot: false
    },
    {
      id: 'gen_vwo',
      label: '🎓 VWO',
      levelLabel: 'Algemeen',
      subject: 'Algemeen',
      level: 'VWO',
      desc: 'Vrije ondersteuning',
      isPilot: false
    }
  ];

  const t = {
    step1_title: "Welkom bij EAI Studio.",
    step1_sub: "Laten we beginnen met je naam.",
    step2_title: "Kies je leerroute.",
    step2_sub: "Kies een volledige SLO-module of start een vrije sessie.",
    step3_title: "Je startpunt.",
    step3_sub: "Omschrijf kort wat je al weet over dit onderwerp.",
  };

  useEffect(() => {
    if (isOpen && currentProfile) {
      setFormData(prev => ({
        ...prev,
        name: currentProfile.name || '',
        subject: currentProfile.subject || '',
        level: currentProfile.level || '',
        grade: currentProfile.grade || ''
      }));
    }
  }, [isOpen, currentProfile]);

  const handleStepChange = (nextStep: 1 | 2 | 3) => {
    setIsFading(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsFading(false);
    }, 300);
  };

  const goNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step < 3) handleStepChange((step + 1) as 1 | 2 | 3);
    else handleSubmit();
  };

  const goBack = () => {
    if (step > 1) handleStepChange((step - 1) as 1 | 2 | 3);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onComplete(formData, goal || "Ik start met de module.");
  };

  const handleRouteSelect = (route: typeof LEARNING_ROUTES[0]) => {
    setFormData({
      ...formData,
      subject: route.subject,
      level: route.level
    });
    handleStepChange(3);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background text-foreground font-sans transition-all duration-700">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-muted/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-4xl px-4 sm:px-8 relative z-10">
        <div className="flex justify-center gap-3 mb-12">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${i === step ? 'bg-primary scale-125' : 'bg-muted'}`}
            ></div>
          ))}
        </div>

        <form onSubmit={step === 3 ? handleSubmit : goNext} className={`transition-opacity duration-300 ${isFading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

          <div className="min-h-[400px] flex flex-col items-center text-center">

            {step === 1 && (
              <>
                <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">{t.step1_title}</h2>
                <p className="text-muted-foreground mb-10 text-lg">{t.step1_sub}</p>
                <input
                  type="text"
                  autoFocus
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full max-w-md bg-transparent border-b border-border px-2 py-4 text-2xl text-center text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Typ je naam..."
                />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">{t.step2_title}</h2>
                <p className="text-muted-foreground mb-10 text-lg">{t.step2_sub}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {LEARNING_ROUTES.map(route => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleRouteSelect(route)}
                      className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 active:scale-95 flex flex-col justify-between min-h-[140px] ${
                        route.isPilot
                          ? 'bg-card border-primary/30 hover:border-primary hover:bg-muted hover:shadow-lg'
                          : 'bg-card/50 border-border hover:border-muted-foreground hover:bg-card'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full mb-2">
                        <span className={`text-xl font-bold ${route.isPilot ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {route.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          route.isPilot
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {route.levelLabel}
                        </span>
                      </div>

                      <div>
                        <div className={`text-xs ${route.isPilot ? 'text-primary/80' : 'text-muted-foreground'} mb-3`}>
                          {route.desc}
                        </div>

                        <div className="flex items-center gap-2">
                          {route.isPilot ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                              SLO ACTIVE
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground italic">
                              SLO volgt later
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">{t.step3_title}</h2>
                <p className="text-muted-foreground mb-8 text-lg">{t.step3_sub}</p>

                <div className="bg-muted/50 p-4 rounded-xl mb-6 border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Gekozen Route</div>
                  <div className="text-lg font-bold text-primary">
                    {formData.subject} <span className="text-muted-foreground">|</span> {formData.level}
                  </div>
                </div>

                <textarea
                  autoFocus
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className="w-full max-w-lg h-32 bg-card rounded-xl px-6 py-5 text-lg text-foreground placeholder-muted-foreground focus:bg-muted focus:ring-1 focus:ring-primary/50 outline-none transition-all resize-none leading-relaxed border border-border"
                  placeholder="Ik wil oefenen met..."
                />
              </>
            )}
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  Terug
                </button>
              )}
              <button
                type="submit"
                className="px-10 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 text-sm tracking-wide"
              >
                {step === 3 ? "Start Sessie" : "Volgende"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
