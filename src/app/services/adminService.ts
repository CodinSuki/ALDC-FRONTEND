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
  const response = await fetch('/api/admin/staff', {
    method: 'GET',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    items?: StaffRow[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load staff records');
  }

  return payload.items ?? [];
};

