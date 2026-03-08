import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadEffectiveSSOT, clearSSOTCache } from '@/lib/ssotRuntime';
import type { User } from '@supabase/supabase-js';
import type { AppRole } from '@/hooks/useAuth';

/**
 * Bootstrap hook: loads the school-specific SSOT plugin after auth.
 * Now assignment-aware: passes userId and roles to the resolution cascade.
 */
export const useSchoolPlugin = (user: User | null, roles: AppRole[] = []) => {
  const [isPluginLoading, setIsPluginLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!user) {
        clearSSOTCache();
        return;
      }

      setIsPluginLoading(true);

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .maybeSingle();

        if (cancelled) return;

        await loadEffectiveSSOT(profile?.school_id ?? undefined, user.id, roles);
      } catch (err) {
        console.warn('[useSchoolPlugin] Bootstrap failed, using BASE_SSOT:', err);
      }

      if (!cancelled) setIsPluginLoading(false);
    };

    bootstrap();
    return () => { cancelled = true; };
  }, [user, roles]);

  return { isPluginLoading };
};
