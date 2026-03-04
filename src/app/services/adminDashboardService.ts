type DashboardStat = {
  totalProjects: number;
  totalProperties: number;
  availableProperties: number;
  paymentsDue: number;
  overduePayments: number;
  activeInquiries: number;
  activeTransactions: number;
  completedTransactions: number;
  activeTransactionValue: number;
};

type MonthlyPoint = {
  month: string;
  sold: number;
  reserved: number;
};

type PropertyTypePoint = {
  name: string;
  value: number;
  color: string;
};

type DashboardInquiry = {
  client: string;
  property: string;
  status: string;
};

type DashboardTransaction = {
  property: string;
  amount: string;
  status: string;
};

export type AdminDashboardData = {
  stats: DashboardStat;
  monthlyData: MonthlyPoint[];
  propertyTypeData: PropertyTypePoint[];
  recentInquiries: DashboardInquiry[];
  recentTransactions: DashboardTransaction[];
};

export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const response = await fetch('/api/admin/dashboard', {
    method: 'GET',
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Failed to fetch dashboard data');
  }

  return payload as AdminDashboardData;
};
