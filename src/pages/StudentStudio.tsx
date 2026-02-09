import React, { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import Dashboard from '@/components/Dashboard';
import ProfileSetup from '@/components/ProfileSetup';
import BootSequence from '@/components/BootSequence';
import GameNeuroLinker from '@/components/GameNeuroLinker';
import TechReport from '@/components/TechReport';
import TopicSelector from '@/components/TopicSelector';
import { fetchProfile, updateProfile } from '@/services/profileService';
import { getOrCreateUserId } from '@/services/identity';
import { createInitialEAIState, updateStateFromAnalysis, EAIStateLike } from '@/utils/eaiLearnAdapter';
import type { LearnerProfile, EAIAnalysis, MechanicalState, Message } from '@/types';

type AppPhase = 'BOOT' | 'PROFILE_SETUP' | 'READY';

const StudentStudio: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('BOOT');
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<EAIAnalysis | null>(null);
  const [currentMechanical, setCurrentMechanical] = useState<MechanicalState | null>(null);
  const [eaiState, setEaiState] = useState<EAIStateLike>(() => createInitialEAIState());
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [isDesktopDashboardOpen, setDesktopDashboardOpen] = useState(false);
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

  const handleNodeChange = async (nodeId: string | null) => {
    if (profile) {
      const updatedProfile = { ...profile, currentNodeId: nodeId };
      setProfile(updatedProfile);
      const userId = getOrCreateUserId();
      await updateProfile(userId, updatedProfile);
    }
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
      <div className="min-h-screen bg-slate-950 pt-14">
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

  // ═══════════════════════════════════════════════════════════════════
  // MAIN STUDIO VIEW — Analytical Instrument Layout
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-950 pt-14">
      {/* Full Height Container */}
      <div className="h-[calc(100vh-56px)] flex">
        
        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CHAT AREA — Expands/contracts based on dashboard state
            ═══════════════════════════════════════════════════════════════════ */}
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${
          isDesktopDashboardOpen ? 'lg:mr-[420px]' : ''
        }`}>
          {/* Chat Container with Border */}
          <div className="flex-1 flex flex-col m-2 lg:m-3 border border-slate-700 bg-slate-900 overflow-hidden">
            {profile && (
              <ChatInterface
                profile={profile}
                onAnalysisUpdate={handleAnalysisUpdate}
                sessionId={sessionId}
              />
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTROL BUTTONS — Fixed position
            ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Desktop Controls */}
        <div className="fixed top-16 right-4 hidden lg:flex items-center gap-2 z-30">
          {/* Topic Selector - Compact Mode */}
          {profile && (
            <div className="w-48">
              <TopicSelector
                subject={profile.subject}
                level={profile.level}
                currentNodeId={profile.currentNodeId || null}
                onNodeChange={handleNodeChange}
                compact
              />
            </div>
          )}
          <button
            onClick={() => setShowProfileEdit(true)}
            className="h-8 px-3 border border-slate-700 bg-slate-900/90 text-slate-400 text-[10px] font-medium uppercase tracking-wider hover:text-slate-100 hover:border-slate-600 transition-colors"
          >
            Profiel
          </button>
          <button
            onClick={() => setDesktopDashboardOpen(!isDesktopDashboardOpen)}
            className={`h-8 px-3 border text-[10px] font-medium uppercase tracking-wider transition-colors ${
              isDesktopDashboardOpen 
                ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300' 
                : 'border-slate-700 bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:border-slate-600'
            }`}
          >
            {isDesktopDashboardOpen ? 'Sluit' : 'Dashboard'}
          </button>
        </div>

        {/* Mobile Dashboard Toggle */}
        <div className="fixed bottom-20 right-4 lg:hidden z-30">
          <button
            onClick={() => setDesktopDashboardOpen(!isDesktopDashboardOpen)}
            className={`h-10 px-4 border text-xs font-medium uppercase tracking-wider transition-colors ${
              isDesktopDashboardOpen 
                ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300' 
                : 'border-slate-600 bg-slate-900 text-slate-300'
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DASHBOARD — Sliding Panel (420px)
          ═══════════════════════════════════════════════════════════════════ */}
      <Dashboard
        analysis={currentAnalysis}
        mechanical={currentMechanical}
        isOpen={isDesktopDashboardOpen}
        onClose={() => setDesktopDashboardOpen(false)}
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
