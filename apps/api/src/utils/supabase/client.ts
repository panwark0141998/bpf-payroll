import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/index.js';

const supabaseUrl = config.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llorazdgdoqcxnecizfx.supabase.co';
const supabaseKey = config.supabaseSecretKey || config.supabasePublishableKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Server-side Supabase client with administrative or publishable privileges.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export default supabase;
