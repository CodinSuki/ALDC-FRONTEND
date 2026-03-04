import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Building2, TrendingUp, AlertCircle, FolderKanban, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchAdminDashboardData, type AdminDashboardData } from '@/app/services/adminDashboardService';
import StatCard from '@/app/components/ui/StatCard';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { getStatusColor } from '@/app/components/ui/statusBadgeUtils';
import LoadingError from '@/app/components/ui/LoadingError';
import PageHeader from '@/app/components/ui/PageHeader';

const INITIAL_DATA: AdminDashboardData = {
  stats: {
    totalProjects: 0,
    totalProperties: 0,
    availableProperties: 0,
    paymentsDue: 0,
    overduePayments: 0,
    activeInquiries: 0,
    activeTransactions: 0,
    completedTransactions: 0,
    activeTransactionValue: 0,
  },
  monthlyData: [
    { month: 'Jan', sold: 0, reserved: 0 },
    { month: 'Feb', sold: 0, reserved: 0 },
    { month: 'Mar', sold: 0, reserved: 0 },
    { month: 'Apr', sold: 0, reserved: 0 },
    { month: 'May', sold: 0, reserved: 0 },
    { month: 'Jun', sold: 0, reserved: 0 },
    { month: 'Jul', sold: 0, reserved: 0 },
    { month: 'Aug', sold: 0, reserved: 0 },
    { month: 'Sep', sold: 0, reserved: 0 },
    { month: 'Oct', sold: 0, reserved: 0 },
    { month: 'Nov', sold: 0, reserved: 0 },
    { month: 'Dec', sold: 0, reserved: 0 },
  ],
  propertyTypeData: [],
  recentInquiries: [],
  recentTransactions: [],
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 1,
    notation: value >= 1000000 ? 'compact' : 'standard',
  }).format(value);

const inquiryStatusClass = (status: string): string => {
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'Converted' || status === 'Published') return 'bg-green-100 text-green-800';
  if (status === 'Closed') return 'bg-gray-100 text-gray-800';
  return 'bg-blue-100 text-blue-800';
};

const transactionStatusClass = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete') || normalized.includes('paid')) return 'bg-green-100 text-green-800';
  if (normalized.includes('overdue')) return 'bg-red-100 text-red-800';
  return 'bg-blue-100 text-blue-800';
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchAdminDashboardData();
      setDashboardData(data);
      setLastUpdatedAt(new Date());
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Total Projects',
        value: String(dashboardData.stats.totalProjects),
        change: 'Live from database',
        icon: FolderKanban,
        color: 'bg-indigo-500',
      },
      {
        label: 'Total Properties',
        value: String(dashboardData.stats.totalProperties),
        change: `${dashboardData.stats.availableProperties} available`,
        icon: Building2,
        color: 'bg-blue-500',
      },
      {
        label: 'Available Properties',
        value: String(dashboardData.stats.availableProperties),
        change:
          dashboardData.stats.totalProperties > 0
            ? `${Math.round((dashboardData.stats.availableProperties / dashboardData.stats.totalProperties) * 100)}% of total`
            : '0% of total',
        icon: Building2,
        color: 'bg-green-500',
      },
      {
        label: 'Payments Due',
        value: String(dashboardData.stats.paymentsDue),
        change: 'From transaction statuses',
        icon: AlertCircle,
        color: 'bg-yellow-500',
      },
      {
        label: 'Overdue Payments',
        value: String(dashboardData.stats.overduePayments),
        change: 'Needs attention',
        icon: AlertCircle,
        color: 'bg-red-500',
      },
      {
        label: 'Active Inquiries',
        value: String(dashboardData.stats.activeInquiries),
        change: 'Across unified inbox',
        icon: MessageSquare,
        color: 'bg-yellow-500',
      },
      {
        label: 'Active Transactions',
        value: String(dashboardData.stats.activeTransactions),
        change: `${formatCurrency(dashboardData.stats.activeTransactionValue)} value`,
        icon: TrendingUp,
        color: 'bg-purple-500',
      },
      {
        label: 'Completed Transactions',
        value: String(dashboardData.stats.completedTransactions),
        change: 'From transaction records',
        icon: TrendingUp,
        color: 'bg-emerald-500',
      },
    ],
    [dashboardData]
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <PageHeader 
          title="Dashboard"
          description={`Last updated: ${lastUpdatedAt ? lastUpdatedAt.toLocaleString() : 'Not loaded yet'}`}
          action={
            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          }
        />

        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm p-4 text-sm text-gray-500">Loading dashboard data...</div>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{loadError}</div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              change={stat.change}
            />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Monthly Sales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-gray-900 mb-6">Monthly Property Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="sold" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="reserved" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Sold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Reserved</span>
              </div>
            </div>
          </div>

          {/* Property Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-gray-900 mb-6">Properties by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.propertyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.propertyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Inquiries */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-gray-900">Recent Inquiries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.recentInquiries.map((inquiry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {inquiry.client}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {inquiry.property}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <StatusBadge status={inquiry.status} color={getStatusColor(inquiry.status)} />
                      </td>
                    </tr>
                  ))}
                  {dashboardData.recentInquiries.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>No inquiry data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-gray-900">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.recentTransactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {transaction.property}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <StatusBadge status={transaction.status} color={getStatusColor(transaction.status)} />
                      </td>
                    </tr>
                  ))}
                  {dashboardData.recentTransactions.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>No transaction data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}