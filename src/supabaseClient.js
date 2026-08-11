import { createClient } from '@supabase/supabase-js';

/**
 * supabaseClient.js
 * 
 * Supabase client initialization.
 * Automatically switches Uclear to live cloud database when VITE_SUPABASE_URL 
 * and VITE_SUPABASE_ANON_KEY environment variables are present in the .env file.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
