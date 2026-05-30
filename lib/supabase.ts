import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
const supabaseServiceKey = process.env.SERVICEROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper to check if we are in build mode or if keys are missing
const isMissingKeys = !supabaseUrl || !supabaseAnonKey

// Public client for client-side
export const supabase = isMissingKeys 
  ? null as any 
  : createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side (bypass RLS)
export const supabaseAdmin = (!supabaseUrl || !supabaseServiceKey)
  ? null as any
  : createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
