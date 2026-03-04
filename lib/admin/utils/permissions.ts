import { supabaseAdmin } from './supabaseAdmin.js';

export type StaffRole = 'AGENT' | 'BROKER' | 'STAFF' | 'ADMIN';

export interface StaffMember {
  staffid: number;
  emailaddress: string;
  isactive: boolean;
  staffrole?: {
    rolecode: StaffRole;
    rolename: string;
  } | null;
}

/**
 * Permission rules based on role and business requirements
 */
export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  BROKER: [
    'approve_property_listing',
    'reject_property_listing',
    'supervise_transaction',
    'view_all_commissions',
    'manage_staff',
    'manage_agents',
  ],
  AGENT: [
    'handle_inquiry',
    'schedule_consultation',
    'create_transaction',
    'view_own_commissions',
    'respond_to_inquiry',
  ],
  STAFF: [
    'verify_documents',
    'manage_listing_review_process',
    'assign_agent_to_inquiry',
    'manage_seller_submissions',
  ],
  ADMIN: [
    // Full access
    'approve_property_listing',
    'reject_property_listing',
    'supervise_transaction',
    'view_all_commissions',
    'manage_staff',
    'manage_agents',
    'handle_inquiry',
    'schedule_consultation',
    'create_transaction',
    'view_own_commissions',
    'respond_to_inquiry',
    'verify_documents',
    'manage_listing_review_process',
    'assign_agent_to_inquiry',
    'manage_seller_submissions',
  ],
};

/**
 * Fetch staff member with role information
 */
export const fetchStaffWithRole = async (staffId: number): Promise<StaffMember | null> => {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select(
      `
      staffid,
      emailaddress,
      isactive,
      staffrole!fk_staff_role(rolecode, rolename)
    `
    )
    .eq('staffid', staffId)
    .single();

  if (error || !data) return null;
  return data as StaffMember;
};

/**
 * Validate staff member has permission for action
 */
export const validateStaffPermission = async (
  staffId: number,
  requiredPermission: string
): Promise<{ valid: boolean; reason?: string }> => {
  const staff = await fetchStaffWithRole(staffId);

  if (!staff) {
    return { valid: false, reason: 'Staff member not found' };
  }

  if (!staff.isactive) {
    return { valid: false, reason: 'Staff member is inactive' };
  }

  const roleCode = (staff.staffrole?.rolecode as StaffRole) || 'STAFF';
  const permissions = ROLE_PERMISSIONS[roleCode] || [];

  if (!permissions.includes(requiredPermission)) {
    return {
      valid: false,
      reason: `Role ${roleCode} does not have permission: ${requiredPermission}`,
    };
  }

  return { valid: true };
};

/**
 * Validate staff member is an AGENT and active
 */
export const validateAgentAssignment = async (
  staffId: number
): Promise<{ valid: boolean; reason?: string }> => {
  const staff = await fetchStaffWithRole(staffId);

  if (!staff) {
    return { valid: false, reason: 'Staff member not found' };
  }

  if (!staff.isactive) {
    return { valid: false, reason: 'Staff member is inactive' };
  }

  const roleCode = staff.staffrole?.rolecode;
  if (roleCode !== 'AGENT') {
    return { valid: false, reason: `Staff member must be an AGENT, but has role: ${roleCode || 'UNASSIGNED'}` };
  }

  return { valid: true };
};

/**
 * Validate staff member is a BROKER
 */
export const validateBrokerRole = async (
  staffId: number
): Promise<{ valid: boolean; reason?: string }> => {
  const staff = await fetchStaffWithRole(staffId);

  if (!staff) {
    return { valid: false, reason: 'Staff member not found' };
  }

  const roleCode = staff.staffrole?.rolecode;
  if (roleCode !== 'BROKER') {
    return { valid: false, reason: `Staff member must be a BROKER, but has role: ${roleCode || 'UNASSIGNED'}` };
  }

  return { valid: true };
};

/**
 * Validate staff member has any required role
 */
export const validateStaffRole = async (
  staffId: number,
  requiredRoles: StaffRole[]
): Promise<{ valid: boolean; reason?: string }> => {
  const staff = await fetchStaffWithRole(staffId);

  if (!staff) {
    return { valid: false, reason: 'Staff member not found' };
  }

  const roleCode = (staff.staffrole?.rolecode as StaffRole) || 'STAFF';
  if (!requiredRoles.includes(roleCode)) {
    return {
      valid: false,
      reason: `Staff member role must be one of: ${requiredRoles.join(', ')}, but has role: ${roleCode}`,
    };
  }

  return { valid: true };
};
