import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import Dashboard from '@/components/Dashboard';
import ProfileSetup from '@/components/ProfileSetup';
import BootSequence from '@/components/BootSequence';
import GameNeuroLinker from '@/components/GameNeuroLinker';
import TechReport from '@/components/TechReport';
import LeskaartPanel from '@/components/LeskaartPanel';
import TopicSelector from '@/components/TopicSelector';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchProfile, updateProfile } from '@/services/profileService';
import { getOrCreateUserId } from '@/services/identity';
import { useAuth } from '@/hooks/useAuth';
import { createInitialEAIState, updateStateFromAnalysis, EAIStateLike } from '@/utils/eaiLearnAdapter';
import { setSessionOffline } from '@/services/sessionSyncService';
import { PanelLeftClose, PanelLeftOpen, Settings, BarChart3, Home, GraduationCap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LearnerProfile, EAIAnalysis, MechanicalState, Message } from '@/types';

type AppPhase = 'BOOT' | 'PROFILE_SETUP' | 'READY';
type MobileTab = 'leskaart' | 'chat' | 'analyse';

/** Get or create a stable sessionId per user per day */
function getStableSessionId(userId: string): string {
  const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const storageKey = `eai_session_${userId}_${dateKey}`;
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const newId = `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, newId);
  return newId;
}

/** Reset sessionId — creates a fresh one for today */
function resetSessionId(userId: string): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  const storageKey = `eai_session_${userId}_${dateKey}`;
  const newId = `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, newId);
  return newId;
}

