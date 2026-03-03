import { createAdminSessionToken, setAdminSessionCookie } from './_utils/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  const { email, password } = body;

  const normalizedEmail = String(email ?? '').trim();
  const normalizedPassword = String(password ?? '').trim();
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
