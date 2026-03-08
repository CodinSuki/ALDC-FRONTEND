import { useState, useEffect } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Eye, Search, AlertCircle, CheckCircle, Clock, Plus, Edit, Trash2, DollarSign, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Transaction as TransactionType, TransactionStatus, createTransaction, fetchTransactions, updateTransactionStatus, cancelTransaction } from '@/app/services/transactionService';
import { Payment, recordPayment, fetchPaymentSchedule, fetchPayments, createPaymentSchedule, type InstallmentFrequency } from '@/app/services/paymentService';

// Enhanced interfaces with API data
interface Transaction extends TransactionType {
  // Joined data for display
  client_name?: string;
  property_code?: string;
  project_name?: string;
  agent_name?: string;
  paymentStatus?: 'On Track' | 'Overdue' | 'Completed';
}

interface PaymentLog extends Payment {
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

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentsByTransaction, setPaymentsByTransaction] = useState<Record<number, PaymentLog[]>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isDeleteTransactionOpen, setIsDeleteTransactionOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'payments'>('overview');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [lookupsLoaded, setLookupsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  const [transactionForm, setTransactionForm] = useState<Partial<Transaction>>({
    buyerclientid: 0,
    propertyid: 0,
    negotiatedprice: 0,
    transactionstatus: 'Draft',
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentscheduleid: 0,
    paymentdate: new Date().toISOString().split('T')[0],
    amountpaid: '',
    paymentmethod: 'Cash' as const,
    paymentstatus: 'Confirmed' as const,
  });

  const [paymentScheduleInfo, setPaymentScheduleInfo] = useState<{
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
  } | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    totalAmount: 0,
    installmentFrequency: 'Monthly' as InstallmentFrequency,
    installmentCount: 12,
    startDate: new Date().toISOString().split('T')[0],
  });

  const loadLookups = async () => {
    const [clientsRes, propertiesRes] = await Promise.all([
      fetch('/api/admin/clients', { method: 'GET', credentials: 'include' }),
      fetch('/api/admin/properties?action=load', { method: 'GET', credentials: 'include' }),
    ]);

    const clientsPayload = (await clientsRes.json().catch(() => ({}))) as {
      error?: string;
      items?: Array<{
        clientId: number;
        fullName: string;
        contact: string;
        email: string;
      }>;
    };

    const propertiesPayload = (await propertiesRes.json().catch(() => ({}))) as {
      error?: string;
      properties?: Array<{
        propertyid: number;
        propertyname?: string;
        project_name?: string;
      }>;
    };

    if (!clientsRes.ok) {
      throw new Error(clientsPayload.error || 'Failed to load clients');
    }

    if (!propertiesRes.ok) {
      throw new Error(propertiesPayload.error || 'Failed to load properties');
    }

    const normalizedClients: Client[] = (clientsPayload.items || []).map((item) => {
      const [first = '', ...rest] = item.fullName.split(' ');
      const last = rest.length > 0 ? rest[rest.length - 1] : '';
      const middleParts = rest.slice(0, -1);
      return {
        client_id: item.clientId,
        first_name: first,
        middle_name: middleParts.length > 0 ? middleParts.join(' ') : null,
        last_name: last,
        contact_email: item.email || null,
        contact_number: item.contact || null,
      };
    });

    const normalizedProperties: Property[] = (propertiesPayload.properties || []).map((item) => ({
      property_id: item.propertyid,
      property_code: item.propertyname || `Property #${item.propertyid}`,
      project_name: item.project_name || 'Unknown Project',
    }));

    setClients(normalizedClients);
    setProperties(normalizedProperties);
  };

  // Fetch clients and properties lookup data first
  useEffect(() => {
    const load = async () => {
      try {
        await loadLookups();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lookup data');
      } finally {
        setLookupsLoaded(true);
      }
    };

    load();
  }, []);

  // Fetch transactions after lookups are available
  useEffect(() => {
    if (!lookupsLoaded) {
      return;
    }

    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTransactions();
        const enriched = await Promise.all(data.map(async (tx) => {
          const client = clients.find(c => c.client_id === tx.buyerclientid);
          const property = properties.find(p => p.property_id === tx.propertyid);
          
          // Fetch payment schedule and summary for this transaction
          const schedule = await fetchPaymentSchedule(tx.transactionid);
          let paymentStatus: 'On Track' | 'Overdue' | 'Completed' = 'On Track';
          if (tx.transactionstatus === 'Completed') {
            paymentStatus = 'Completed';
          }
          
          const paymentLogs = schedule ? await fetchPayments(schedule.paymentscheduleid) : [];
          setPaymentsByTransaction(prev => ({
            ...prev,
            [tx.transactionid]: paymentLogs.map(p => ({
              ...p,
              transaction_ref: `TX-${tx.transactionid}`
            }))
          }));
          
          return {
            ...tx,
            client_name: client ? `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}` : 'Unknown',
            property_code: property?.property_code || 'Unknown',
            project_name: property?.project_name || 'Unknown',
            paymentStatus,
          } as Transaction;
        }));
        setTransactions(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, [clients, properties, lookupsLoaded]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transactionid.toString().includes(searchQuery) ||
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

  const handleAddTransaction = async () => {
    if (!transactionForm.buyerclientid || !transactionForm.propertyid || !transactionForm.negotiatedprice) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const newTx = await createTransaction({
        propertyId: transactionForm.propertyid,
        buyerClientId: transactionForm.buyerclientid,
        negotiatedPrice: transactionForm.negotiatedprice,
        transactionStatus: 'Draft',
      });
      
      const enrichedTx = {
        ...newTx,
        client_name: getClientName(newTx.buyerclientid),
        property_code: getPropertyCode(newTx.propertyid),
        project_name: properties.find(p => p.property_id === newTx.propertyid)?.project_name || 'Unknown',
        paymentStatus: 'On Track' as const,
      };
      
      setTransactions([...transactions, enrichedTx]);
      setIsAddTransactionOpen(false);
      resetTransactionForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!transactionForm.buyerclientid || !transactionForm.propertyid || !transactionForm.negotiatedprice) {
      setError('Please fill in all required fields');
      return;
    }

    if (!selectedTransaction) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateTransactionStatus({
        transactionId: selectedTransaction.transactionid,
        negotiatedPrice: transactionForm.negotiatedprice,
        transactionStatus: (transactionForm.transactionstatus as TransactionStatus) || 'Draft',
      });
      
      setTransactions(transactions.map(t =>
        t.transactionid === selectedTransaction.transactionid
          ? {
              ...updated,
              client_name: getClientName(updated.buyerclientid),
              property_code: getPropertyCode(updated.propertyid),
              project_name: properties.find(p => p.property_id === updated.propertyid)?.project_name || 'Unknown',
              paymentStatus: updated.transactionstatus === 'Completed' ? 'Completed' : 'On Track',
            }
          : t
      ));
      setIsEditTransactionOpen(false);
      resetTransactionForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    setIsSaving(true);
    setError(null);
    try {
      await cancelTransaction(selectedTransaction.transactionid);
      setTransactions(transactions.filter(t => t.transactionid !== selectedTransaction.transactionid));
      setPaymentsByTransaction(prev => {
        const newPayments = { ...prev };
        delete newPayments[selectedTransaction.transactionid];
        return newPayments;
      });
      setIsDeleteTransactionOpen(false);
      setSelectedTransaction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.paymentscheduleid || !paymentForm.amountpaid || !paymentForm.paymentdate) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const newPayment = await recordPayment({
        paymentScheduleId: paymentForm.paymentscheduleid,
        paymentDate: paymentForm.paymentdate,
        amountPaid: parseFloat(paymentForm.amountpaid),
        paymentMethod: paymentForm.paymentmethod,
        paymentStatus: 'Confirmed',
      });
      
      // Update local payment logs
      setPaymentsByTransaction(prev => ({
        ...prev,
        [selectedTransaction?.transactionid || 0]: [
          ...(prev[selectedTransaction?.transactionid || 0] || []),
          {
            ...newPayment,
            transaction_ref: `TX-${selectedTransaction?.transactionid}`
          }
        ]
      }));
      
      setIsAddPaymentOpen(false);
      setSuccessMessage(`Payment of PHP ${parseFloat(paymentForm.amountpaid).toLocaleString()} recorded successfully for ${selectedTransaction?.property_code}`);
      resetPaymentForm();
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (transaction: Transaction) => {
    setTransactionForm({
      buyerclientid: transaction.buyerclientid,
      propertyid: transaction.propertyid,
      negotiatedprice: transaction.negotiatedprice,
      transactionstatus: transaction.transactionstatus,
    });
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const openTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailOpen(true);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteTransactionOpen(true);
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      buyerclientid: 0,
      propertyid: 0,
      negotiatedprice: 0,
      transactionstatus: 'Draft',
    });
    setSelectedTransaction(null);
    setError(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      paymentscheduleid: 0,
      paymentdate: new Date().toISOString().split('T')[0],
      amountpaid: '',
      paymentmethod: 'Cash',
      paymentstatus: 'Confirmed',
    });
    setPaymentScheduleInfo(null);
    setError(null);
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      totalAmount: 0,
      installmentFrequency: 'Monthly',
      installmentCount: 12,
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const openRecordPaymentDialog = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setError(null);
    setLoadingSchedule(true);

    try {
      const schedule = await fetchPaymentSchedule(transaction.transactionid);
      
      if (!schedule) {
        // Automatically open create schedule dialog if none exists
        openCreateScheduleDialog(transaction);
        return;
      }
      
      // Fetch existing payments to calculate totals
      const payments = await fetchPayments(schedule.paymentscheduleid);
      const totalPaid = payments
        .filter(p => p.paymentstatus === 'Confirmed')
        .reduce((sum, p) => sum + parseFloat(String(p.amountpaid)), 0);
      
      setPaymentForm(prev => ({
        ...prev,
        paymentscheduleid: schedule.paymentscheduleid,
      }));
      
      setPaymentScheduleInfo({
        totalAmount: parseFloat(String(schedule.totalamount)),
        totalPaid,
        remainingBalance: parseFloat(String(schedule.totalamount)) - totalPaid,
      });
      
      setIsAddPaymentOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment schedule');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const openCreateScheduleDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setScheduleForm({
      totalAmount: transaction.negotiatedprice,
      installmentFrequency: 'Monthly',
      installmentCount: 12,
      startDate: new Date().toISOString().split('T')[0],
    });
    setIsCreateScheduleOpen(true);
  };

  const handleCreatePaymentSchedule = async () => {
    if (!selectedTransaction || !scheduleForm.totalAmount || !scheduleForm.installmentCount) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await createPaymentSchedule({
        transactionId: selectedTransaction.transactionid,
        totalAmount: scheduleForm.totalAmount,
        installmentFrequency: scheduleForm.installmentFrequency,
        installmentCount: scheduleForm.installmentCount,
        startDate: scheduleForm.startDate,
      });
      
      setSuccessMessage(`Payment schedule created successfully for ${selectedTransaction.property_code}. You can now record payments.`);
      setIsCreateScheduleOpen(false);
      resetScheduleForm();
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Automatically open the payment recording dialog after schedule is created
      setTimeout(() => {
        openRecordPaymentDialog(selectedTransaction);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransactionFormChange = (field: string, value: any) => {
    setTransactionForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentFormChange = (field: string, value: any) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  // Component: payments list scoped to a single transaction
  function TransactionPayments({ transactionId }: { transactionId: number }) {
    const paymentsForTx = paymentsByTransaction[transactionId] || [];

    return (
      <div className="space-y-4">
        {paymentsForTx.length === 0 ? (
          <div className="text-sm text-gray-500">No payments recorded for this transaction.</div>
        ) : (
          paymentsForTx.map(p => (
            <div key={p.paymentid} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="text-sm font-medium">{p.transaction_ref || `TX-${transactionId}`}</div>
                <div className="text-xs text-gray-600">{p.paymentmethod} • {p.paymentdate}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">₱{parseFloat(String(p.amountpaid)).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Transaction & Payment Tracking</h2>
            <p className="text-gray-600">Monitor all property transactions and payment schedules</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              <span>Loading transactions...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss success"
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Transaction & Payment Tracking</h2>
            <p className="text-gray-600">Monitor all property transactions and payment schedules</p>
          </div>
          <button
            onClick={() => {
              resetTransactionForm();
              setIsAddTransactionOpen(true);
            }}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Transactions', value: transactions.length.toString(), icon: CheckCircle, color: 'bg-blue-500' },
            { label: 'Active Installments', value: transactions.filter(t => t.transactionstatus === 'Ongoing').length.toString(), icon: Clock, color: 'bg-purple-500' },
            { label: 'Draft Transactions', value: transactions.filter(t => t.transactionstatus === 'Draft').length.toString(), icon: AlertCircle, color: 'bg-yellow-500' },
            { label: 'Completed', value: transactions.filter(t => t.transactionstatus === 'Completed').length.toString(), icon: CheckCircle, color: 'bg-green-500' },
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
            <h3 className="text-gray-900">Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">TX ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Negotiated Price</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Payments</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <p className="text-gray-600 font-medium">There are no transactions yet.</p>
                      <p className="text-gray-500 text-sm mt-1">New sales transactions will appear here once they're created.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const paymentCount = paymentsByTransaction[transaction.transactionid]?.length || 0;
                    return (
                    <tr key={transaction.transactionid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TX-{transaction.transactionid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{transaction.property_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{transaction.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">₱{parseFloat(String(transaction.negotiatedprice)).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {paymentCount > 0 ? (
                          <span className="text-blue-600 font-medium">{paymentCount} payment{paymentCount !== 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-gray-400">No payments</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          transaction.transactionstatus === 'Completed' ? 'bg-green-100 text-green-800' :
                          transaction.transactionstatus === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                          transaction.transactionstatus === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.transactionstatus === 'Completed' && <CheckCircle className="w-3 h-3" />}
                          {transaction.transactionstatus === 'Ongoing' && <Clock className="w-3 h-3" />}
                          {transaction.transactionstatus === 'Draft' && <AlertCircle className="w-3 h-3" />}
                          {transaction.transactionstatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => openTransactionDetail(transaction)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-800 mr-3 disabled:opacity-50"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRecordPaymentDialog(transaction)}
                          disabled={isSaving || loadingSchedule}
                          className="text-blue-600 hover:text-blue-800 mr-3 disabled:opacity-50"
                          title="Record payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditDialog(transaction)}
                          disabled={isSaving}
                          className="text-purple-600 hover:text-purple-800 mr-3 disabled:opacity-50"
                          title="Edit transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(transaction)}
                          disabled={isSaving}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Cancel transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      
      {/* Transaction Detail Dialog */}
      <Dialog open={isTransactionDetailOpen} onOpenChange={setIsTransactionDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>TX-{selectedTransaction?.transactionid}</DialogDescription>
          </DialogHeader>

          <div className="pt-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDetailTab('overview')}
                className={`px-4 py-2 rounded-lg ${detailTab === 'overview' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >Overview</button>
              <button
                onClick={() => setDetailTab('payments')}
                className={`px-4 py-2 rounded-lg ${detailTab === 'payments' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >Payments</button>
            </div>

            {detailTab === 'overview' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="text-gray-900">{selectedTransaction?.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="text-gray-900">{selectedTransaction?.property_code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Negotiated Price</p>
                    <p className="text-gray-900">₱{selectedTransaction ? parseFloat(String(selectedTransaction.negotiatedprice)).toLocaleString() : '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-gray-900">{selectedTransaction?.transactionstatus}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {selectedTransaction && <TransactionPayments transactionId={selectedTransaction.transactionid} />}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (selectedTransaction) {
                        setPaymentForm(prev => ({ ...prev, paymentscheduleid: selectedTransaction.transactionid }));
                        setIsAddPaymentOpen(true);
                      }
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >Record Payment</button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <button onClick={() => setIsTransactionDetailOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Transaction</DialogTitle>
            <DialogDescription>Create a new property transaction record</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={transactionForm.buyerclientid || ''}
                  onChange={(e) => handleTransactionFormChange('buyerclientid', parseInt(e.target.value))}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
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
                  value={transactionForm.propertyid || ''}
                  onChange={(e) => handleTransactionFormChange('propertyid', parseInt(e.target.value))}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
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

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Negotiated Price (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={transactionForm.negotiatedprice || ''}
                onChange={(e) => handleTransactionFormChange('negotiatedprice', parseFloat(e.target.value))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="e.g., 5500000.00"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddTransactionOpen(false);
                resetTransactionForm();
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Create Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Update transaction status and details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={transactionForm.transactionstatus || ''}
                onChange={(e) => handleTransactionFormChange('transactionstatus', e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Draft">Draft</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Negotiated Price (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={transactionForm.negotiatedprice || ''}
                onChange={(e) => handleTransactionFormChange('negotiatedprice', parseFloat(e.target.value))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Note: When status is changed to "Completed", a commission will be automatically generated for the assigned staff.
              </p>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsEditTransactionOpen(false);
                resetTransactionForm();
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTransaction}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={isDeleteTransactionOpen} onOpenChange={setIsDeleteTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="text-gray-900">TX-{selectedTransaction.transactionid}</p>
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
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTransaction}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Cancel Transaction
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedTransaction?.property_code} - {selectedTransaction?.client_name}
            </DialogDescription>
          </DialogHeader>

          {loadingSchedule ? (
            <div className="py-8 flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <span>Loading payment schedule...</span>
            </div>
          ) : (
          <div className="space-y-4 py-4">
            {/* Transaction Context */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Transaction ID</p>
                  <p className="font-medium text-gray-900">TX-{selectedTransaction?.transactionid}</p>
                </div>
                <div>
                  <p className="text-gray-600">Property</p>
                  <p className="font-medium text-gray-900">{selectedTransaction?.property_code}</p>
                </div>
                <div>
                  <p className="text-gray-600">Client</p>
                  <p className="font-medium text-gray-900">{selectedTransaction?.client_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Price</p>
                  <p className="font-medium text-gray-900">₱{selectedTransaction ? parseFloat(String(selectedTransaction.negotiatedprice)).toLocaleString() : '0'}</p>
                </div>
                {paymentScheduleInfo && (
                  <>
                    <div>
                      <p className="text-gray-600">Total Paid</p>
                      <p className="font-medium text-green-600">₱{paymentScheduleInfo.totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining Balance</p>
                      <p className="font-medium text-orange-600">₱{paymentScheduleInfo.remainingBalance.toLocaleString()}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentdate}
                  onChange={(e) => handlePaymentFormChange('paymentdate', e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentForm.paymentmethod}
                  onChange={(e) => handlePaymentFormChange('paymentmethod', e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Online Payment">Online Payment</option>
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
                min="0"
                max={paymentScheduleInfo?.remainingBalance}
                value={paymentForm.amountpaid}
                onChange={(e) => handlePaymentFormChange('amountpaid', e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="e.g., 500000.00"
              />
              {paymentScheduleInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ₱{paymentScheduleInfo.remainingBalance.toLocaleString()} (remaining balance)
                </p>
              )}
            </div>
          </div>
          )}

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddPaymentOpen(false);
                resetPaymentForm();
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPayment}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Record Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Schedule Dialog */}
      <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payment Schedule</DialogTitle>
            <DialogDescription>
              Set up a payment schedule for {selectedTransaction?.property_code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Transaction ID</p>
                  <p className="font-medium text-gray-900">TX-{selectedTransaction?.transactionid}</p>
                </div>
                <div>
                  <p className="text-gray-600">Property</p>
                  <p className="font-medium text-gray-900">{selectedTransaction?.property_code}</p>
                </div>
                <div>
                  <p className="text-gray-600">Client</p>
                  <p className="font-medium text-gray-900">{selectedTransaction?.client_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transaction Amount</p>
                  <p className="font-medium text-gray-900">₱{selectedTransaction ? parseFloat(String(selectedTransaction.negotiatedprice)).toLocaleString() : '0'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Total Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={scheduleForm.totalAmount}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">This is the total amount to be paid through the payment schedule</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Installment Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={scheduleForm.installmentFrequency}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, installmentFrequency: e.target.value as InstallmentFrequency }))}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Annual">Annual</option>
                  <option value="One-Time">One-Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Number of Installments <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={scheduleForm.installmentCount}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, installmentCount: parseInt(e.target.value) }))}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={scheduleForm.startDate}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Installment Amount:</strong> ₱{(scheduleForm.totalAmount / scheduleForm.installmentCount).toLocaleString(undefined, { maximumFractionDigits: 2 })} per {scheduleForm.installmentFrequency.toLowerCase()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsCreateScheduleOpen(false);
                resetScheduleForm();
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePaymentSchedule}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Create Schedule
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
