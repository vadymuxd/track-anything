import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log('Raw URL from env:', import.meta.env.VITE_SUPABASE_URL);
console.log('Trimmed URL:', supabaseUrl);
console.log('URL type:', typeof supabaseUrl);
console.log('URL length:', supabaseUrl?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error(
    'Missing Supabase environment variables. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

console.log('✅ About to create Supabase client');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
