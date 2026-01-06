import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const mockTransactions = [
  { 
    id: 'TX-2024-045', 
    property: 'Vista Verde Subdivision',
    client: 'Maria Santos',
    amount: '₱5,500,000',
    paymentType: 'Installment',
    installmentStatus: 'On Track',
    nextPayment: '2025-02-01',
    paid: '₱2,200,000',
    remaining: '₱3,300,000'
  },
  { 
    id: 'TX-2024-046', 
    property: 'Metro Business Center',
    client: 'John Reyes',
    amount: '₱12,000,000',
    paymentType: 'Cash',
    installmentStatus: 'Completed',
    nextPayment: '-',
    paid: '₱12,000,000',
    remaining: '₱0'
  },
  { 
    id: 'TX-2024-047', 
    property: 'Greenfield Agricultural',
    client: 'Ana Cruz',
    amount: '₱8,500,000',
    paymentType: 'Installment',
    installmentStatus: 'Overdue',
    nextPayment: '2024-12-15',
    paid: '₱3,400,000',
    remaining: '₱5,100,000'
  },
  { 
    id: 'TX-2024-048', 
    property: 'Sunrise Beach Resort',
    client: 'Pedro Garcia',
    amount: '₱7,200,000',
    paymentType: 'Bank Transfer',
    installmentStatus: 'Completed',
    nextPayment: '-',
    paid: '₱7,200,000',
    remaining: '₱0'
  },
];

const recentPayments = [
  { date: '2025-01-03', transaction: 'TX-2024-045', amount: '₱500,000', method: 'Bank Transfer' },
  { date: '2025-01-02', transaction: 'TX-2024-048', amount: '₱7,200,000', method: 'Bank Transfer' },
  { date: '2024-12-28', transaction: 'TX-2024-045', amount: '₱500,000', method: 'Cash' },
];

export default function AdminTransactions() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.property.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-gray-900">Transaction & Payment Tracking</h2>
          <p className="text-gray-600">Monitor all property transactions and payment schedules</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Transactions', value: '156', icon: CheckCircle, color: 'bg-blue-500' },
            { label: 'Active Installments', value: '23', icon: Clock, color: 'bg-purple-500' },
            { label: 'Overdue Payments', value: '5', icon: AlertCircle, color: 'bg-red-500' },
            { label: 'This Month', value: '₱45.2M', icon: CheckCircle, color: 'bg-green-500' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-gray-900">Active Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Next Payment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {transaction.property}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {transaction.paid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.remaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        transaction.installmentStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                        transaction.installmentStatus === 'On Track' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.installmentStatus === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                        {transaction.installmentStatus === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        {transaction.installmentStatus === 'On Track' && <Clock className="w-3 h-3" />}
                        {transaction.installmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.nextPayment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payment Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-900 mb-6">Recent Payment Logs</h3>
          <div className="space-y-4">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-gray-900">{payment.transaction}</p>
                      <p className="text-sm text-gray-600">{payment.method}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">{payment.amount}</p>
                  <p className="text-sm text-gray-600">{payment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
