// Profile Service - reads/writes from Supabase profiles table
// Falls back to localStorage when not authenticated

import { supabase } from '@/integrations/supabase/client';
import type { LearnerProfile } from '../types';

const PROFILE_KEY_PREFIX = 'eai_profile_local_';

export const fetchProfile = async (userId: string): Promise<{ userId: string; profile: LearnerProfile | null }> => {
  // Try Supabase first
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
      if (data) {
        // Merge DB profile with any locally stored learner preferences
        const local = localStorage.getItem(`${PROFILE_KEY_PREFIX}${userId}`);
        const localProfile: LearnerProfile | null = local ? JSON.parse(local) : null;
        const profile: LearnerProfile = {
          name: data.name || localProfile?.name || '',
          subject: localProfile?.subject || '',
          level: localProfile?.level || '',
          grade: localProfile?.grade || null,
          currentNodeId: localProfile?.currentNodeId,
        };
        return { userId, profile: profile.subject ? profile : localProfile };
      }
    }
  } catch {
    // Fall through to localStorage
  }

  // Fallback: localStorage
  const stored = localStorage.getItem(`${PROFILE_KEY_PREFIX}${userId}`);
  return { userId, profile: stored ? JSON.parse(stored) : null };
};

export const updateProfile = async (userId: string, profile: LearnerProfile, _consentScopes: string[] = []) => {
  // Always persist locally for offline access
  localStorage.setItem(`${PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(profile));

  // Also update Supabase profile name if authenticated
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase
        .from('profiles')
        .update({ name: profile.name })
        .eq('id', session.session.user.id);
    }
  } catch {
    // localStorage is the fallback
  }

  return { ok: true };
};
