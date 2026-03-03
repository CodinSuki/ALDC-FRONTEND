import { getAdminSessionFromRequest } from './_utils/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = getAdminSessionFromRequest(req);
  res.status(200).json({ authenticated: Boolean(session), email: session?.email ?? null });
}
