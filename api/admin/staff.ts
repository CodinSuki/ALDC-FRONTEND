import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from './_utils/auth.js';
import { supabaseAdmin } from './_utils/supabaseAdmin.js';

type StaffRow = {
  staffid: number;
  firstname: string | null;
  lastname: string | null;
  emailaddress: string | null;
  contactnumber: string | null;
  isactive: boolean | null;
  staffroleid: number | null;
  staffrole?: { rolename: string | null } | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdminSession(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select(
        `
          staffid,
          firstname,
          lastname,
          emailaddress,
          contactnumber,
          staffroleid,
          staffrole:fk_staff_role(rolename),
          isactive
        `
      )
      .order('staffid', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = ((data ?? []) as StaffRow[]).map((staff) => ({
      staff_id: Number(staff.staffid),
      name: `${staff.firstname ?? ''} ${staff.lastname ?? ''}`.trim(),
      email: staff.emailaddress ?? '',
      contact_number: staff.contactnumber ?? '',
      department: '',
      position: staff.staffrole?.rolename ?? 'Unassigned',
      status: staff.isactive ? 'Active' : 'Inactive',
    }));

    return res.status(200).json({ items: rows });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch staff',
    });
  }
}
