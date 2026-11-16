import { createClient } from '@supabase/supabase-js';

import { config } from '@/lib/config';

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