const StudentStudio: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('BOOT');
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<EAIAnalysis | null>(null);
  const [currentMechanical, setCurrentMechanical] = useState<MechanicalState | null>(null);
  const [eaiState, setEaiState] = useState<EAIStateLike>(() => createInitialEAIState());
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showTechReport, setShowTechReport] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const isTablet = !isMobile && typeof window !== 'undefined' && window.innerWidth < 1024;

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const parts = ['EAI'];
    if (profile?.subject) parts.push(`${profile.subject} ${profile.level || ''}`);
    return parts;
  }, [profile]);

  const { user } = useAuth();
  const userId = user?.id || getOrCreateUserId();
  const [sessionId, setSessionId] = useState(() => getStableSessionId(userId));

  const handleResetSession = useCallback(() => {
    const newId = resetSessionId(userId);
    setSessionId(newId);
    setMessages([]);
    setCurrentAnalysis(null);
    setCurrentMechanical(null);
    setEaiState(createInitialEAIState());
  }, [userId]);

  useEffect(() => {
    const loadProfile = async () => {
      const { profile: storedProfile } = await fetchProfile(userId);
      if (storedProfile && storedProfile.name && storedProfile.subject) {
        setProfile(storedProfile);
        setPhase('READY');
      }
    };
    loadProfile();
  }, [userId]);

  // Mark session offline on unmount
  useEffect(() => {
    return () => { setSessionOffline(sessionId); };
  }, [sessionId]);

  const handleBootComplete = () => {
    if (profile && profile.name && profile.subject) {
      setPhase('READY');
    } else {
      setPhase('PROFILE_SETUP');
    }
  };

  const handleProfileComplete = async (newProfile: LearnerProfile) => {
    await updateProfile(userId, newProfile);
    setProfile(newProfile);
    setPhase('READY');
    setShowProfileEdit(false);
  };

  const handleNodeChange = async (nodeId: string | null) => {
    if (profile) {
      const updatedProfile = { ...profile, currentNodeId: nodeId };
      setProfile(updatedProfile);
      await updateProfile(userId, updatedProfile);
    }
  };

  const handleAnalysisUpdate = (analysis: EAIAnalysis, mechanical?: MechanicalState) => {
    setCurrentAnalysis(analysis);
    if (mechanical) setCurrentMechanical(mechanical);
    if (analysis.scaffolding) {
      setEaiState(prev => updateStateFromAnalysis(prev, analysis, mechanical || null));
    }
  };

  const handleSendCommand = (command: string) => {
    setPendingCommand(command);
    if (isMobile) setMobileTab('chat');
  };

  if (phase === 'BOOT') return <BootSequence onComplete={handleBootComplete} />;

  if (phase === 'PROFILE_SETUP' || showProfileEdit) {
    return (
      <ProfileSetup
        initialProfile={profile || undefined}
        onComplete={handleProfileComplete}
        onCancel={showProfileEdit ? () => setShowProfileEdit(false) : undefined}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // MOBILE LAYOUT — Tabbed interface
  // ═══════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-slate-950">
        {/* Studio Header — 48px */}
        <StudioHeader
          breadcrumb={breadcrumb}
          profile={profile}
          onNodeChange={handleNodeChange}
          onEditProfile={() => setShowProfileEdit(true)}
          showDashboard={showDashboard}
          onToggleDashboard={() => setShowDashboard(!showDashboard)}
          compact
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'leskaart' && profile && (
            <LeskaartPanel
              profile={profile}
              analysis={currentAnalysis}
              onNodeChange={handleNodeChange}
              onSendCommand={handleSendCommand}
              sessionStartTime={sessionStartTime}
            />
          )}
          {mobileTab === 'chat' && profile && (
            <ChatInterface
              profile={profile}
              onAnalysisUpdate={handleAnalysisUpdate}
              sessionId={sessionId}
              pendingCommand={pendingCommand}
              onCommandConsumed={() => setPendingCommand(null)}
              currentAnalysis={currentAnalysis}
              currentMechanical={currentMechanical}
              eaiState={eaiState}
            />
          )}
          {mobileTab === 'analyse' && (
            <Dashboard
              analysis={currentAnalysis}
              mechanical={currentMechanical}
              isOpen={true}
              onClose={() => setMobileTab('chat')}
              isLoading={isLoading}
              profile={profile}
              eaiState={eaiState}
              onEditProfile={() => setShowProfileEdit(true)}
              inline
            />
          )}
        </div>

        {/* Tab Bar — 48px */}
        <div className="h-12 flex border-t border-slate-700 bg-slate-900 shrink-0">
          {(['leskaart', 'chat', 'analyse'] as MobileTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                mobileTab === tab
                  ? 'text-indigo-300 border-t-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {tab === 'leskaart' ? 'Leskaart' : tab === 'chat' ? 'Chat' : 'Analyse'}
            </button>
          ))}
        </div>

        {showGame && <GameNeuroLinker onClose={() => setShowGame(false)} />}
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
  }

  // ═══════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT — Three-zone resizable workstation
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Studio Header — 48px */}
      <StudioHeader
        breadcrumb={breadcrumb}
        profile={profile}
        onNodeChange={handleNodeChange}
        onEditProfile={() => setShowProfileEdit(true)}
        showDashboard={showDashboard}
        onToggleDashboard={() => setShowDashboard(!showDashboard)}
        showLeftPanel={showLeftPanel}
        onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
      />

      {/* Three-zone workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* LEFT: Leskaart Panel */}
          {showLeftPanel && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                {profile && (
                  <LeskaartPanel
                    profile={profile}
                    analysis={currentAnalysis}
                    onNodeChange={handleNodeChange}
                    onSendCommand={handleSendCommand}
                    sessionStartTime={sessionStartTime}
                  />
                )}
              </ResizablePanel>
              <ResizableHandle className="w-px bg-slate-800 hover:bg-indigo-500/40 transition-colors" />
            </>
          )}

          {/* CENTER: Chat workspace */}
          <ResizablePanel defaultSize={showDashboard ? 50 : (showLeftPanel ? 80 : 100)} minSize={35}>
            <div className="h-full studio-grid-bg">
              {profile && (
                <ChatInterface
                  profile={profile}
                  onAnalysisUpdate={handleAnalysisUpdate}
                  sessionId={sessionId}
                  pendingCommand={pendingCommand}
                  onCommandConsumed={() => setPendingCommand(null)}
                  currentAnalysis={currentAnalysis}
                  currentMechanical={currentMechanical}
                  eaiState={eaiState}
                />
              )}
            </div>
          </ResizablePanel>

          {/* RIGHT: Dashboard/Instrument Panel */}
          {showDashboard && (
            <>
              <ResizableHandle className="w-px bg-slate-800 hover:bg-indigo-500/40 transition-colors" />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <Dashboard
                  analysis={currentAnalysis}
                  mechanical={currentMechanical}
                  isOpen={true}
                  onClose={() => setShowDashboard(false)}
                  isLoading={isLoading}
                  profile={profile}
                  eaiState={eaiState}
                  onEditProfile={() => setShowProfileEdit(true)}
                  inline
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {showGame && <GameNeuroLinker onClose={() => setShowGame(false)} />}
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

// ═══════════════════════════════════════════════════════════════
// STUDIO HEADER — 48px breadcrumb bar
// ═══════════════════════════════════════════════════════════════
interface StudioHeaderProps {
  breadcrumb: string[];
  profile: LearnerProfile | null;
  onNodeChange: (nodeId: string | null) => void;
  onEditProfile: () => void;
  showDashboard: boolean;
  onToggleDashboard: () => void;
  showLeftPanel?: boolean;
  onToggleLeftPanel?: () => void;
  compact?: boolean;
}

const StudioHeader: React.FC<StudioHeaderProps> = ({
  breadcrumb,
  profile,
  onNodeChange,
  onEditProfile,
  showDashboard,
  onToggleDashboard,
  showLeftPanel,
  onToggleLeftPanel,
  compact,
}) => {
  const navigate = useNavigate();
  const { roles } = useAuth();

  return (
    <div className="h-12 px-3 flex items-center justify-between border-b border-slate-700 bg-slate-900 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Left panel toggle (desktop only) */}
        {onToggleLeftPanel && (
          <button
            onClick={onToggleLeftPanel}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title={showLeftPanel ? 'Leskaart verbergen' : 'Leskaart tonen'}
          >
            {showLeftPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest min-w-0">
          {breadcrumb.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-700">›</span>}
              <span className={i === 0 ? 'text-indigo-400 font-semibold' : 'text-slate-400 truncate'}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Topic selector */}
        {profile && !compact && (
          <div className="w-44 ml-2">
            <TopicSelector
              subject={profile.subject}
              level={profile.level}
              currentNodeId={profile.currentNodeId || null}
              onNodeChange={onNodeChange}
              compact
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Navigation buttons */}
        <button
          onClick={() => navigate('/')}
          className="h-7 px-2 text-[9px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
          title="Home"
        >
          <Home className="w-3 h-3" />
        </button>
        {(roles.includes('DOCENT') || roles.includes('ADMIN')) && (
          <button
            onClick={() => navigate('/teacher')}
            className="h-7 px-2 text-[9px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Docent"
          >
            <GraduationCap className="w-3 h-3" />
          </button>
        )}
        {roles.includes('ADMIN') && (
          <button
            onClick={() => navigate('/admin')}
            className="h-7 px-2 text-[9px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Admin"
          >
            <Shield className="w-3 h-3" />
          </button>
        )}

        <div className="w-px h-5 bg-slate-800 mx-0.5" />

        <button
          onClick={onEditProfile}
          className="h-7 px-2.5 text-[9px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
        <button
          onClick={onToggleDashboard}
          className={`h-7 px-2.5 text-[9px] font-mono uppercase tracking-wider transition-colors border ${
            showDashboard
              ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/10'
              : 'text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          <BarChart3 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default StudentStudio;
