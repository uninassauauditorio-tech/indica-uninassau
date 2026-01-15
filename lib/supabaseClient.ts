import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found in environment variables. Using fallback for local development.');
}

export const supabase = createClient(
    supabaseUrl || 'https://gzqqmefwniigodhcukau.supabase.co',
    supabaseAnonKey || 'sb_publishable_-3AAfFITNOMX8b-m1miFNQ_4QKgdDov'
);
