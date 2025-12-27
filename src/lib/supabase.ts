import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null;

// Add better error handling and logging
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Please provide Supabase credentials in your .env file:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
  );
  
  // Set supabase to null so we can handle this case gracefully
  supabase = null;
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    supabase = null;
  }
}

export { supabase };