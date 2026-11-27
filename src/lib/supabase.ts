import { createClient } from '@supabase/supabase-js';

// Public project settings are safe in the browser; environment values override them.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qnoaezyqryizzblqxjmz.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UAGMGXkmbyE0WUA6vuO45w_SOIsD_c6';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
