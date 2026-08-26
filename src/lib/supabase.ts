import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://itqpxeyckybusxhwzscr.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cXB4ZXlja3lidXN4aHd6c2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTU0OTEsImV4cCI6MjA4OTY3MTQ5MX0.WwtuNSnukUeoTauldWdcN_epx7k4iAzb-iDe1SgWcK0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
