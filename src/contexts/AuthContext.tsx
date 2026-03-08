import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'LEERLING' | 'DOCENT' | 'ADMIN' | 'SUPERUSER';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  isSuperUser: boolean;
  signOut: () => Promise<void>;
  roleBootstrapFailed: boolean;
  retryRoleBootstrap: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleBootstrapFailed, setRoleBootstrapFailed] = useState(false);

  const fetchRoles = useCallback(async (userId: string, retryCount = 0): Promise<AppRole[]> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const found = (data || []).map(r => r.role as AppRole);

    if (found.length === 0 && retryCount < 2) {
      console.warn(`[AuthProvider] No roles found for ${userId}, retry ${retryCount + 1}/2`);
      await new Promise(r => setTimeout(r, 1500));
      return fetchRoles(userId, retryCount + 1);
    }

    return found;
  }, []);

  const resolveUser = useCallback(async (u: User, s: Session) => {
    const r = await fetchRoles(u.id);
    if (r.length === 0) {
      console.error(`[AuthProvider] Role bootstrap failed for ${u.id}`);
      setRoleBootstrapFailed(true);
    } else {
      setRoleBootstrapFailed(false);
    }
    setUser(u);
    setSession(s);
    setRoles(r);
    setIsLoading(false);
  }, [fetchRoles]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      const u = s?.user ?? null;
      if (u) {
        setTimeout(() => resolveUser(u, s!), 0);
      } else {
        setUser(null);
        setSession(null);
        setRoles([]);
        setIsLoading(false);
        setRoleBootstrapFailed(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      const u = s?.user ?? null;
      if (u) {
        await resolveUser(u, s!);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveUser]);

  const hasRole = useCallback(
    (role: AppRole) => roles.includes('SUPERUSER') || roles.includes(role),
    [roles]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const retryRoleBootstrap = useCallback(async () => {
    if (!user || !session) return;
    setRoleBootstrapFailed(false);
    setIsLoading(true);
    await resolveUser(user, session);
  }, [user, session, resolveUser]);

  const value: AuthContextValue = {
    user,
    session,
    roles,
    isLoading,
    hasRole,
    isSuperUser: roles.includes('SUPERUSER'),
    signOut,
    roleBootstrapFailed,
    retryRoleBootstrap,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
