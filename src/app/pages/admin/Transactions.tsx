import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Search, AlertCircle, CheckCircle, Clock, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

// Database-aligned interfaces
interface Transaction {
  transaction_id: number;
  inquiry_id: number | null;
  client_id: number;
  property_id: number;
  agent_id: number | null;
  transaction_date: string;
  payment_type: 'Cash' | 'Installment';
  total_amount: string;
  // Joined data for display
  client_name?: string;
  property_code?: string;
  agent_name?: string;
  amount_paid?: string;
  balance_remaining?: string;
  payment_status?: string;
}

interface PaymentLog {
  payment_log_id: number;
  transaction_id: number;
  payment_date: string;
  amount: string;
  payment_method: string;
  // For display
  transaction_ref?: string;
}

interface Client {
  client_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  contact_email: string | null;
  contact_number: string | null;
}

interface Property {
  property_id: number;
  property_code: string;
  project_name: string;
}

interface Agent {
  agent_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
}

// Mock data
const mockClients: Client[] = [
  { client_id: 1, first_name: 'Maria', middle_name: 'C.', last_name: 'Santos', contact_email: 'maria.santos@email.com', contact_number: '09171234567' },
  { client_id: 2, first_name: 'John', middle_name: 'D.', last_name: 'Reyes', contact_email: 'john.reyes@email.com', contact_number: '09181234567' },
  { client_id: 3, first_name: 'Ana', middle_name: null, last_name: 'Cruz', contact_email: 'ana.cruz@email.com', contact_number: '09191234567' },
  { client_id: 4, first_name: 'Pedro', middle_name: 'L.', last_name: 'Garcia', contact_email: 'pedro.garcia@email.com', contact_number: '09201234567' },
];

const mockProperties: Property[] = [
  { property_id: 1, property_code: 'VV-BLK1-LOT5', project_name: 'Vista Verde Subdivision' },
  { property_id: 2, property_code: 'GF-FARM-A12', project_name: 'Greenfield Agricultural Estate' },
  { property_id: 3, property_code: 'MBC-FL5-U501', project_name: 'Metro Business Center' },
  { property_id: 4, property_code: 'SBR-LOT-B8', project_name: 'Sunrise Beach Resort' },
  { property_id: 5, property_code: 'IPZ-WARE-W3', project_name: 'Industrial Park Zone' },
];

const mockAgents: Agent[] = [
  { agent_id: 1, first_name: 'Roberto', middle_name: 'A.', last_name: 'Martinez' },
  { agent_id: 2, first_name: 'Sofia', middle_name: 'B.', last_name: 'Reyes' },
  { agent_id: 3, first_name: 'Miguel', middle_name: null, last_name: 'Santos' },
];

const initialTransactions: Transaction[] = [
  {
    transaction_id: 45,
    inquiry_id: null,
    client_id: 1,
    property_id: 1,
    agent_id: 1,
    transaction_date: '2024-06-15',
    payment_type: 'Installment',
    total_amount: '5500000.00',
    client_name: 'Maria C. Santos',
    property_code: 'VV-BLK1-LOT5',
    agent_name: 'Roberto A. Martinez',
    amount_paid: '2200000.00',
    balance_remaining: '3300000.00',
    payment_status: 'On Track',
  },
  {
    transaction_id: 46,
    inquiry_id: null,
    client_id: 2,
    property_id: 3,
    agent_id: 2,
    transaction_date: '2024-08-22',
    payment_type: 'Cash',
    total_amount: '12000000.00',
    client_name: 'John D. Reyes',
    property_code: 'MBC-FL5-U501',
    agent_name: 'Sofia B. Reyes',
    amount_paid: '12000000.00',
    balance_remaining: '0.00',
    payment_status: 'Completed',
  },
  {
    transaction_id: 47,
    inquiry_id: null,
    client_id: 3,
    property_id: 2,
    agent_id: 1,
    transaction_date: '2024-05-10',
    payment_type: 'Installment',
    total_amount: '8500000.00',
    client_name: 'Ana Cruz',
    property_code: 'GF-FARM-A12',
    agent_name: 'Roberto A. Martinez',
    amount_paid: '3400000.00',
    balance_remaining: '5100000.00',
    payment_status: 'Overdue',
  },
  {
    transaction_id: 48,
    inquiry_id: null,
    client_id: 4,
    property_id: 4,
    agent_id: 3,
    transaction_date: '2024-11-05',
    payment_type: 'Cash',
    total_amount: '7200000.00',
    client_name: 'Pedro L. Garcia',
    property_code: 'SBR-LOT-B8',
    agent_name: 'Miguel Santos',
    amount_paid: '7200000.00',
    balance_remaining: '0.00',
    payment_status: 'Completed',
  },
];

