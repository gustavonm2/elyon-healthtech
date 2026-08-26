import { createClient } from '@supabase/supabase-js';

// ── Supabase Client for Patient App (ELYON HealthTech) ───────────────────────
const SUPABASE_URL = 'https://jcuynchnsccrvxrmyitl.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdXluY2huc2NjcnZ4cm15aXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTk0MzYsImV4cCI6MjEwMzMzNTQzNn0.0h_t0xOs0I_avM9QpaPlmPneTMk1yeeWYnyvuTQHnNI';

export const supabasePatients = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
