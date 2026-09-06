import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kslvysrsewzwxorfdwkx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHZ5c3JzZXd6d3hvcmZkd2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDEzNjQsImV4cCI6MjEwNDExNzM2NH0.nSviA4-7SWVv4Pg-AphY1ha1ybLC2od4hKXbKlirDv8';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}