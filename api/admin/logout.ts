import { clearAdminSessionCookie } from './_utils/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  clearAdminSessionCookie(res);
  res.status(200).json({ authenticated: false });
}
