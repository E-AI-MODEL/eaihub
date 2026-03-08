import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'LEERLING' | 'DOCENT' | 'ADMIN' | 'SUPERUSER';

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isLoading: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    isLoading: true,
  });
  const [roleBootstrapFailed, setRoleBootstrapFailed] = useState(false);

  const fetchRoles = useCallback(async (userId: string, retryCount = 0): Promise<AppRole[]> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const roles = (data || []).map(r => r.role as AppRole);

    // Defensive: if user is authenticated but has no roles, the trigger may not have fired yet.
    // Retry once after a short delay to account for trigger propagation.
    if (roles.length === 0 && retryCount < 2) {
      console.warn(`[useAuth] No roles found for ${userId}, retry ${retryCount + 1}/2`);
      await new Promise(r => setTimeout(r, 1500));
      return fetchRoles(userId, retryCount + 1);
    }

    return roles;
  }, []);

  const resolveUser = useCallback(async (user: import('@supabase/supabase-js').User, session: Session) => {
    const roles = await fetchRoles(user.id);
    if (roles.length === 0) {
      console.error(`[useAuth] Role bootstrap failed for ${user.id} — trigger may be missing`);
      setRoleBootstrapFailed(true);
    } else {
      setRoleBootstrapFailed(false);
    }
    setState({ user, session, roles, isLoading: false });
  }, [fetchRoles]);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      if (user) {
        // Defer role fetch to avoid deadlock
        setTimeout(() => resolveUser(user, session!), 0);
      } else {
        setState({ user: null, session: null, roles: [], isLoading: false });
        setRoleBootstrapFailed(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) {
        await resolveUser(user, session!);
      } else {
        setState({ user: null, session: null, roles: [], isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveUser]);

  const hasRole = useCallback((role: AppRole) => state.roles.includes('SUPERUSER') || state.roles.includes(role), [state.roles]);
  const isSuperUser = useCallback(() => state.roles.includes('SUPERUSER'), [state.roles]);

  const retryRoleBootstrap = useCallback(async () => {
    if (!state.user || !state.session) return;
    setRoleBootstrapFailed(false);
    setState(s => ({ ...s, isLoading: true }));
    await resolveUser(state.user, state.session);
  }, [state.user, state.session, resolveUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, hasRole, isSuperUser, signOut, roleBootstrapFailed, retryRoleBootstrap };
};
