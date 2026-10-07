/**
 * src/lib/supabase.js
 * Supabase client for the frontend (uses the anon/public key).
 * RLS is enabled on all tables — the backend service-role key is NEVER here.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || 'https://megstikozgcqazmopkcz.supabase.co'
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_j6HzTMVfNgPXKK-MLLiV_Q_WV0HR_hA'

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseUrl.includes('placeholder')
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export default supabase
