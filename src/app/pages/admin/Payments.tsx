import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Eye, Search, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

// Database-aligned interfaces
interface PaymentLog {
  log_id: number;
  transaction_id: number;
  payment_date: string;
  amount_paid: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Installment';
  receipt_number: string;
  // Joined data for display
  client_name?: string;
  property_code?: string;
}

interface PaymentSchedule {
  schedule_id: number;
  transaction_id: number;
  due_date: string;
  amount_due: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  // Joined data for display
  client_name?: string;
  property_code?: string;
}

// Mock data
const initialPaymentLogs: PaymentLog[] = [
  {
    log_id: 1,
    transaction_id: 1,
    payment_date: '2026-01-15',
    amount_paid: '500000.00',
    payment_method: 'Bank Transfer',
    receipt_number: 'RCP-2026-001',
    client_name: 'Juan Santos',
    property_code: 'VV-BLK1-LOT5',
  },
  {
    log_id: 2,
    transaction_id: 2,
    payment_date: '2026-01-14',
    amount_paid: '1000000.00',
    payment_method: 'Cash',
    receipt_number: 'RCP-2026-002',
    client_name: 'Carlos Reyes',
    property_code: 'MBC-FL5-U501',
  },
  {
    log_id: 3,
    transaction_id: 3,
    payment_date: '2026-01-13',
    amount_paid: '250000.00',
    payment_method: 'Installment',
    receipt_number: 'RCP-2026-003',
    client_name: 'Maria Garcia',
    property_code: 'GF-FARM-A12',
  },
];

const initialPaymentSchedules: PaymentSchedule[] = [
  {
    schedule_id: 1,
    transaction_id: 1,
    due_date: '2026-02-15',
    amount_due: '500000.00',
    status: 'Pending',
    client_name: 'Juan Santos',
    property_code: 'VV-BLK1-LOT5',
  },
  {
    schedule_id: 2,
    transaction_id: 3,
    due_date: '2026-02-13',
    amount_due: '250000.00',
    status: 'Pending',
    client_name: 'Maria Garcia',
    property_code: 'GF-FARM-A12',
  },
  {
    schedule_id: 3,
    transaction_id: 1,
    due_date: '2026-01-10',
    amount_due: '500000.00',
    status: 'Overdue',
    client_name: 'Juan Santos',
    property_code: 'VV-BLK1-LOT5',
  },
  {
    schedule_id: 4,
    transaction_id: 2,
    due_date: '2026-01-14',
    amount_due: '1000000.00',
    status: 'Paid',
    client_name: 'Carlos Reyes',
    property_code: 'MBC-FL5-U501',
  },
];

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState<'logs' | 'schedules'>('logs');
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>(initialPaymentLogs);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>(initialPaymentSchedules);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);
  const [isViewLogDialogOpen, setIsViewLogDialogOpen] = useState(false);
  const [selectedPaymentLog, setSelectedPaymentLog] = useState<PaymentLog | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentLog>>({
    transaction_id: 0,
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: '',
    payment_method: 'Cash',
    receipt_number: '',
  });

  const filteredPaymentLogs = paymentLogs.filter(log => {
    const matchesSearch = 
      log.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.property_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.receipt_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = filterMethod === 'All' || log.payment_method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const filteredPaymentSchedules = paymentSchedules.filter(schedule => {
    const matchesSearch = 
      schedule.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.property_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || schedule.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddPaymentLog = () => {
    if (!formData.transaction_id || !formData.payment_date || !formData.amount_paid || !formData.receipt_number) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newLog: PaymentLog = {
      log_id: Math.max(...paymentLogs.map(l => l.log_id), 0) + 1,
      transaction_id: formData.transaction_id!,
      payment_date: formData.payment_date!,
      amount_paid: formData.amount_paid!,
      payment_method: formData.payment_method || 'Cash',
      receipt_number: formData.receipt_number!,
      client_name: 'Client Name', // Would be fetched from transaction in real app
      property_code: 'PROP-CODE', // Would be fetched from transaction in real app
    };
    
    setPaymentLogs([...paymentLogs, newLog]);
    setIsAddLogDialogOpen(false);
    resetForm();
  };

  const handleUpdateScheduleStatus = (scheduleId: number, newStatus: 'Pending' | 'Paid' | 'Overdue') => {
    setPaymentSchedules(paymentSchedules.map(s => 
      s.schedule_id === scheduleId 
        ? { ...s, status: newStatus }
        : s
    ));
  };

  const openViewLogDialog = (log: PaymentLog) => {
    setSelectedPaymentLog(log);
    setIsViewLogDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      transaction_id: 0,
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: '',
      payment_method: 'Cash',
      receipt_number: '',
    });
  };

  const handleFormChange = (field: keyof PaymentLog, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Payments Management</h2>
            <p className="text-gray-600">Track payment logs and schedules</p>
          </div>
          {activeTab === 'logs' && (
            <button 
              onClick={() => setIsAddLogDialogOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Record Payment
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'logs'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Payment Logs
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'schedules'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Payment Schedules
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'logs' ? "Search by client, property, or receipt..." : "Search by client or property..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            {activeTab === 'logs' ? (
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Installment">Installment</option>
              </select>
            ) : (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'logs' ? (
          /* Payment Logs Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Log ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPaymentLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{log.log_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {log.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.property_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(log.payment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ₱{parseFloat(log.amount_paid).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          log.payment_method === 'Cash' ? 'bg-green-100 text-green-800' :
                          log.payment_method === 'Bank Transfer' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {log.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.receipt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => openViewLogDialog(log)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPaymentLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No payment logs found matching your criteria
              </div>
            )}
          </div>
        ) : (
          /* Payment Schedules Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Schedule ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Amount Due
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
                  {filteredPaymentSchedules.map((schedule) => (
                    <tr key={schedule.schedule_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{schedule.schedule_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {schedule.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.property_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(schedule.due_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ₱{parseFloat(schedule.amount_due).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          schedule.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          schedule.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {schedule.status !== 'Paid' && (
                          <button 
                            onClick={() => handleUpdateScheduleStatus(schedule.schedule_id, 'Paid')}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPaymentSchedules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No payment schedules found matching your criteria
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Payment Log Dialog */}
      <Dialog open={isViewLogDialogOpen} onOpenChange={setIsViewLogDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Log Details</DialogTitle>
            <DialogDescription>
              Log #{selectedPaymentLog?.log_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPaymentLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Client Name</label>
                  <p className="text-gray-900">{selectedPaymentLog.client_name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Property Code</label>
                  <p className="text-gray-900">{selectedPaymentLog.property_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Payment Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedPaymentLog.payment_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount Paid</label>
                  <p className="text-gray-900">₱{parseFloat(selectedPaymentLog.amount_paid).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Payment Method</label>
                  <p className="text-gray-900">{selectedPaymentLog.payment_method}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Receipt Number</label>
                  <p className="text-gray-900">{selectedPaymentLog.receipt_number}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setIsViewLogDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Log Dialog */}
      <Dialog open={isAddLogDialogOpen} onOpenChange={setIsAddLogDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new payment received
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.transaction_id || ''}
                onChange={(e) => handleFormChange('transaction_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter transaction ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleFormChange('payment_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Amount Paid <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount_paid}
                  onChange={(e) => handleFormChange('amount_paid', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleFormChange('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Receipt Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => handleFormChange('receipt_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="RCP-2026-XXX"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddLogDialogOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPaymentLog}
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
