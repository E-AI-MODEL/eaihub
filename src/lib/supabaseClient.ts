// Supabase Client - Re-exports from integrations
// This file provides backwards compatibility with the new Lovable Cloud setup

export { supabase } from '@/integrations/supabase/client';
export type { Database } from '@/integrations/supabase/types';

// Check if Supabase is properly configured
export const supabaseEnabled = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const getSupabaseStatus = () => ({
  enabled: supabaseEnabled,
  url: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'configured' : 'missing',
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'unknown'
});
