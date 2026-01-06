import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, DollarSign, CheckCircle, Clock } from 'lucide-react';

const mockCommissions = [
  { 
    id: 'COM-001',
    agent: 'Roberto Martinez',
    transaction: 'TX-2024-045',
    property: 'Vista Verde Subdivision',
    amount: '₱275,000',
    rate: '5%',
    status: 'Paid',
    paidDate: '2025-01-03'
  },
  { 
    id: 'COM-002',
    agent: 'Sofia Reyes',
    transaction: 'TX-2024-046',
    property: 'Metro Business Center',
    amount: '₱600,000',
    rate: '5%',
    status: 'Paid',
    paidDate: '2025-01-02'
  },
  { 
    id: 'COM-003',
    agent: 'Roberto Martinez',
    transaction: 'TX-2024-047',
    property: 'Greenfield Agricultural',
    amount: '₱425,000',
    rate: '5%',
    status: 'Pending',
    paidDate: '-'
  },
  { 
    id: 'COM-004',
    agent: 'Miguel Santos',
    transaction: 'TX-2024-048',
    property: 'Sunrise Beach Resort',
    amount: '₱360,000',
    rate: '5%',
    status: 'Paid',
    paidDate: '2024-12-30'
  },
  { 
    id: 'COM-005',
    agent: 'Sofia Reyes',
    transaction: 'TX-2024-049',
    property: 'Industrial Park Zone',
    amount: '₱450,000',
    rate: '5%',
    status: 'Pending',
    paidDate: '-'
  },
];

const agentSummary = [
  { agent: 'Roberto Martinez', transactions: 12, totalCommission: '₱3,250,000', pending: '₱425,000' },
  { agent: 'Sofia Reyes', transactions: 18, totalCommission: '₱5,100,000', pending: '₱450,000' },
  { agent: 'Miguel Santos', transactions: 9, totalCommission: '₱2,800,000', pending: '₱0' },
];

export default function AdminCommissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredCommissions = mockCommissions.filter(commission => {
    const matchesSearch = commission.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commission.transaction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || commission.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-gray-900">Commission Tracking</h2>
          <p className="text-gray-600">Monitor agent commissions and payment status</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Commissions Paid', value: '₱12.5M', icon: CheckCircle, color: 'bg-green-500' },
            { label: 'Pending Commissions', value: '₱875K', icon: Clock, color: 'bg-yellow-500' },
            { label: 'This Month', value: '₱1.2M', icon: DollarSign, color: 'bg-blue-500' },
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

        {/* Agent Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-900 mb-6">Agent Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {agentSummary.map((agent, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    {agent.agent.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900">{agent.agent}</p>
                    <p className="text-sm text-gray-600">{agent.transactions} transactions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Earned</span>
                    <span className="text-gray-900">{agent.totalCommission}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-yellow-600">{agent.pending}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by agent or transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-gray-900">Commission Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Commission ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Transaction Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Commission Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Paid Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {commission.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.transaction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.property}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {commission.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        commission.status === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {commission.status === 'Paid' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {commission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.paidDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
