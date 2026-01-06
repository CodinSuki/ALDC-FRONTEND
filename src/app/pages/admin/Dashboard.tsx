import AdminLayout from '../../components/AdminLayout';
import { Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { label: 'Total Properties', value: '156', change: '+12 this month', icon: Building2, color: 'bg-blue-500' },
  { label: 'Available Properties', value: '87', change: '56% of total', icon: Building2, color: 'bg-green-500' },
  { label: 'Active Transactions', value: '23', change: '₱45.2M value', icon: TrendingUp, color: 'bg-purple-500' },
  { label: 'Overdue Payments', value: '5', change: 'Needs attention', icon: AlertCircle, color: 'bg-red-500' },
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New inquiry received', details: 'Vista Verde Subdivision', time: '2 hours ago', type: 'inquiry' },
              { action: 'Property status updated', details: 'Metro Business Center → Reserved', time: '5 hours ago', type: 'update' },
              { action: 'Payment recorded', details: '₱500,000 - Transaction #TX-2024-045', time: '1 day ago', type: 'payment' },
              { action: 'New property added', details: 'Sunrise Beach Resort', time: '2 days ago', type: 'property' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  activity.type === 'inquiry' ? 'bg-blue-500' :
                  activity.type === 'update' ? 'bg-purple-500' :
                  activity.type === 'payment' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
