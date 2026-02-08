import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { Dashboard } from '@/components/Dashboard';
import ProfileSetup from '@/components/ProfileSetup';
import BootSequence from '@/components/BootSequence';
import { fetchProfile, updateProfile } from '@/services/profileService';
import { getOrCreateUserId } from '@/services/identity';
import type { LearnerProfile, EAIAnalysis, ScaffoldingState } from '@/types';

type AppPhase = 'BOOT' | 'PROFILE_SETUP' | 'READY';

const StudentStudio: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('BOOT');
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<EAIAnalysis | null>(null);
  const [scaffoldingState, setScaffoldingState] = useState<ScaffoldingState | undefined>();
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = getOrCreateUserId();
      const { profile: storedProfile } = await fetchProfile(userId);
      
      if (storedProfile && storedProfile.name && storedProfile.subject) {
        setProfile(storedProfile);
        // Skip to ready if profile exists
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

  const handleAnalysisUpdate = (analysis: EAIAnalysis) => {
    setCurrentAnalysis(analysis);
    if (analysis.scaffolding) {
      setScaffoldingState(analysis.scaffolding);
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
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
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
              onClick={() => setShowProfileEdit(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Profiel</span>
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Chat Interface - Takes 3 columns on large screens */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="border border-border rounded-xl bg-card h-[calc(100vh-180px)] lg:h-[calc(100vh-160px)] flex flex-col overflow-hidden">
              {profile && (
                <ChatInterface
                  profile={profile}
                  onAnalysisUpdate={handleAnalysisUpdate}
                />
              )}
            </div>
          </div>

          {/* Dashboard Sidebar - Takes 1 column on large screens */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-20 space-y-4 max-h-[300px] lg:max-h-[calc(100vh-160px)] overflow-y-auto">
              <Dashboard
                analysis={currentAnalysis}
                scaffolding={scaffoldingState}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStudio;
