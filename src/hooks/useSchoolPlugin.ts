import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadEffectiveSSOT, clearSSOTCache } from '@/lib/ssotRuntime';
import type { User } from '@supabase/supabase-js';

/**
 * Bootstrap hook: loads the school-specific SSOT plugin after auth.
 * Non-blocking — getEffectiveSSOT() falls back to BASE_SSOT until loaded.
 */
export const useSchoolPlugin = (user: User | null) => {
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

        await loadEffectiveSSOT(profile?.school_id ?? undefined);
      } catch (err) {
        console.warn('[useSchoolPlugin] Bootstrap failed, using BASE_SSOT:', err);
      }

      if (!cancelled) setIsPluginLoading(false);
    };

    bootstrap();
    return () => { cancelled = true; };
  }, [user]);

  return { isPluginLoading };
};
