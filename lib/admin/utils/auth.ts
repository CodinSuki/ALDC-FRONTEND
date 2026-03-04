import crypto from 'node:crypto';

const ADMIN_COOKIE_NAME = 'aldc_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type SessionPayload = {
  email: string;
  staffId: number;
  staffRole: 'AGENT' | 'BROKER' | 'STAFF' | 'ADMIN';
  exp: number;
};

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const toBase64Url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url');

const fromBase64Url = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf8');

const signPayload = (payloadBase64Url: string): string => {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET');
  return crypto.createHmac('sha256', secret).update(payloadBase64Url).digest('base64url');
};

const timingSafeEqual = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const createAdminSessionToken = (
  email: string,
  staffId: number,
  staffRole: 'AGENT' | 'BROKER' | 'STAFF' | 'ADMIN'
): string => {
  const payload: SessionPayload = {
    email,
    staffId,
    staffRole,
    exp: Date.now() + SESSION_TTL_MS,
  };

  const payloadBase64Url = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64Url);

  return `${payloadBase64Url}.${signature}`;
};

const parseCookieHeader = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<Record<string, string>>((accumulator, part) => {
    const [key, ...value] = part.trim().split('=');
    if (!key) return accumulator;
    accumulator[key] = decodeURIComponent(value.join('='));
    return accumulator;
  }, {});
};

export const getAdminSessionFromRequest = (req: any): SessionPayload | null => {
  try {
    const cookies = parseCookieHeader(req.headers?.cookie);
    const token = cookies[ADMIN_COOKIE_NAME];
    if (!token) return null;

    const [payloadBase64Url, signature] = token.split('.');
    if (!payloadBase64Url || !signature) return null;

    const expectedSignature = signPayload(payloadBase64Url);
    if (!timingSafeEqual(expectedSignature, signature)) return null;

    const payload = JSON.parse(fromBase64Url(payloadBase64Url)) as SessionPayload;
    if (!payload?.email || !payload?.staffId || !payload?.staffRole || !payload?.exp) return null;
    if (Date.now() >= payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
};

const buildCookie = (value: string, maxAgeSeconds: number): string => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const expires =
    maxAgeSeconds <= 0
      ? '; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      : `; Expires=${new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()}`;
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${expires}${secure}`;
};

export const setAdminSessionCookie = (res: any, token: string): void => {
  res.setHeader('Set-Cookie', buildCookie(token, Math.floor(SESSION_TTL_MS / 1000)));
};

export const clearAdminSessionCookie = (res: any): void => {
  res.setHeader('Set-Cookie', buildCookie('', 0));
};

export const requireAdminSession = (req: any, res: any): SessionPayload | null => {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      // Provide diagnostic information
      const cookies = parseCookieHeader(req.headers?.cookie);
      const hasSessionCookie = 'aldc_admin_session' in cookies;
      
      console.warn('[Auth] Unauthorized request:', {
        hasSessionCookie,
        cookieCount: Object.keys(cookies).length,
        method: req.method,
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      
      res.status(401).json({ 
        error: 'Unauthorized. Please log in to access the admin panel.',
        details: hasSessionCookie ? 'Session cookie exists but is invalid or expired' : 'No session cookie found'
      });
      return null;
    }
    return session;
  } catch (error) {
    console.error('[Auth] Session validation error:', error);
    res.status(500).json({ 
      error: 'Session validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};
