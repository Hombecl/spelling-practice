import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These will be set from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Create Supabase client (singleton)
let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
};

// Database types
export interface DbUser {
  id: string;
  display_name: string;
  pin_hash: string;
  created_at: string;
  last_login_at: string | null;
}

export interface DbUserProgress {
  id: string;
  user_id: string;
  progress_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
