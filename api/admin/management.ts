import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from './_utils/auth.js';
import { supabaseAdmin } from './_utils/supabaseAdmin.js';
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

/**
 * Consolidated management endpoint - handles staff, agents, and brokers
 * Route patterns:
 * - GET /api/admin/management - Fetch all staff
 * - GET /api/admin/management?resource=staff - Fetch staff
 * - GET /api/admin/management?resource=agents - Fetch agents  
 * - GET /api/admin/management?resource=brokers - Fetch brokers
 * - POST /api/admin/management - Create personnel
 * - PATCH /api/admin/management?id=X - Update personnel
 * - DELETE /api/admin/management?id=X - Delete personnel
 */

async function handleFetchManagement(req: VercelRequest, res: VercelResponse) {
  const { resource } = req.query; // 'staff' | 'agents' | 'brokers' or undefined for all

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

    // Filter by resource type
    let filteredData = data ?? [];
    if (resource === 'agents') {
      filteredData = filteredData.filter((staff: any) => staff.staffrole?.rolecode === 'AGENT');
    } else if (resource === 'brokers') {
      filteredData = filteredData.filter((staff: any) => staff.staffrole?.rolecode === 'BROKER');
    } else if (resource === 'staff') {
      filteredData = filteredData.filter((staff: any) => 
        staff.staffrole?.rolecode === 'STAFF' || !['AGENT', 'BROKER'].includes(staff.staffrole?.rolecode)
      );
    }
    // If no resource specified, return all

    const items = await Promise.all(
      ((filteredData ?? []) as StaffRow[]).map(async (staff) => {
        const fullName = [staff.firstname, staff.middlename, staff.lastname]
          .filter(Boolean)
          .join(' ');

        const roleCode = staff.staffrole?.rolecode || '';
        const isAgent = roleCode === 'AGENT';
        const isBroker = roleCode === 'BROKER';

        const baseData = {
          id: Number(staff.staffid),
          staff_id: Number(staff.staffid),
          name: fullName,
          email: staff.emailaddress,
          contact_number: staff.contactnumber || '',
          status: staff.isactive ? 'Active' : 'Inactive',
        };

        if (isAgent) {
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
            // Table may not exist
          }

          return {
            ...baseData,
            agent_id: baseData.id,
            license_number,
          };
        } else if (isBroker) {
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
            // Table may not exist
          }

          return {
            ...baseData,
            broker_id: baseData.id,
            prc_license,
          };
        } else {
          return {
            ...baseData,
            department: '',
            position: staff.staffrole?.rolename || '',
          };
        }
      })
    );

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch management data',
    });
  }
}

async function handleCreateManagement(req: VercelRequest, res: VercelResponse) {
  const { name, email, contact_number, license_number, prc_license, status } = req.body;
  const { resource } = req.query; // Get resource from query param
  
  // Map resource to type
  let type = 'staff';
  if (resource === 'agents') type = 'agent';
  else if (resource === 'brokers') type = 'broker';

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    if (type === 'agent' && !license_number) {
      return res.status(400).json({ error: 'License number is required for agents' });
    }

    if (type === 'broker' && !prc_license) {
      return res.status(400).json({ error: 'PRC license is required for brokers' });
    }

    const nameParts = name.trim().split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middlename = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

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

    if (type === 'agent' && license_number) {
      await supabaseAdmin
        .from('agent_license')
        .insert({
          staffid: staffData.staffid,
          licensenumber: license_number,
          createdat: new Date().toISOString(),
        })
        .catch(() => ({}));
    }

    if (type === 'broker' && prc_license) {
      await supabaseAdmin
        .from('broker_license')
        .insert({
          staffid: staffData.staffid,
          prclicense: prc_license,
          createdat: new Date().toISOString(),
        })
        .catch(() => ({}));
    }

    // Get session from context (passed via res.locals or extract from request)
    // Fallback to 0 if session not available at this point
    await logActivity({
      staffid: 0,
      activitytype: 'staff_created',
      entitytype: 'staff',
      entityid: staffData.staffid,
      description: `Created ${roleCode} ${name}`,
    }).catch(() => {});

    return res.status(201).json({ item: staffData });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create personnel',
    });
  }
}

async function handleUpdateManagement(req: VercelRequest, res: VercelResponse) {
  const { id, resource } = req.query;
  const { name, email, contact_number, license_number, prc_license, status } = req.body;
  
  // Map resource to type
  let type = 'staff';
  if (resource === 'agents') type = 'agent';
  else if (resource === 'brokers') type = 'broker';

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
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
    
    // Update license if provided
    if (type === 'agent' && license_number !== undefined) {
      // Delete old license and create new one
      await supabaseAdmin
        .from('agent_license')
        .delete()
        .eq('staffid', id)
        .catch(() => {});
      
      if (license_number) {
        await supabaseAdmin
          .from('agent_license')
          .insert({
            staffid: Number(id),
            licensenumber: license_number,
            createdat: new Date().toISOString(),
          })
          .catch(() => {});
      }
    }
    
    if (type === 'broker' && prc_license !== undefined) {
      // Delete old license and create new one
      await supabaseAdmin
        .from('broker_license')
        .delete()
        .eq('staffid', id)
        .catch(() => {});
      
      if (prc_license) {
        await supabaseAdmin
          .from('broker_license')
          .insert({
            staffid: Number(id),
            prclicense: prc_license,
            createdat: new Date().toISOString(),
          })
          .catch(() => {});
      }
    }

    await logActivity({
      staffid: 0,
      activitytype: 'staff_updated',
      entitytype: 'staff',
      entityid: Number(id),
      description: `Updated staff member ${name || 'unknown'}`,
    }).catch(() => {});

    return res.status(200).json({ item: data });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update personnel',
    });
  }
}

async function handleDeleteManagement(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('staff')
      .update({ isactive: false })
      .eq('staffid', id);

    if (error) {
      throw error;
    }

    await logActivity({
      staffid: 0,
      activitytype: 'staff_deleted',
      entitytype: 'staff',
      entityid: Number(id),
      description: `Deleted staff member`,
    }).catch(() => {});

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
        return handleFetchManagement(req, res);
      case 'POST':
        return handleCreateManagement(req, res);
      case 'PATCH':
      case 'PUT':
        return handleUpdateManagement(req, res);
      case 'DELETE':
        return handleDeleteManagement(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
