import AdminLayout from '@/app/components/AdminLayout';
import { Download, Calendar, TrendingUp, DollarSign, Building2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useEffect, useState } from 'react';
import { fetchReportsData, type ReportsData } from '@/app/services/adminReportsService';

export default function AdminReports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const reportsData = await fetchReportsData();
        setData(reportsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load reports';
        setError(message);
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);

  const calculateMetrics = () => {
    if (!data) return { totalRevenue: 0, propertiesSold: 0, totalCommissions: 0, avgTransaction: 0 };

    const totalRevenue = data.revenues.reduce((sum, point) => sum + point.revenue, 0);
    const propertiesSold = data.projectPerformance.reduce((sum, project) => sum + project.sold, 0);
    const totalCommissions = data.commissions.reduce((sum, commission) => sum + commission.totalcommission, 0);
    const avgTransaction = propertiesSold > 0 ? totalRevenue / propertiesSold : 0;

    return { totalRevenue, propertiesSold, totalCommissions, avgTransaction };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600">View business insights and generate reports</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              <span>Loading reports...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600">View business insights and generate reports</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load reports</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600">View business insights and generate reports</p>
          </div>
          <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue), change: 'This period', icon: DollarSign, color: 'bg-green-500' },
            { label: 'Properties Sold', value: String(metrics.propertiesSold), change: 'Total transactions', icon: Building2, color: 'bg-blue-500' },
            { label: 'Total Commissions', value: formatCurrency(metrics.totalCommissions), change: 'Paid to staff', icon: Users, color: 'bg-purple-500' },
            { label: 'Avg. Transaction Value', value: formatCurrency(metrics.avgTransaction), change: 'Per property', icon: TrendingUp, color: 'bg-orange-500' },
          ].map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-gray-900 mb-2">{metric.value}</p>
                  <p className="text-xs text-green-600">{metric.change} from last year</p>
                </div>
                <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Revenue Trend</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Monthly Data</span>
            </div>
          </div>
          {data && data.revenues.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenues}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis 
                  stroke="#666"
                  tickFormatter={(value) => `₱${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: any) => [`₱${(value / 1000000).toFixed(1)}M`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No revenue data available
            </div>
          )}
        </div>

        {/* Project Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Project Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Properties Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Sell-through Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data && data.projectPerformance.length > 0 ? (
                  data.projectPerformance.map((project, index) => {
                    const total = project.sold + project.available;
                    const rate = total > 0 ? ((project.sold / total) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {project.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {project.sold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {project.available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {formatCurrency(project.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No project data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Monthly Transactions</h2>
          {data && data.revenues.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenues}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No transaction data available
            </div>
          )}
        </div>

        {/* Commission Report */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Staff Commission Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Staff Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Total Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data && data.commissions.length > 0 ? (
                  data.commissions.map((commission, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {commission.staffname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {commission.staffrole}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(commission.totalcommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {commission.transactioncount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No commission data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Audit Log */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Recent Admin Activity Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data && data.activityLogs.length > 0 ? (
                  data.activityLogs.slice(0, 20).map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.staffname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                          {log.activitytype.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.entitytype}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.description || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdat).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No activity logs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