const initialPaymentLogs: PaymentLog[] = [
  { payment_log_id: 1, transaction_id: 45, payment_date: '2025-01-03', amount: '500000.00', payment_method: 'Bank Transfer', transaction_ref: 'TX-45' },
  { payment_log_id: 2, transaction_id: 48, payment_date: '2025-01-02', amount: '7200000.00', payment_method: 'Bank Transfer', transaction_ref: 'TX-48' },
  { payment_log_id: 3, transaction_id: 45, payment_date: '2024-12-28', amount: '500000.00', payment_method: 'Cash', transaction_ref: 'TX-45' },
];

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>(initialPaymentLogs);
  const [clients] = useState<Client[]>(mockClients);
  const [properties] = useState<Property[]>(mockProperties);
  const [agents] = useState<Agent[]>(mockAgents);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isDeleteTransactionOpen, setIsDeleteTransactionOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [transactionForm, setTransactionForm] = useState<Partial<Transaction>>({
    client_id: 0,
    property_id: 0,
    agent_id: null,
    transaction_date: new Date().toISOString().split('T')[0],
    payment_type: 'Cash',
    total_amount: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    transaction_id: 0,
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'Cash',
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transaction_id.toString().includes(searchQuery) ||
      transaction.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.property_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getClientName = (clientId: number): string => {
    const client = clients.find(c => c.client_id === clientId);
    if (!client) return 'Unknown';
    return `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}`;
  };

  const getPropertyCode = (propertyId: number): string => {
    return properties.find(p => p.property_id === propertyId)?.property_code || 'Unknown';
  };

  const getAgentName = (agentId: number | null): string => {
    if (!agentId) return 'N/A';
    const agent = agents.find(a => a.agent_id === agentId);
    if (!agent) return 'Unknown';
    return `${agent.first_name} ${agent.middle_name ? agent.middle_name + ' ' : ''}${agent.last_name}`;
  };

  const handleAddTransaction = () => {
    if (!transactionForm.client_id || !transactionForm.property_id || !transactionForm.total_amount) {
      alert('Please fill in all required fields');
      return;
    }

    const newTransaction: Transaction = {
      transaction_id: Math.max(...transactions.map(t => t.transaction_id), 0) + 1,
      inquiry_id: null,
      client_id: transactionForm.client_id!,
      property_id: transactionForm.property_id!,
      agent_id: transactionForm.agent_id || null,
      transaction_date: transactionForm.transaction_date!,
      payment_type: transactionForm.payment_type!,
      total_amount: transactionForm.total_amount!,
      client_name: getClientName(transactionForm.client_id!),
      property_code: getPropertyCode(transactionForm.property_id!),
      agent_name: getAgentName(transactionForm.agent_id || null),
      amount_paid: '0.00',
      balance_remaining: transactionForm.total_amount!,
      payment_status: 'On Track',
    };

    setTransactions([...transactions, newTransaction]);
    setIsAddTransactionOpen(false);
    resetTransactionForm();
  };

  const handleEditTransaction = () => {
    if (!transactionForm.client_id || !transactionForm.property_id || !transactionForm.total_amount) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedTransaction: Transaction = {
      ...selectedTransaction!,
      client_id: transactionForm.client_id!,
      property_id: transactionForm.property_id!,
      agent_id: transactionForm.agent_id || null,
      transaction_date: transactionForm.transaction_date!,
      payment_type: transactionForm.payment_type!,
      total_amount: transactionForm.total_amount!,
      client_name: getClientName(transactionForm.client_id!),
      property_code: getPropertyCode(transactionForm.property_id!),
      agent_name: getAgentName(transactionForm.agent_id || null),
    };

    setTransactions(transactions.map(t =>
      t.transaction_id === selectedTransaction!.transaction_id ? updatedTransaction : t
    ));
    setIsEditTransactionOpen(false);
    resetTransactionForm();
  };

  const handleDeleteTransaction = () => {
    if (selectedTransaction) {
      setTransactions(transactions.filter(t => t.transaction_id !== selectedTransaction.transaction_id));
      setPaymentLogs(paymentLogs.filter(p => p.transaction_id !== selectedTransaction.transaction_id));
      setIsDeleteTransactionOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.transaction_id || !paymentForm.amount || !paymentForm.payment_date) {
      alert('Please fill in all required fields');
      return;
    }

    const transaction = transactions.find(t => t.transaction_id === paymentForm.transaction_id);
    const newPaymentLog: PaymentLog = {
      payment_log_id: Math.max(...paymentLogs.map(p => p.payment_log_id), 0) + 1,
      transaction_id: paymentForm.transaction_id,
      payment_date: paymentForm.payment_date,
      amount: paymentForm.amount,
      payment_method: paymentForm.payment_method,
      transaction_ref: `TX-${paymentForm.transaction_id}`,
    };

    setPaymentLogs([newPaymentLog, ...paymentLogs]);
    
    // Update transaction amounts (simplified logic - in real app this would be calculated from all payment_logs)
    if (transaction) {
      const currentPaid = parseFloat(transaction.amount_paid || '0');
      const newPaid = currentPaid + parseFloat(paymentForm.amount);
      const totalAmount = parseFloat(transaction.total_amount);
      const remaining = totalAmount - newPaid;
      
      setTransactions(transactions.map(t =>
        t.transaction_id === paymentForm.transaction_id
          ? {
              ...t,
              amount_paid: newPaid.toFixed(2),
              balance_remaining: remaining.toFixed(2),
              payment_status: remaining <= 0 ? 'Completed' : 'On Track',
            }
          : t
      ));
    }

    setIsAddPaymentOpen(false);
    resetPaymentForm();
  };

  const openEditDialog = (transaction: Transaction) => {
    setTransactionForm({
      client_id: transaction.client_id,
      property_id: transaction.property_id,
      agent_id: transaction.agent_id,
      transaction_date: transaction.transaction_date,
      payment_type: transaction.payment_type,
      total_amount: transaction.total_amount,
    });
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteTransactionOpen(true);
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      client_id: 0,
      property_id: 0,
      agent_id: null,
      transaction_date: new Date().toISOString().split('T')[0],
      payment_type: 'Cash',
      total_amount: '',
    });
    setSelectedTransaction(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      transaction_id: 0,
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_method: 'Cash',
    });
  };

  const handleTransactionFormChange = (field: string, value: any) => {
    setTransactionForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentFormChange = (field: string, value: any) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Transaction & Payment Tracking</h2>
            <p className="text-gray-600">Monitor all property transactions and payment schedules</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddPaymentOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              Record Payment
            </button>
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Transactions', value: transactions.length.toString(), icon: CheckCircle, color: 'bg-blue-500' },
            { label: 'Active Installments', value: transactions.filter(t => t.payment_status === 'On Track').length.toString(), icon: Clock, color: 'bg-purple-500' },
            { label: 'Overdue Payments', value: transactions.filter(t => t.payment_status === 'Overdue').length.toString(), icon: AlertCircle, color: 'bg-red-500' },
            { label: 'Completed', value: transactions.filter(t => t.payment_status === 'Completed').length.toString(), icon: CheckCircle, color: 'bg-green-500' },
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
              placeholder="Search by transaction ID, client name, or property code..."
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
                    TX ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Property Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Payment Type
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
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      TX-{transaction.transaction_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {transaction.property_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₱{parseFloat(transaction.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.payment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        transaction.payment_status === 'Completed' ? 'bg-green-100 text-green-800' :
                        transaction.payment_status === 'On Track' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.payment_status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                        {transaction.payment_status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        {transaction.payment_status === 'On Track' && <Clock className="w-3 h-3" />}
                        {transaction.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => openEditDialog(transaction)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(transaction)}
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

        {/* Recent Payment Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-900 mb-6">Recent Payment Logs</h3>
          <div className="space-y-4">
            {paymentLogs.map((payment) => (
              <div key={payment.payment_log_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-gray-900">{payment.transaction_ref}</p>
                      <p className="text-sm text-gray-600">{payment.payment_method}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">₱{parseFloat(payment.amount).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{payment.payment_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Create a new property transaction record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.client_id || ''}
                  onChange={(e) => handleTransactionFormChange('client_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.first_name} {client.middle_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.property_id || ''}
                  onChange={(e) => handleTransactionFormChange('property_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.property_code} - {property.project_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Agent
                </label>
                <select
                  value={transactionForm.agent_id || ''}
                  onChange={(e) => handleTransactionFormChange('agent_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Agent (Optional)</option>
                  {agents.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.first_name} {agent.middle_name} {agent.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(e) => handleTransactionFormChange('transaction_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Total Amount (PHP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.total_amount}
                  onChange={(e) => handleTransactionFormChange('total_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 5500000.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.payment_type}
                  onChange={(e) => handleTransactionFormChange('payment_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddTransactionOpen(false);
                resetTransactionForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update transaction details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.client_id || ''}
                  onChange={(e) => handleTransactionFormChange('client_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.first_name} {client.middle_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.property_id || ''}
                  onChange={(e) => handleTransactionFormChange('property_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.property_code} - {property.project_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Agent
                </label>
                <select
                  value={transactionForm.agent_id || ''}
                  onChange={(e) => handleTransactionFormChange('agent_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Agent (Optional)</option>
                  {agents.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.first_name} {agent.middle_name} {agent.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(e) => handleTransactionFormChange('transaction_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Total Amount (PHP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.total_amount}
                  onChange={(e) => handleTransactionFormChange('total_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.payment_type}
                  onChange={(e) => handleTransactionFormChange('payment_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsEditTransactionOpen(false);
                resetTransactionForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTransaction}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={isDeleteTransactionOpen} onOpenChange={setIsDeleteTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone and will also delete all related payment records.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="text-gray-900">TX-{selectedTransaction.transaction_id}</p>
                <p className="text-sm text-gray-600 mt-2">Property</p>
                <p className="text-gray-900">{selectedTransaction.property_code}</p>
                <p className="text-sm text-gray-600 mt-2">Client</p>
                <p className="text-gray-900">{selectedTransaction.client_name}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => {
                setIsDeleteTransactionOpen(false);
                setSelectedTransaction(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTransaction}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a new payment record to the payment log
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Transaction <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentForm.transaction_id || ''}
                onChange={(e) => handlePaymentFormChange('transaction_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Transaction</option>
                {transactions.map(t => (
                  <option key={t.transaction_id} value={t.transaction_id}>
                    TX-{t.transaction_id} - {t.property_code} ({t.client_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => handlePaymentFormChange('payment_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => handlePaymentFormChange('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 500000.00"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddPaymentOpen(false);
                resetPaymentForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPayment}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Record Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
