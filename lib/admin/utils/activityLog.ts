import { supabaseAdmin } from './supabaseAdmin.js';

export type ActivityType =
  | 'property_approved'
  | 'property_rejected'
  | 'agent_assigned'
  | 'consultation_scheduled'
  | 'transaction_created'
  | 'commission_generated'
  | 'payout_recorded'
  | 'document_verified'
  | 'inquiry_created'
  | 'inquiry_assigned'
  | 'staff_created'
  | 'staff_updated'
  | 'staff_deleted'
  | 'staff_login';

export interface ActivityLog {
  activityid?: number;
  staffid: number;
  activitytype: ActivityType;
  entitytype: string; // 'property', 'inquiry', 'consultation', 'transaction', 'commission', 'staff'
  entityid: number;
  description?: string;
  createddat?: string;
}

/**
 * Log activity for audit trail
 */
export const logActivity = async (activity: ActivityLog): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('activitylog')
    .insert({
      staffid: activity.staffid,
      activitytype: activity.activitytype,
      entitytype: activity.entitytype,
      entityid: activity.entityid,
      description: activity.description || '',
      createddat: new Date().toISOString(),
    });

  if (error) {
    // Log error but don't fail the operation
    console.error('Failed to log activity:', error);
  }
};

/**
 * Get activity log for entity (e.g., all actions on a property)
 */
export const getActivityLog = async (
  entityType: string,
  entityId: number
): Promise<ActivityLog[]> => {
  const { data, error } = await supabaseAdmin
    .from('activitylog')
    .select(
      `
      activityid,
      staffid,
      activitytype,
      entitytype,
      entityid,
      description,
      createddat
    `
    )
    .eq('entitytype', entityType)
    .eq('entityid', entityId)
    .order('createddat', { ascending: false });

  if (error) {
    console.error('Failed to fetch activity log:', error);
    return [];
  }

  return (data as ActivityLog[]) || [];
};

/**
 * Get activity log for staff member
 */
export const getStaffActivityLog = async (staffId: number): Promise<ActivityLog[]> => {
  const { data, error } = await supabaseAdmin
    .from('activitylog')
    .select(
      `
      activityid,
      staffid,
      activitytype,
      entitytype,
      entityid,
      description,
      createddat
    `
    )
    .eq('staffid', staffId)
    .order('createddat', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch staff activity log:', error);
    return [];
  }

  return (data as ActivityLog[]) || [];
};
