export interface RevenuePoint {
  month: string;
  revenue: number;
  transactions: number;
}

export interface ProjectPerformance {
  project: string;
  sold: number;
  available: number;
  revenue: number;
}

export interface ActivityLogEntry {
  activityid: number;
  staffname: string;
  activitytype: string;
  entitytype: string;
  entityid: number;
  description: string;
  createdat: string;
}

export interface CommissionReport {
  staffname: string;
  staffrole: string;
  totalcommission: number;
  transactioncount: number;
}

export interface ReportsData {
  revenues: RevenuePoint[];
  projectPerformance: ProjectPerformance[];
  activityLogs: ActivityLogEntry[];
  commissions: CommissionReport[];
}

const apiRequest = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Request failed');
  }

  return payload as T;
};

export const fetchReportsData = async (): Promise<ReportsData> => {
  return apiRequest<ReportsData>('/api/admin/dashboard?view=reports', {
    method: 'GET',
  });
};
