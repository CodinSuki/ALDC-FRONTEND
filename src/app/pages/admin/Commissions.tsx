import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Search, DollarSign, CheckCircle, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

// Database-aligned interfaces
interface Commission {
  commission_id: number;
  transaction_id: number;
  agent_id: number | null;
  percentage: string;
  amount: string;
  // Joined data for display
  transaction_ref?: string;
  agent_name?: string;
  property_code?: string;
  client_name?: string;
  status?: 'Paid' | 'Pending';
  paid_date?: string;
}

interface Agent {
  agent_id: number;
  broker_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  contact_email: string | null;
  contact_number: string | null;
}

interface Transaction {
  transaction_id: number;
  property_code: string;
  client_name: string;
  total_amount: string;
}

// Mock data
const mockAgents: Agent[] = [
  { agent_id: 1, broker_id: 1, first_name: 'Roberto', middle_name: 'A.', last_name: 'Martinez', contact_email: 'roberto.martinez@aldc.com', contact_number: '09171234567' },
  { agent_id: 2, broker_id: 1, first_name: 'Sofia', middle_name: 'B.', last_name: 'Reyes', contact_email: 'sofia.reyes@aldc.com', contact_number: '09181234567' },
  { agent_id: 3, broker_id: 1, first_name: 'Miguel', middle_name: null, last_name: 'Santos', contact_email: 'miguel.santos@aldc.com', contact_number: '09191234567' },
];

const mockTransactions: Transaction[] = [
  { transaction_id: 45, property_code: 'VV-BLK1-LOT5', client_name: 'Maria C. Santos', total_amount: '5500000.00' },
  { transaction_id: 46, property_code: 'MBC-FL5-U501', client_name: 'John D. Reyes', total_amount: '12000000.00' },
  { transaction_id: 47, property_code: 'GF-FARM-A12', client_name: 'Ana Cruz', total_amount: '8500000.00' },
  { transaction_id: 48, property_code: 'SBR-LOT-B8', client_name: 'Pedro L. Garcia', total_amount: '7200000.00' },
];

