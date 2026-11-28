import { createClient } from '@supabase/supabase-js';

// Public project settings are safe in the browser, but deployment credentials
// must come from the deployment environment rather than a stale fallback.
const configuredUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let supabaseUrl = '';
try {
  const parsed = new URL(configuredUrl);
  if (parsed.protocol === 'https:' || parsed.protocol === 'http:') supabaseUrl = parsed.origin;
} catch { /* LoginModal reports the missing deployment configuration. */ }
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
