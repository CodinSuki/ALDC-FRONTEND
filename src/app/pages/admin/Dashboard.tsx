import AdminLayout from '../../components/AdminLayout';
import { Building2, Users, TrendingUp, AlertCircle, FolderKanban, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { label: 'Total Projects', value: '12', change: '+2 this month', icon: FolderKanban, color: 'bg-indigo-500' },
  { label: 'Total Properties', value: '156', change: '87 available', icon: Building2, color: 'bg-blue-500' },
  { label: 'Available Properties', value: '87', change: '56% of total', icon: Building2, color: 'bg-green-500' },
  { label: 'Active Inquiries', value: '34', change: '12 new this week', icon: MessageSquare, color: 'bg-yellow-500' },
  { label: 'Active Transactions', value: '23', change: '₱45.2M value', icon: TrendingUp, color: 'bg-purple-500' },
  { label: 'Completed Transactions', value: '89', change: 'This year', icon: TrendingUp, color: 'bg-emerald-500' },
];

const monthlyData = [
  { month: 'Jan', sold: 12, reserved: 8 },
  { month: 'Feb', sold: 15, reserved: 10 },
  { month: 'Mar', sold: 10, reserved: 6 },
  { month: 'Apr', sold: 18, reserved: 12 },
  { month: 'May', sold: 14, reserved: 9 },
  { month: 'Jun', sold: 20, reserved: 15 },
];

const propertyTypeData = [
  { name: 'Residential', value: 65, color: '#10b981' },
  { name: 'Agricultural', value: 42, color: '#3b82f6' },
  { name: 'Commercial', value: 30, color: '#8b5cf6' },
  { name: 'Industrial', value: 19, color: '#f59e0b' },
];

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-gray-900 mb-2">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Monthly Sales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-gray-900 mb-6">Monthly Property Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
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
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {propertyTypeData.map((entry, index) => (
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
                  {[
                    { client: 'Juan Santos', property: 'Vista Verde - Lot 5', status: 'Pending' },
                    { client: 'Maria Garcia', property: 'Greenfield Farm', status: 'Pending' },
                    { client: 'Carlos Reyes', property: 'Metro Business Center', status: 'Converted' },
                    { client: 'Ana Lopez', property: 'Sunrise Beach Resort', status: 'Pending' },
                    { client: 'Pedro Cruz', property: 'Industrial Park', status: 'Closed' },
                  ].map((inquiry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {inquiry.client}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {inquiry.property}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          inquiry.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          inquiry.status === 'Converted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inquiry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                  {[
                    { property: 'VV-BLK1-LOT5', amount: '₱5,500,000', status: 'In Progress' },
                    { property: 'MBC-FL5-U501', amount: '₱12,000,000', status: 'Completed' },
                    { property: 'GF-FARM-A12', amount: '₱8,500,000', status: 'In Progress' },
                    { property: 'SBR-LOT-B8', amount: '₱7,200,000', status: 'In Progress' },
                    { property: 'IPZ-WARE-W3', amount: '₱15,000,000', status: 'Completed' },
                  ].map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {transaction.property}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}