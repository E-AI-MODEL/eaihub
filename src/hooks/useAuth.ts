import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'LEERLING' | 'DOCENT' | 'ADMIN';

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

  const fetchRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    return (data || []).map(r => r.role as AppRole);
  }, []);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      if (user) {
        // Defer role fetch to avoid deadlock
        setTimeout(async () => {
          const roles = await fetchRoles(user.id);
          setState({ user, session, roles, isLoading: false });
        }, 0);
      } else {
        setState({ user: null, session: null, roles: [], isLoading: false });
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) {
        const roles = await fetchRoles(user.id);
        setState({ user, session, roles, isLoading: false });
      } else {
        setState({ user: null, session: null, roles: [], isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchRoles]);

  const hasRole = useCallback((role: AppRole) => state.roles.includes(role), [state.roles]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, hasRole, signOut };
};