const initialCommissions: Commission[] = [
  { 
    commission_id: 1,
    transaction_id: 45,
    agent_id: 1,
    percentage: '5.00',
    amount: '275000.00',
    transaction_ref: 'TX-45',
    agent_name: 'Roberto A. Martinez',
    property_code: 'VV-BLK1-LOT5',
    client_name: 'Maria C. Santos',
    status: 'Paid',
    paid_date: '2025-01-03'
  },
  { 
    commission_id: 2,
    transaction_id: 46,
    agent_id: 2,
    percentage: '5.00',
    amount: '600000.00',
    transaction_ref: 'TX-46',
    agent_name: 'Sofia B. Reyes',
    property_code: 'MBC-FL5-U501',
    client_name: 'John D. Reyes',
    status: 'Paid',
    paid_date: '2025-01-02'
  },
  { 
    commission_id: 3,
    transaction_id: 47,
    agent_id: 1,
    percentage: '5.00',
    amount: '425000.00',
    transaction_ref: 'TX-47',
    agent_name: 'Roberto A. Martinez',
    property_code: 'GF-FARM-A12',
    client_name: 'Ana Cruz',
    status: 'Pending',
    paid_date: undefined
  },
  { 
    commission_id: 4,
    transaction_id: 48,
    agent_id: 3,
    percentage: '5.00',
    amount: '360000.00',
    transaction_ref: 'TX-48',
    agent_name: 'Miguel Santos',
    property_code: 'SBR-LOT-B8',
    client_name: 'Pedro L. Garcia',
    status: 'Paid',
    paid_date: '2024-12-30'
  },
];

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions);
  const [agents] = useState<Agent[]>(mockAgents);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  
  const [formData, setFormData] = useState<Partial<Commission>>({
    transaction_id: 0,
    agent_id: null,
    percentage: '5.00',
    amount: '',
    status: 'Pending',
    paid_date: '',
  });

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = 
      commission.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.transaction_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.property_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || commission.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate agent summaries dynamically
  const agentSummary = Object.values(
    commissions.reduce((acc, comm) => {
      if (!comm.agent_id) return acc;
      if (!acc[comm.agent_id]) {
        acc[comm.agent_id] = {
          agent_id: comm.agent_id,
          agent_name: comm.agent_name,
          transactions: 0,
          totalCommission: 0,
          pending: 0,
        };
      }
      acc[comm.agent_id].transactions += 1;
      const amount = parseFloat(comm.amount);
      acc[comm.agent_id].totalCommission += amount;
      if (comm.status === 'Pending') {
        acc[comm.agent_id].pending += amount;
      }
      return acc;
    }, {} as Record<number, any>)
  ).map(agent => ({
    ...agent,
    totalCommission: `₱${agent.totalCommission.toLocaleString()}`,
    pending: `₱${agent.pending.toLocaleString()}`,
  }));

  const getAgentName = (agentId: number | null): string => {
    if (!agentId) return 'N/A';
    const agent = agents.find(a => a.agent_id === agentId);
    if (!agent) return 'Unknown';
    return `${agent.first_name} ${agent.middle_name ? agent.middle_name + ' ' : ''}${agent.last_name}`;
  };

  const getTransactionInfo = (transactionId: number) => {
    return transactions.find(t => t.transaction_id === transactionId);
  };

  const calculateCommission = (transactionId: number, percentage: string): string => {
    const transaction = transactions.find(t => t.transaction_id === transactionId);
    if (!transaction) return '0.00';
    const amount = parseFloat(transaction.total_amount) * (parseFloat(percentage) / 100);
    return amount.toFixed(2);
  };

  const handleAddCommission = () => {
    if (!formData.transaction_id || !formData.agent_id || !formData.percentage) {
      alert('Please fill in all required fields');
      return;
    }

    const calculatedAmount = formData.amount || calculateCommission(formData.transaction_id, formData.percentage!);
    const transactionInfo = getTransactionInfo(formData.transaction_id);

    const newCommission: Commission = {
      commission_id: Math.max(...commissions.map(c => c.commission_id), 0) + 1,
      transaction_id: formData.transaction_id!,
      agent_id: formData.agent_id,
      percentage: formData.percentage!,
      amount: calculatedAmount,
      transaction_ref: `TX-${formData.transaction_id}`,
      agent_name: getAgentName(formData.agent_id),
      property_code: transactionInfo?.property_code || 'Unknown',
      client_name: transactionInfo?.client_name || 'Unknown',
      status: formData.status || 'Pending',
      paid_date: formData.status === 'Paid' ? (formData.paid_date || new Date().toISOString().split('T')[0]) : undefined,
    };

    setCommissions([...commissions, newCommission]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditCommission = () => {
    if (!formData.transaction_id || !formData.agent_id || !formData.percentage) {
      alert('Please fill in all required fields');
      return;
    }

    const calculatedAmount = formData.amount || calculateCommission(formData.transaction_id, formData.percentage!);
    const transactionInfo = getTransactionInfo(formData.transaction_id);

    const updatedCommission: Commission = {
      commission_id: selectedCommission!.commission_id,
      transaction_id: formData.transaction_id!,
      agent_id: formData.agent_id,
      percentage: formData.percentage!,
      amount: calculatedAmount,
      transaction_ref: `TX-${formData.transaction_id}`,
      agent_name: getAgentName(formData.agent_id),
      property_code: transactionInfo?.property_code || 'Unknown',
      client_name: transactionInfo?.client_name || 'Unknown',
      status: formData.status || 'Pending',
      paid_date: formData.status === 'Paid' ? (formData.paid_date || new Date().toISOString().split('T')[0]) : undefined,
    };

    setCommissions(commissions.map(c =>
      c.commission_id === selectedCommission!.commission_id ? updatedCommission : c
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteCommission = () => {
    if (selectedCommission) {
      setCommissions(commissions.filter(c => c.commission_id !== selectedCommission.commission_id));
      setIsDeleteDialogOpen(false);
      setSelectedCommission(null);
    }
  };

  const handleMarkAsPaid = (commission: Commission) => {
    const updatedCommission = {
      ...commission,
      status: 'Paid' as 'Paid' | 'Pending',
      paid_date: new Date().toISOString().split('T')[0],
    };
    setCommissions(commissions.map(c =>
      c.commission_id === commission.commission_id ? updatedCommission : c
    ));
  };

  const openEditDialog = (commission: Commission) => {
    setFormData({
      transaction_id: commission.transaction_id,
      agent_id: commission.agent_id,
      percentage: commission.percentage,
      amount: commission.amount,
      status: commission.status,
      paid_date: commission.paid_date || '',
    });
    setSelectedCommission(commission);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      transaction_id: 0,
      agent_id: null,
      percentage: '5.00',
      amount: '',
      status: 'Pending',
      paid_date: '',
    });
    setSelectedCommission(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate amount when transaction or percentage changes
      if ((field === 'transaction_id' || field === 'percentage') && updated.transaction_id && updated.percentage) {
        updated.amount = calculateCommission(updated.transaction_id, updated.percentage);
      }
      
      return updated;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Commission Tracking</h2>
            <p className="text-gray-600">Monitor agent commissions and payment status</p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Commission
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              label: 'Total Commissions Paid', 
              value: `₱${commissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + parseFloat(c.amount), 0).toLocaleString()}`, 
              icon: CheckCircle, 
              color: 'bg-green-500' 
            },
            { 
              label: 'Pending Commissions', 
              value: `₱${commissions.filter(c => c.status === 'Pending').reduce((sum, c) => sum + parseFloat(c.amount), 0).toLocaleString()}`, 
              icon: Clock, 
              color: 'bg-yellow-500' 
            },
            { 
              label: 'Total Records', 
              value: commissions.length.toString(), 
              icon: DollarSign, 
              color: 'bg-blue-500' 
            },
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
                    {agent.agent_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900">{agent.agent_name}</p>
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
                placeholder="Search by agent, transaction, or property..."
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
                    Comm. ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.commission_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      COM-{commission.commission_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {commission.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.transaction_ref}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.property_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(commission.percentage).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₱{parseFloat(commission.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
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
                        {commission.status === 'Pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(commission)}
                            className="text-xs text-green-600 hover:text-green-800 underline"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => openEditDialog(commission)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(commission)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Commission Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Commission</DialogTitle>
            <DialogDescription>
              Create a new commission record for an agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Transaction <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.transaction_id || ''}
                  onChange={(e) => handleFormChange('transaction_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Transaction</option>
                  {transactions.map(transaction => (
                    <option key={transaction.transaction_id} value={transaction.transaction_id}>
                      TX-{transaction.transaction_id} - {transaction.property_code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Agent <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.agent_id || ''}
                  onChange={(e) => handleFormChange('agent_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Agent</option>
                  {agents.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.first_name} {agent.middle_name} {agent.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.percentage}
                  onChange={(e) => handleFormChange('percentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 5.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Amount (PHP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                  placeholder="Auto-calculated"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Automatically calculated from transaction amount</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {formData.status === 'Paid' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => handleFormChange('paid_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCommission}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Commission
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Commission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Commission</DialogTitle>
            <DialogDescription>
              Update commission record details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Transaction <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.transaction_id || ''}
                  onChange={(e) => handleFormChange('transaction_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Transaction</option>
                  {transactions.map(transaction => (
                    <option key={transaction.transaction_id} value={transaction.transaction_id}>
                      TX-{transaction.transaction_id} - {transaction.property_code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Agent <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.agent_id || ''}
                  onChange={(e) => handleFormChange('agent_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Agent</option>
                  {agents.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.first_name} {agent.middle_name} {agent.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.percentage}
                  onChange={(e) => handleFormChange('percentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Amount (PHP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {formData.status === 'Paid' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => handleFormChange('paid_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditCommission}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Commission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this commission record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedCommission && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Commission ID</p>
                <p className="text-gray-900">COM-{selectedCommission.commission_id}</p>
                <p className="text-sm text-gray-600 mt-2">Agent</p>
                <p className="text-gray-900">{selectedCommission.agent_name}</p>
                <p className="text-sm text-gray-600 mt-2">Amount</p>
                <p className="text-gray-900">₱{parseFloat(selectedCommission.amount).toLocaleString()}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCommission(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCommission}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Commission
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
