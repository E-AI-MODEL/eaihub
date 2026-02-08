// Supabase Client - Hybrid Persistence Layer
// Provides conditional Supabase connectivity with localStorage fallback

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getSupabaseStatus = () => ({
  enabled: supabaseEnabled,
  url: supabaseUrl ? 'configured' : 'missing',
  key: supabaseAnonKey ? 'configured' : 'missing'
});
