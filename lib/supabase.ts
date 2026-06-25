import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Robust check for missing, empty, or placeholder variables
  if (!url || url.includes('MY_') || !url.startsWith('http')) {
    url = 'https://qqoaycvexqdtbzhuimsw.supabase.co';
  }
  if (!key || key.includes('MY_') || key.length < 20) {
    key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxb2F5Y3ZleHFkdGJ6aHVpbXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTcxNTAsImV4cCI6MjA5NzkzMzE1MH0.YSViSd3Nk12UuxdR53Fqa2wGUxOmm9bXiGer0Ur6zBQ';
  }
  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

