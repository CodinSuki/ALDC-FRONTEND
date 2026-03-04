import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  setAdminSessionCookie,
} from './_utils/auth.js';

const parseBody = (req: any): Record<string, unknown> => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }
  return req.body ?? {};
};

const getAction = (req: any): 'login' | 'logout' | 'session' | null => {
  const action = String(req.query?.action ?? '').trim().toLowerCase();
  if (action === 'login' || action === 'logout' || action === 'session') {
    return action;
  }
  return null;
};

export default async function handler(req: any, res: any) {
  const action = getAction(req);

  if (!action) {
    res.status(400).json({ error: 'Missing or invalid action. Use ?action=login|logout|session' });
    return;
  }

  if (action === 'session') {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const session = getAdminSessionFromRequest(req);
    res.status(200).json({ authenticated: Boolean(session), email: session?.email ?? null });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (action === 'logout') {
    clearAdminSessionCookie(res);
    res.status(200).json({ authenticated: false });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || !process.env.ADMIN_SESSION_SECRET) {
    res.status(500).json({ error: 'Admin auth is not configured on the server' });
    return;
  }

  let body: Record<string, unknown> = {};
  try {
    body = parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const normalizedEmail = String(body.email ?? '').trim();
  const normalizedPassword = String(body.password ?? '').trim();
  const expectedEmail = adminEmail.trim();
  const expectedPassword = adminPassword.trim();

  if (normalizedEmail !== expectedEmail || normalizedPassword !== expectedPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = createAdminSessionToken(normalizedEmail);
  setAdminSessionCookie(res, token);

  res.status(200).json({ authenticated: true });
}
