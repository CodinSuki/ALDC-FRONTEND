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

interface Commission {
  id: string;
  agent: string;
  transaction: string;
  property: string;
  amount: string;
  rate: string;
  status: string;
  paidDate: string;
}

const initialCommissions: Commission[] = [
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

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  
  const [formData, setFormData] = useState<Commission>({
    id: '',
    agent: '',
    transaction: '',
    property: '',
    amount: '',
    rate: '5%',
    status: 'Pending',
    paidDate: '',
  });

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commission.transaction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || commission.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate agent summaries dynamically
  const agentSummary = Object.values(
    commissions.reduce((acc, comm) => {
      if (!acc[comm.agent]) {
        acc[comm.agent] = {
          agent: comm.agent,
          transactions: 0,
          totalCommission: 0,
          pending: 0,
        };
      }
      acc[comm.agent].transactions += 1;
      const amount = parseFloat(comm.amount.replace(/[₱,]/g, ''));
      acc[comm.agent].totalCommission += amount;
      if (comm.status === 'Pending') {
        acc[comm.agent].pending += amount;
      }
      return acc;
    }, {} as Record<string, any>)
  ).map(agent => ({
    ...agent,
    totalCommission: `₱${agent.totalCommission.toLocaleString()}`,
    pending: `₱${agent.pending.toLocaleString()}`,
  }));

  const generateId = () => {
    const maxId = commissions.reduce((max, c) => {
      const num = parseInt(c.id.replace('COM-', ''));
      return num > max ? num : max;
    }, 0);
    return `COM-${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleAddCommission = () => {
    if (!formData.agent || !formData.transaction || !formData.property || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const newCommission: Commission = {
      ...formData,
      id: generateId(),
      paidDate: formData.status === 'Paid' ? formData.paidDate : '-',
    };

    setCommissions([...commissions, newCommission]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditCommission = () => {
    if (!formData.agent || !formData.transaction || !formData.property || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedCommission = {
      ...formData,
      paidDate: formData.status === 'Paid' ? formData.paidDate : '-',
    };

    setCommissions(commissions.map(c =>
      c.id === formData.id ? updatedCommission : c
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteCommission = () => {
    if (selectedCommission) {
      setCommissions(commissions.filter(c => c.id !== selectedCommission.id));
      setIsDeleteDialogOpen(false);
      setSelectedCommission(null);
    }
  };

  const handleMarkAsPaid = (commission: Commission) => {
    const updatedCommission = {
      ...commission,
      status: 'Paid',
      paidDate: new Date().toISOString().split('T')[0],
    };
    setCommissions(commissions.map(c =>
      c.id === commission.id ? updatedCommission : c
    ));
  };

  const openEditDialog = (commission: Commission) => {
    setFormData(commission);
    setSelectedCommission(commission);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      agent: '',
      transaction: '',
      property: '',
      amount: '',
      rate: '5%',
      status: 'Pending',
      paidDate: '',
    });
    setSelectedCommission(null);
  };

  const handleFormChange = (field: keyof Commission, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              value: `₱${commissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + parseFloat(c.amount.replace(/[₱,]/g, '')), 0).toLocaleString()}`, 
              icon: CheckCircle, 
              color: 'bg-green-500' 
            },
            { 
              label: 'Pending Commissions', 
              value: `₱${commissions.filter(c => c.status === 'Pending').reduce((sum, c) => sum + parseFloat(c.amount.replace(/[₱,]/g, '')), 0).toLocaleString()}`, 
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
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {commission.amount}
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
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.agent}
                  onChange={(e) => handleFormChange('agent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Roberto Martinez"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Transaction Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.transaction}
                  onChange={(e) => handleFormChange('transaction', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., TX-2024-045"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.property}
                onChange={(e) => handleFormChange('property', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Vista Verde Subdivision"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., ₱275,000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Rate
                </label>
                <input
                  type="text"
                  value={formData.rate}
                  onChange={(e) => handleFormChange('rate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 5%"
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
                    value={formData.paidDate}
                    onChange={(e) => handleFormChange('paidDate', e.target.value)}
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
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.agent}
                  onChange={(e) => handleFormChange('agent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Transaction Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.transaction}
                  onChange={(e) => handleFormChange('transaction', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.property}
                onChange={(e) => handleFormChange('property', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Commission Rate
                </label>
                <input
                  type="text"
                  value={formData.rate}
                  onChange={(e) => handleFormChange('rate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    value={formData.paidDate}
                    onChange={(e) => handleFormChange('paidDate', e.target.value)}
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
                <p className="text-gray-900">{selectedCommission.id}</p>
                <p className="text-sm text-gray-600 mt-2">Agent</p>
                <p className="text-gray-900">{selectedCommission.agent}</p>
                <p className="text-sm text-gray-600 mt-2">Amount</p>
                <p className="text-gray-900">{selectedCommission.amount}</p>
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
