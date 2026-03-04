import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from './_utils/auth.js';
import { supabaseAdmin } from './_utils/supabaseAdmin.js';
import { validateStaffPermission, validateAgentAssignment, validateBrokerRole } from './_utils/permissions.js';
import { logActivity } from './_utils/activityLog.js';

type StaffRow = {
  staffid: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  emailaddress: string;
  contactnumber: string | null;
  staffroleid: number;
  isactive: boolean;
  staffrole?: { rolename: string; rolecode: string } | null;
};

async function handleFetchPersonnel(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query; // 'agent' | 'broker' | 'staff'

  try {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select(
        `
          staffid,
          firstname,
          middlename,
          lastname,
          emailaddress,
          contactnumber,
          staffroleid,
          isactive,
          staffrole!fk_staff_role(rolename, rolecode)
        `
      )
      .order('staffid', { ascending: true });

    if (error) {
      throw error;
    }

    // Filter by role type on client side
    let filteredData = data ?? [];
    if (type === 'agent') {
      filteredData = filteredData.filter((staff: any) => staff.staffrole?.rolecode === 'AGENT');
    } else if (type === 'broker') {
      filteredData = filteredData.filter((staff: any) => staff.staffrole?.rolecode === 'BROKER');
    } else if (type === 'staff') {
      // For generic staff, show those with STAFF role or no special role
      filteredData = filteredData.filter((staff: any) => 
        staff.staffrole?.rolecode === 'STAFF' || !['AGENT', 'BROKER'].includes(staff.staffrole?.rolecode)
      );
    }

    const items = await Promise.all(
      ((filteredData ?? []) as StaffRow[]).map(async (staff) => {
        const fullName = [staff.firstname, staff.middlename, staff.lastname]
          .filter(Boolean)
          .join(' ');

        // Determine personnel type based on role
        const roleCode = staff.staffrole?.rolecode || '';
        const isAgent = roleCode === 'AGENT';
        const isBroker = roleCode === 'BROKER';

        const baseData = {
          id: Number(staff.staffid),
          name: fullName,
          email: staff.emailaddress,
          contact_number: staff.contactnumber || '',
          status: staff.isactive ? 'Active' : 'Inactive',
        };

        if (isAgent) {
          // Fetch agent license if available
          let license_number = '';
          try {
            const { data: licenseData } = await supabaseAdmin
              .from('agent_license')
              .select('licensenumber')
              .eq('staffid', staff.staffid)
              .order('createdat', { ascending: false })
              .limit(1)
              .single();
            
            if (licenseData?.licensenumber) {
              license_number = licenseData.licensenumber;
            }
          } catch {
            // Table may not exist, continue without license info
          }

          return {
            ...baseData,
            agent_id: baseData.id,
            license_number,
          };
        } else if (isBroker) {
          // Fetch broker license if available
          let prc_license = '';
          try {
            const { data: licenseData } = await supabaseAdmin
              .from('broker_license')
              .select('prclicense')
              .eq('staffid', staff.staffid)
              .order('createdat', { ascending: false })
              .limit(1)
              .single();
            
            if (licenseData?.prclicense) {
              prc_license = licenseData.prclicense;
            }
          } catch {
            // Table may not exist, continue without license info
          }

          return {
            ...baseData,
            broker_id: baseData.id,
            prc_license,
          };
        } else {
          return {
            ...baseData,
            staff_id: baseData.id,
            department: '',
            position: staff.staffrole?.rolename || '',
          };
        }
      })
    );

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch personnel',
    });
  }
}

async function handleCreatePersonnel(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query;
  const { name, email, contact_number, license_number, prc_license, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // Validation: agents require license_number, brokers require prc_license
    if (type === 'agent' && !license_number) {
      return res.status(400).json({ error: 'License number is required for agents' });
    }

    if (type === 'broker' && !prc_license) {
      return res.status(400).json({ error: 'PRC license is required for brokers' });
    }

    // Parse name into first, middle, last
    const nameParts = name.trim().split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middlename = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

    // Get the appropriate role ID based on type
    let roleCode = 'STAFF';
    if (type === 'agent') roleCode = 'AGENT';
    else if (type === 'broker') roleCode = 'BROKER';

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('staffrole')
      .select('staffroleid')
      .eq('rolecode', roleCode)
      .single();

    if (roleError || !roleData) {
      throw new Error(`Role ${roleCode} not found`);
    }

    // Create staff member
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        firstname,
        middlename,
        lastname,
        emailaddress: email,
        contactnumber: contact_number || null,
        staffroleid: roleData.staffroleid,
        isactive: status !== 'Inactive' ? true : false,
      })
      .select()
      .single();

    if (staffError) {
      throw staffError;
    }

    // Store license information in agent_license or broker_license tables if they exist
    // For now, this is handled through separate tables that should be created in the schema
    if (type === 'agent' && license_number) {
      const { error: licenseError } = await supabaseAdmin
        .from('agent_license')
        .insert({
          staffid: staffData.staffid,
          licensenumber: license_number,
          createdat: new Date().toISOString(),
        })
        .catch(() => ({ error: null })); // Gracefully handle if table doesn't exist
      
      if (licenseError) {
        console.warn('Could not store agent license (table may not exist):', licenseError);
      }
    }

    if (type === 'broker' && prc_license) {
      const { error: licenseError } = await supabaseAdmin
        .from('broker_license')
        .insert({
          staffid: staffData.staffid,
          prclicense: prc_license,
          createdat: new Date().toISOString(),
        })
        .catch(() => ({ error: null })); // Gracefully handle if table doesn't exist
      
      if (licenseError) {
        console.warn('Could not store broker license (table may not exist):', licenseError);
      }
    }

    // Log activity
    await logActivity({
      staffid: 0, // Current user (would need to extract from session)
      activitytype: 'staff_created',
      entitytype: 'staff',
      entityid: staffData.staffid,
      description: `Created ${roleCode} ${name}`,
    });

    return res.status(201).json({ item: staffData });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create personnel',
    });
  }
}

async function handleUpdatePersonnel(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const { name, email, contact_number, status } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    // Parse name into first, middle, last if provided
    const updateData: Record<string, any> = {};

    if (name) {
      const nameParts = name.trim().split(' ');
      updateData.firstname = nameParts[0] || '';
      updateData.lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      updateData.middlename = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
    }

    if (email) updateData.emailaddress = email;
    if (contact_number !== undefined) updateData.contactnumber = contact_number || null;
    if (status) updateData.isactive = status === 'Active';

    const { data, error } = await supabaseAdmin
      .from('staff')
      .update(updateData)
      .eq('staffid', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ item: data });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update personnel',
    });
  }
}

async function handleDeletePersonnel(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    // Soft delete by setting isactive to false
    const { error } = await supabaseAdmin
      .from('staff')
      .update({ isactive: false })
      .eq('staffid', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete personnel',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAdminSession(req, res);
  if (!session) {
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleFetchPersonnel(req, res);
      case 'POST':
        return handleCreatePersonnel(req, res);
      case 'PATCH':
      case 'PUT':
        return handleUpdatePersonnel(req, res);
      case 'DELETE':
        return handleDeletePersonnel(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
