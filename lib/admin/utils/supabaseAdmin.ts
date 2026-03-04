import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const getKeyRole = (token: string | undefined): string | null => {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const role = payload.role ?? payload.user_role;
  return typeof role === 'string' ? role : null;
};

const keyRole = getKeyRole(serviceRoleKey);

const missingConfigMessage =
  'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY environment variables.';

const invalidServiceRoleKeyMessage =
  keyRole && keyRole !== 'service_role'
    ? `SUPABASE_SERVICE_ROLE_KEY must be a service_role key, but key role is "${keyRole}".`
    : keyRole === null && serviceRoleKey
      ? 'SUPABASE_SERVICE_ROLE_KEY is not a valid JWT service-role key.'
      : null;

let client: any = null;
let clientInitErrorMessage: string | null = null;

if (supabaseUrl && serviceRoleKey && !invalidServiceRoleKeyMessage) {
  try {
    client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error: any) {
    client = null;
    clientInitErrorMessage = error?.message ?? 'Failed to initialize Supabase admin client.';
    console.error('Supabase admin client initialization failed:', error);
  }
}

if (!client && !invalidServiceRoleKeyMessage) {
  console.warn(missingConfigMessage);
}

export const supabaseAdmin: any = new Proxy((client ?? {}) as any, {
  get(target, prop, receiver) {
    if (!client) {
      if (clientInitErrorMessage) {
        throw new Error(`Supabase admin client initialization failed: ${clientInitErrorMessage}`);
      }
      if (invalidServiceRoleKeyMessage) {
        throw new Error(invalidServiceRoleKeyMessage);
      }
      throw new Error(missingConfigMessage);
    }
    return Reflect.get(target, prop, receiver);
  },
});
