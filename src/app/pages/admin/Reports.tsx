import AdminLayout from '@/app/components/AdminLayout';
import { Download, Calendar, TrendingUp, DollarSign, Building2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const salesData = [
  { month: 'Jan', revenue: 45000000, transactions: 12 },
  { month: 'Feb', revenue: 52000000, transactions: 15 },
  { month: 'Mar', revenue: 38000000, transactions: 10 },
  { month: 'Apr', revenue: 65000000, transactions: 18 },
  { month: 'May', revenue: 48000000, transactions: 14 },
  { month: 'Jun', revenue: 72000000, transactions: 20 },
];

const projectPerformance = [
  { project: 'Vista Verde', sold: 28, available: 17, revenue: 154000000 },
  { project: 'Greenfield', sold: 18, available: 10, revenue: 153000000 },
  { project: 'Metro Business', sold: 35, available: 17, revenue: 420000000 },
  { project: 'Sunrise Beach', sold: 12, available: 6, revenue: 86400000 },
];

export default function AdminReports() {
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
            { label: 'Total Revenue (YTD)', value: '₱320M', change: '+23%', icon: DollarSign, color: 'bg-green-500' },
            { label: 'Properties Sold (YTD)', value: '93', change: '+18%', icon: Building2, color: 'bg-blue-500' },
            { label: 'Active Clients', value: '234', change: '+12%', icon: Users, color: 'bg-purple-500' },
            { label: 'Avg. Transaction Value', value: '₱8.5M', change: '+5%', icon: TrendingUp, color: 'bg-orange-500' },
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
              <span>Last 6 Months</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
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
                {projectPerformance.map((project, index) => {
                  const total = project.sold + project.available;
                  const rate = ((project.sold / total) * 100).toFixed(1);
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
                        ₱{(project.revenue / 1000000).toFixed(1)}M
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Monthly Transactions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Reports */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Commission Report', description: 'View agent and broker commissions', icon: DollarSign },
            { title: 'Payment Status Report', description: 'Track payment schedules and overdue', icon: Calendar },
            { title: 'Client Activity Report', description: 'Analyze client inquiries and conversions', icon: Users },
          ].map((report, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <report.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
