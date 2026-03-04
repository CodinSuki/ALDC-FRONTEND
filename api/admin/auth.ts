import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminSessionFromRequest,
  setAdminSessionCookie,
} from './_utils/auth.js';
import { supabaseAdmin } from './_utils/supabaseAdmin.js';
import { verifyPassword, hashPassword } from './_utils/password.js';

const parseBody = (req: any): Record<string, unknown> => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }
  return req.body ?? {};
};

const getAction = (req: any): 'login' | 'logout' | 'session' | 'init-password' | null => {
  const action = String(req.query?.action ?? '').trim().toLowerCase();
  if (action === 'login' || action === 'logout' || action === 'session' || action === 'init-password') {
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
    res.status(200).json({
      authenticated: Boolean(session),
      email: session?.email ?? null,
      staffId: session?.staffId ?? null,
      staffRole: session?.staffRole ?? null,
    });
    return;
  }

  if (action === 'init-password') {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Require admin session to initialize passwords
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized: Admin session required' });
      return;
    }

    let body: Record<string, unknown> = {};
    try {
      body = parseBody(req);
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    const staffId = Number(body.staffId ?? 0);
    const password = String(body.password ?? '').trim();

    if (!staffId || !password) {
      res.status(400).json({ error: 'staffId and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    try {
      // Verify staff exists and is active
      const { data: staffData, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('staffid, name, emailaddress')
        .eq('staffid', staffId)
        .single();

      if (staffError || !staffData) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }

      // Hash the password
      const passwordHash = await hashPassword(password);

      // Check if credentials record exists
      const { data: existingCreds } = await supabaseAdmin
        .from('staff_credentials')
        .select('credentialid')
        .eq('staffid', staffId)
        .single();

      if (existingCreds) {
        // Update existing credentials
        const { error: updateError } = await supabaseAdmin
          .from('staff_credentials')
          .update({
            passwordhash: passwordHash,
            lastchangedat: new Date().toISOString(),
            loginsattempts: 0,
            lockeduntil: null,
          })
          .eq('staffid', staffId);

        if (updateError) {
          throw new Error(`Failed to update credentials: ${updateError.message}`);
        }
      } else {
        // Create new credentials record
        const { error: insertError } = await supabaseAdmin
          .from('staff_credentials')
          .insert({
            staffid: staffId,
            passwordhash: passwordHash,
            loginsattempts: 0,
            createddat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

        if (insertError) {
          throw new Error(`Failed to create credentials: ${insertError.message}`);
        }
      }

      // Log the password initialization activity
      const { logActivity } = await import('./_utils/activityLog.js');
      await logActivity({
        staffid: session.staffId,
        activitytype: 'staff_login', // Reusing login activity type for now
        entitytype: 'staff',
        entityid: staffId,
        description: `Initialized/reset password for ${staffData.name}`,
      }).catch(() => {
        // Silently fail if activitylog doesn't exist
      });

      res.status(200).json({
        success: true,
        message: `Password initialized for ${staffData.name}`,
        staffId: staffId,
        staffName: staffData.name,
      });
    } catch (error) {
      console.error('Password initialization error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to initialize password'
      });
    }
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.ADMIN_SESSION_SECRET) {
    console.error('[AUTH] CRITICAL: ADMIN_SESSION_SECRET environment variable is not set!');
    res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Authentication is not properly configured. ADMIN_SESSION_SECRET is missing.',
      helpText: 'Contact your administrator to ensure environment variables are set.'
    });
    return;
  }

  let body: Record<string, unknown> = {};
  try {
    body = parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '').trim();

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    // Look up staff by email
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('staffid, emailaddress, isactive, staffroleid')
      .eq('emailaddress', email.toLowerCase())
      .single();

    if (staffError || !staffData) {
      console.error('Staff lookup failed:', staffError?.message || 'No staff found');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Fetch role separately if needed
    let roleCode = 'STAFF';
    if (staffData.staffroleid) {
      const { data: roleData } = await supabaseAdmin
        .from('staffrole')
        .select('rolecode')
        .eq('staffroleid', staffData.staffroleid)
        .single();
      
      if (roleData?.rolecode) {
        roleCode = roleData.rolecode;
      }
    }

    // Check if staff member is active
    if (!staffData.isactive) {
      res.status(401).json({ error: 'Staff member account is inactive' });
      return;
    }

    // Get staff credentials
    const { data: credentialData, error: credentialError } = await supabaseAdmin
      .from('staff_credentials')
      .select('passwordhash, lockeduntil')
      .eq('staffid', staffData.staffid)
      .single();

    if (credentialError || !credentialData) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if account is locked
    if (credentialData.lockeduntil && new Date(credentialData.lockeduntil) > new Date()) {
      res.status(401).json({ error: 'Account is locked. Please try again later.' });
      return;
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, credentialData.passwordhash);

    if (!isPasswordValid) {
      // Increment login attempts
      const { data: currentAttempts } = await supabaseAdmin
        .from('staff_credentials')
        .select('loginsattempts')
        .eq('staffid', staffData.staffid)
        .single();

      const newAttempts = (currentAttempts?.loginsattempts ?? 0) + 1;
      const MAX_LOGIN_ATTEMPTS = 5;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      const updateData: Record<string, any> = { loginsattempts: newAttempts };
      if (shouldLock) {
        // Lock account for 30 minutes
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.lockeduntil = lockUntil.toISOString();
      }

      await supabaseAdmin
        .from('staff_credentials')
        .update(updateData)
        .eq('staffid', staffData.staffid);

      res.status(401).json({
        error: 'Invalid credentials',
        locked: shouldLock,
        remainingAttempts: shouldLock ? 0 : MAX_LOGIN_ATTEMPTS - newAttempts,
      });
      return;
    }

    // Reset login attempts on successful login
    await supabaseAdmin
      .from('staff_credentials')
      .update({ loginsattempts: 0, lockeduntil: null })
      .eq('staffid', staffData.staffid);

    // Log login activity
    const { logActivity } = await import('./_utils/activityLog.js');
    await logActivity({
      staffid: staffData.staffid,
      activitytype: 'staff_login',
      entitytype: 'staff',
      entityid: staffData.staffid,
      description: `Logged in successfully`,
    }).catch(() => {
      // Silently fail if activitylog doesn't exist
    });

    // Create session with staffId and role
    const token = createAdminSessionToken(email, staffData.staffid, roleCode as 'AGENT' | 'BROKER' | 'STAFF' | 'ADMIN');
    setAdminSessionCookie(res, token);

    res.status(200).json({
      authenticated: true,
      staffId: staffData.staffid,
      staffRole: roleCode,
      email: email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
