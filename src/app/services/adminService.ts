import { supabase } from '../../lib/SupabaseClient';
import type { QueryData } from '@supabase/supabase-js';

const buildStaffQuery = () =>
  supabase
    .from('staff')
    .select(`
      staffid,
      firstname,
      lastname,
      emailaddress,
      contactnumber,
      staffrole!fk_staff_role(rolename),
      isactive
    `)
    .order('staffid', { ascending: true });

type StaffDbRow = QueryData<ReturnType<typeof buildStaffQuery>>[number];

export type StaffRow = {
  staff_id: number;
  name: string;
  email: string;
  contact_number: string;
  department: string;
  position: string;
  status: 'Active' | 'Inactive';
};

export const fetchStaff = async (): Promise<StaffRow[]> => {
  const { data, error } = await buildStaffQuery();

  if (error) throw error;

  return (data ?? []).map((staff) => ({
    staff_id: staff.staffid,
    name: `${staff.firstname} ${staff.lastname}`.trim(),
    email: staff.emailaddress,
    contact_number: staff.contactnumber,
    department: '',
    position: staff.staffrole?.[0]?.rolename ?? '',
    status: staff.isactive ? 'Active' : 'Inactive',
  }));
};

