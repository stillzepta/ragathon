import { createClient } from '@supabase/supabase-js';

// Public project settings are safe in the browser; environment values override them.
const defaultUrl = 'https://qnoaezyqryizzblqxjmz.supabase.co';
const configuredUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let supabaseUrl = defaultUrl;
try {
  const parsed = new URL(configuredUrl);
  if (parsed.protocol === 'https:' || parsed.protocol === 'http:') supabaseUrl = parsed.origin;
} catch { /* Use the known project when deployment configuration is malformed. */ }
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UAGMGXkmbyE0WUA6vuO45w_SOIsD_c6';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
