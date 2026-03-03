import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missingConfigMessage =
  'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY environment variables.';

const client =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

if (!client) {
  console.warn(missingConfigMessage);
}

export const supabaseAdmin = new Proxy((client ?? {}) as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    if (!client) {
      throw new Error(missingConfigMessage);
    }
    return Reflect.get(target, prop, receiver);
  },
});
