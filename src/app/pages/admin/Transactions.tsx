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

interface Transaction {
  id: string;
  property: string;
  client: string;
  amount: string;
  paymentType: string;
  installmentStatus: string;
  nextPayment: string;
  paid: string;
  remaining: string;
}

interface Payment {
  date: string;
  transaction: string;
  amount: string;
  method: string;
}

const initialTransactions: Transaction[] = [
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

const initialPayments: Payment[] = [
  { date: '2025-01-03', transaction: 'TX-2024-045', amount: '₱500,000', method: 'Bank Transfer' },
  { date: '2025-01-02', transaction: 'TX-2024-048', amount: '₱7,200,000', method: 'Bank Transfer' },
  { date: '2024-12-28', transaction: 'TX-2024-045', amount: '₱500,000', method: 'Cash' },
];

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isDeleteTransactionOpen, setIsDeleteTransactionOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [transactionForm, setTransactionForm] = useState<Transaction>({
    id: '',
    property: '',
    client: '',
    amount: '',
    paymentType: 'Cash',
    installmentStatus: 'On Track',
    nextPayment: '',
    paid: '₱0',
    remaining: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    transaction: '',
    amount: '',
    method: 'Cash',
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.property.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const generateTransactionId = () => {
    const maxId = transactions.reduce((max, t) => {
      const num = parseInt(t.id.split('-')[2]);
      return num > max ? num : max;
    }, 0);
    return `TX-2024-${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleAddTransaction = () => {
    if (!transactionForm.property || !transactionForm.client || !transactionForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const newTransaction: Transaction = {
      ...transactionForm,
      id: generateTransactionId(),
      remaining: transactionForm.amount,
    };

    setTransactions([...transactions, newTransaction]);
    setIsAddTransactionOpen(false);
    resetTransactionForm();
  };

  const handleEditTransaction = () => {
    if (!transactionForm.property || !transactionForm.client || !transactionForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    setTransactions(transactions.map(t =>
      t.id === transactionForm.id ? transactionForm : t
    ));
    setIsEditTransactionOpen(false);
    resetTransactionForm();
  };

  const handleDeleteTransaction = () => {
    if (selectedTransaction) {
      setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
      // Also delete related payments
      setPayments(payments.filter(p => p.transaction !== selectedTransaction.id));
      setIsDeleteTransactionOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.transaction || !paymentForm.amount || !paymentForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    const newPayment: Payment = { ...paymentForm };
    setPayments([newPayment, ...payments]);
    setIsAddPaymentOpen(false);
    resetPaymentForm();
  };

  const openEditDialog = (transaction: Transaction) => {
    setTransactionForm(transaction);
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteTransactionOpen(true);
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      id: '',
      property: '',
      client: '',
      amount: '',
      paymentType: 'Cash',
      installmentStatus: 'On Track',
      nextPayment: '',
      paid: '₱0',
      remaining: '',
    });
    setSelectedTransaction(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      transaction: '',
      amount: '',
      method: 'Cash',
    });
  };

  const handleTransactionFormChange = (field: keyof Transaction, value: string) => {
    setTransactionForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentFormChange = (field: string, value: string) => {
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
              Add Payment
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
            { label: 'Active Installments', value: transactions.filter(t => t.installmentStatus === 'On Track').length.toString(), icon: Clock, color: 'bg-purple-500' },
            { label: 'Overdue Payments', value: transactions.filter(t => t.installmentStatus === 'Overdue').length.toString(), icon: AlertCircle, color: 'bg-red-500' },
            { label: 'Completed', value: transactions.filter(t => t.installmentStatus === 'Completed').length.toString(), icon: CheckCircle, color: 'bg-green-500' },
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Actions
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
            {payments.map((payment, index) => (
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
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionForm.property}
                  onChange={(e) => handleTransactionFormChange('property', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Vista Verde Subdivision"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionForm.client}
                  onChange={(e) => handleTransactionFormChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Maria Santos"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionForm.amount}
                  onChange={(e) => handleTransactionFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., ₱5,500,000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.paymentType}
                  onChange={(e) => handleTransactionFormChange('paymentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={transactionForm.installmentStatus}
                  onChange={(e) => handleTransactionFormChange('installmentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="On Track">On Track</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Next Payment Date
                </label>
                <input
                  type="date"
                  value={transactionForm.nextPayment}
                  onChange={(e) => handleTransactionFormChange('nextPayment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Amount Paid
                </label>
                <input
                  type="text"
                  value={transactionForm.paid}
                  onChange={(e) => handleTransactionFormChange('paid', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., ₱2,200,000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Remaining Balance
                </label>
                <input
                  type="text"
                  value={transactionForm.remaining}
                  onChange={(e) => handleTransactionFormChange('remaining', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., ₱3,300,000"
                />
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
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionForm.property}
                  onChange={(e) => handleTransactionFormChange('property', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionForm.client}
                  onChange={(e) => handleTransactionFormChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionForm.amount}
                  onChange={(e) => handleTransactionFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.paymentType}
                  onChange={(e) => handleTransactionFormChange('paymentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={transactionForm.installmentStatus}
                  onChange={(e) => handleTransactionFormChange('installmentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="On Track">On Track</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Next Payment Date
                </label>
                <input
                  type="date"
                  value={transactionForm.nextPayment}
                  onChange={(e) => handleTransactionFormChange('nextPayment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Amount Paid
                </label>
                <input
                  type="text"
                  value={transactionForm.paid}
                  onChange={(e) => handleTransactionFormChange('paid', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Remaining Balance
                </label>
                <input
                  type="text"
                  value={transactionForm.remaining}
                  onChange={(e) => handleTransactionFormChange('remaining', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
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
                <p className="text-gray-900">{selectedTransaction.id}</p>
                <p className="text-sm text-gray-600 mt-2">Property</p>
                <p className="text-gray-900">{selectedTransaction.property}</p>
                <p className="text-sm text-gray-600 mt-2">Client</p>
                <p className="text-gray-900">{selectedTransaction.client}</p>
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
              Add a new payment record to the transaction log
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentForm.transaction}
                onChange={(e) => handlePaymentFormChange('transaction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Transaction</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {t.property}</option>
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
                  value={paymentForm.date}
                  onChange={(e) => handlePaymentFormChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => handlePaymentFormChange('method', e.target.value)}
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
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentForm.amount}
                onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., ₱500,000"
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
              Add Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
