import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { Dashboard } from '@/components/Dashboard';
import ProfileSetup from '@/components/ProfileSetup';
import BootSequence from '@/components/BootSequence';
import GameNeuroLinker from '@/components/GameNeuroLinker';
import TechReport from '@/components/TechReport';
import { fetchProfile, updateProfile } from '@/services/profileService';
import { getOrCreateUserId } from '@/services/identity';
import { createInitialEAIState, updateStateFromAnalysis, EAIStateLike } from '@/utils/eaiLearnAdapter';
import type { LearnerProfile, EAIAnalysis, MechanicalState, Message } from '@/types';

type AppPhase = 'BOOT' | 'PROFILE_SETUP' | 'READY';

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

const THEMES: Record<string, Theme> = {
  DEFAULT: { bg: 'bg-[#0b1120]', sidebar: 'bg-[#0f172a]/80', border: 'border-slate-800', accent: 'bg-blue-600', accentText: 'text-blue-400', buttonActive: 'border-blue-500 bg-blue-500/10 text-blue-400', bubbleUser: 'bg-blue-600/10 border-blue-500/30 text-blue-100', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.1)]' },
  DEVIL: { bg: 'bg-[#1a0505]', sidebar: 'bg-[#2a0a0a]/80', border: 'border-red-900', accent: 'bg-red-600', accentText: 'text-red-500', buttonActive: 'border-red-500 bg-red-500/10 text-red-400', bubbleUser: 'bg-red-600/10 border-red-500/30 text-red-100', glow: 'shadow-[0_0_30px_rgba(220,38,238,0.2)]' },
  META: { bg: 'bg-[#0f0a1a]', sidebar: 'bg-[#150f25]/80', border: 'border-violet-900', accent: 'bg-violet-600', accentText: 'text-violet-400', buttonActive: 'border-violet-500 bg-violet-500/10 text-violet-400', bubbleUser: 'bg-violet-600/10 border-violet-500/30 text-violet-100', glow: 'shadow-[0_0_20px_rgba(124,58,237,0.15)]' },
  CREATIVE: { bg: 'bg-[#0f1012]', sidebar: 'bg-[#13151a]/80', border: 'border-fuchsia-900', accent: 'bg-fuchsia-600', accentText: 'text-fuchsia-400', buttonActive: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400', bubbleUser: 'bg-fuchsia-600/10 border-fuchsia-500/30 text-fuchsia-100', glow: 'shadow-[0_0_20px_rgba(192,38,233,0.15)]' },
  COACH: { bg: 'bg-[#051a10]', sidebar: 'bg-[#062415]/80', border: 'border-emerald-900', accent: 'bg-emerald-600', accentText: 'text-emerald-400', buttonActive: 'border-emerald-500 bg-emerald-500/10 text-emerald-400', bubbleUser: 'bg-emerald-600/10 border-emerald-500/30 text-emerald-100', glow: 'shadow-[0_0_20px_rgba(5,150,105,0.15)]' },
  SYSTEM: { bg: 'bg-[#081a1a]', sidebar: 'bg-[#0a2020]/80', border: 'border-cyan-900', accent: 'bg-cyan-600', accentText: 'text-cyan-400', buttonActive: 'border-cyan-500 bg-cyan-500/10 text-cyan-400', bubbleUser: 'bg-cyan-600/10 border-cyan-500/30 text-cyan-100', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]' },
  PRAGMATIC: { bg: 'bg-[#1a0f05]', sidebar: 'bg-[#261505]/80', border: 'border-orange-900', accent: 'bg-orange-600', accentText: 'text-orange-400', buttonActive: 'border-orange-500 bg-orange-500/10 text-orange-400', bubbleUser: 'bg-orange-600/10 border-orange-500/30 text-orange-100', glow: 'shadow-[0_0_20px_rgba(234,88,12,0.15)]' }
};

const StudentStudio: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('BOOT');
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<EAIAnalysis | null>(null);
  const [currentMechanical, setCurrentMechanical] = useState<MechanicalState | null>(null);
  const [eaiState, setEaiState] = useState<EAIStateLike>(() => createInitialEAIState());
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [isDesktopDashboardOpen, setDesktopDashboardOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.DEFAULT);
  const [showGame, setShowGame] = useState(false);
  const [showTechReport, setShowTechReport] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = getOrCreateUserId();
      const { profile: storedProfile } = await fetchProfile(userId);
      
      if (storedProfile && storedProfile.name && storedProfile.subject) {
        setProfile(storedProfile);
        setPhase('READY');
      }
    };

    loadProfile();
  }, []);

  const handleBootComplete = () => {
    if (profile && profile.name && profile.subject) {
      setPhase('READY');
    } else {
      setPhase('PROFILE_SETUP');
    }
  };

  const handleProfileComplete = async (newProfile: LearnerProfile) => {
    const userId = getOrCreateUserId();
    await updateProfile(userId, newProfile);
    setProfile(newProfile);
    setPhase('READY');
    setShowProfileEdit(false);
  };

  const handleAnalysisUpdate = (analysis: EAIAnalysis, mechanical?: MechanicalState) => {
    setCurrentAnalysis(analysis);
    if (mechanical) {
      setCurrentMechanical(mechanical);
    }
    if (analysis.scaffolding) {
      setEaiState(prev => updateStateFromAnalysis(prev, analysis, mechanical || null));
    }
  };

  // Boot sequence
  if (phase === 'BOOT') {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  // Profile setup
  if (phase === 'PROFILE_SETUP' || showProfileEdit) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <div className="max-w-2xl mx-auto p-6">
          <ProfileSetup
            initialProfile={profile || undefined}
            onComplete={handleProfileComplete}
            onCancel={showProfileEdit ? () => setShowProfileEdit(false) : undefined}
          />
        </div>
      </div>
    );
  }

  // Main studio view
  return (
    <div className={`min-h-screen ${currentTheme.bg} pt-14 transition-colors duration-1000`}>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div 
            className="cursor-pointer"
            onDoubleClick={() => setShowTechReport(true)}
          >
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              EAI Studio
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {profile?.subject && profile?.level 
                ? `${profile.subject} • ${profile.level}` 
                : 'AI-ondersteunde leersessie'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDesktopDashboardOpen(!isDesktopDashboardOpen)}
              className="hidden lg:flex"
            >
              Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowProfileEdit(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Profiel</span>
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="border border-border rounded-xl bg-card h-[calc(100vh-180px)] lg:h-[calc(100vh-160px)] flex flex-col overflow-hidden">
          {profile && (
            <ChatInterface
              profile={profile}
              onAnalysisUpdate={handleAnalysisUpdate}
              sessionId={sessionId}
            />
          )}
        </div>
      </div>

      {/* Dashboard Sliding Panel */}
      <Dashboard
        analysis={currentAnalysis}
        mechanical={currentMechanical}
        isOpen={isDesktopDashboardOpen}
        onClose={() => setDesktopDashboardOpen(false)}
        theme={currentTheme}
        isLoading={isLoading}
        profile={profile}
        eaiState={eaiState}
        onEditProfile={() => setShowProfileEdit(true)}
      />

      {/* Game Modal */}
      {showGame && <GameNeuroLinker onClose={() => setShowGame(false)} />}

      {/* Tech Report Modal */}
      {showTechReport && (
        <TechReport 
          onClose={() => setShowTechReport(false)} 
          lastAnalysis={currentAnalysis} 
          lastMechanical={currentMechanical} 
          messages={messages}
          eaiState={eaiState}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default StudentStudio;
