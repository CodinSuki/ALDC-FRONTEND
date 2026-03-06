import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import AdminLayout from '@/app/components/AdminLayout';
import { Search, AlertCircle, CheckCircle, Clock, Plus, DollarSign, Loader, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Commission,
  CommissionPayout,
  generateCommission,
  fetchCommissions,
  recordCommissionPayout,
  fetchCommissionPayouts,
} from '@/app/services/commissionService';
import { fetchTransactions } from '@/app/services/transactionService';

// Enhanced interfaces
interface EnhancedCommission extends Commission {
  transactionCode?: string;
  staffName?: string;
  clientName?: string;
  payoutStatus?: 'Fully Paid' | 'Partial' | 'Pending';
  totalPaidOut?: number;
}

interface PayoutRecord extends CommissionPayout {
  commissionRef?: string;
}

interface Staff {
  staffid: number;
  firstname: string;
  middlename?: string;
  lastname: string;
}

interface Client {
  client_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
}

interface Transaction {
  transactionid: number;
  propertyid: number;
  buyerclientid: number;
  negotiatedprice: number;
  transactionstatus: string;
}

// Mock data for staff, clients, properties
const mockStaff: Staff[] = [
  { staffid: 1, firstname: 'Miguel', middlename: 'A.', lastname: 'Santos' },
  { staffid: 2, firstname: 'Sofia', middlename: 'B.', lastname: 'Reyes' },
  { staffid: 3, firstname: 'Roberto', middlename: 'C.', lastname: 'Martinez' },
];

const mockClients: Client[] = [
  { client_id: 1, first_name: 'Maria', middle_name: 'C.', last_name: 'Santos' },
  { client_id: 2, first_name: 'John', middle_name: 'D.', last_name: 'Reyes' },
  { client_id: 3, first_name: 'Ana', middle_name: undefined, last_name: 'Cruz' },
];

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<EnhancedCommission[]>([]);
  const [payoutsByCommission, setPayoutsByCommission] = useState<Record<number, PayoutRecord[]>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'Pending' | 'Released'>('all');
  
  // Dialog states
  const [isGenerateCommissionOpen, setIsGenerateCommissionOpen] = useState(false);
  const [isRecordPayoutOpen, setIsRecordPayoutOpen] = useState(false);
  const [isCommissionDetailOpen, setIsCommissionDetailOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<EnhancedCommission | null>(null);
  
  // Form states
  const [generateForm, setGenerateForm] = useState({
    transactionId: 0,
    staffId: 0,
    commissionRate: 0.05,
  });

  const [payoutForm, setPayoutForm] = useState({
    commissionId: 0,
    payoutAmount: '',
    payoutDate: new Date().toISOString().split('T')[0],
    payoutMethod: 'Bank Transfer',
    payoutNotes: '',
  });

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch commissions and transactions on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [commissionsData, transactionsData] = await Promise.all([
          fetchCommissions(),
          fetchTransactions(),
        ]);
        
        setTransactions(transactionsData);
        
        // Enrich commissions with related data
        const enriched = await Promise.all(commissionsData.map(async (comm) => {
          const tx = transactionsData.find(t => t.transactionid === comm.transactionid);
          const staff = mockStaff.find(s => s.staffid === comm.staffid);
          const client = mockClients.find(c => c.client_id === tx?.buyerclientid);
          
          // Fetch payouts for this commission
          const payouts = await fetchCommissionPayouts(comm.commissionid);
          const totalPaidOut = payouts.reduce((sum, p) => sum + parseFloat(String(p.payoutamount)), 0);
          
          setPayoutsByCommission(prev => ({
            ...prev,
            [comm.commissionid]: payouts.map(p => ({
              ...p,
              commissionRef: `COMM-${comm.commissionid}`
            }))
          }));
          
          let payoutStatus: 'Fully Paid' | 'Partial' | 'Pending' = 'Pending';
          if (totalPaidOut >= comm.commissionamount) payoutStatus = 'Fully Paid';
          else if (totalPaidOut > 0) payoutStatus = 'Partial';
          
          return {
            ...comm,
            transactionCode: `TX-${comm.transactionid}`,
            staffName: staff ? `${staff.firstname} ${staff.middlename || ''} ${staff.lastname}`.trim() : 'Unknown',
            clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
            payoutStatus,
            totalPaidOut,
          } as EnhancedCommission;
        }));
        
        setCommissions(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load commissions');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredCommissions = commissions.filter(comm => {
    const matchesSearch = 
      comm.commissionid.toString().includes(searchQuery) ||
      comm.staffName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.transactionCode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatusFilter === 'all' || comm.commissionstatus === selectedStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleGenerateCommission = async () => {
    if (!generateForm.transactionId || !generateForm.staffId || generateForm.commissionRate <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const newComm = await generateCommission({
        transactionId: generateForm.transactionId,
        staffId: generateForm.staffId,
        commissionRate: generateForm.commissionRate,
      });
      
      const tx = transactions.find(t => t.transactionid === newComm.transactionid);
      const staff = mockStaff.find(s => s.staffid === newComm.staffid);
      const client = mockClients.find(c => c.client_id === tx?.buyerclientid);
      
      const enriched: EnhancedCommission = {
        ...newComm,
        transactionCode: `TX-${newComm.transactionid}`,
        staffName: staff ? `${staff.firstname} ${staff.lastname}` : 'Unknown',
        clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
        payoutStatus: 'Pending',
        totalPaidOut: 0,
      };
      
      setCommissions([...commissions, enriched]);
      setIsGenerateCommissionOpen(false);
      setGenerateForm({ transactionId: 0, staffId: 0, commissionRate: 0.05 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate commission');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordPayout = async () => {
    if (!payoutForm.commissionId || !payoutForm.payoutAmount || !payoutForm.payoutDate) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const newPayout = await recordCommissionPayout({
        commissionId: payoutForm.commissionId,
        payoutAmount: parseFloat(payoutForm.payoutAmount),
        payoutDate: payoutForm.payoutDate,
        payoutMethod: payoutForm.payoutMethod,
        payoutNotes: payoutForm.payoutNotes || undefined,
      });
      
      // Update payouts list
      setPayoutsByCommission(prev => ({
        ...prev,
        [payoutForm.commissionId]: [
          ...(prev[payoutForm.commissionId] || []),
          {
            ...newPayout,
            commissionRef: `COMM-${payoutForm.commissionId}`
          }
        ]
      }));
      
      // Update commission status if fully paid
      const commission = commissions.find(c => c.commissionid === payoutForm.commissionId);
      if (commission) {
        const newTotalPaid = (commission.totalPaidOut || 0) + parseFloat(payoutForm.payoutAmount);
        const newStatus = newTotalPaid >= commission.commissionamount ? 'Released' : commission.commissionstatus;
        
        setCommissions(commissions.map(c =>
          c.commissionid === payoutForm.commissionId
            ? {
                ...c,
                commissionstatus: newStatus as any,
                totalPaidOut: newTotalPaid,
                payoutStatus: newTotalPaid >= c.commissionamount ? 'Fully Paid' : 'Partial',
              }
            : c
        ));
      }
      
      setIsRecordPayoutOpen(false);
      setPayoutForm({
        commissionId: 0,
        payoutAmount: '',
        payoutDate: new Date().toISOString().split('T')[0],
        payoutMethod: 'Bank Transfer',
        payoutNotes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCommissionDetail = (commission: EnhancedCommission) => {
    setSelectedCommission(commission);
    setIsCommissionDetailOpen(true);
  };

  const handleOpenPayoutDialog = (commission: EnhancedCommission) => {
    setPayoutForm(prev => ({
      ...prev,
      commissionId: commission.commissionid,
    }));
    setSelectedCommission(commission);
    setIsRecordPayoutOpen(true);
  };

  // Component: Payouts list for a commission
  function CommissionPayouts({ commissionId }: { commissionId: number }) {
    const payouts = payoutsByCommission[commissionId] || [];

    return (
      <div className="space-y-3">
        {payouts.length === 0 ? (
          <div className="text-sm text-gray-500">No payouts recorded yet.</div>
        ) : (
          payouts.map(payout => (
            <div key={payout.commissionpayoutid} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="text-sm font-medium">{payout.payoutmethod}</div>
                <div className="text-xs text-gray-600">{payout.payoutdate}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">₱{parseFloat(String(payout.payoutamount)).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  if (isLoading && commissions.length === 0 && transactions.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Commission Management</h2>
            <p className="text-gray-600">Track and manage commission generation and payouts</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              <span>Loading commissions...</span>
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
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Commission Management</h2>
            <p className="text-gray-600">Track and manage commission generation and payouts</p>
          </div>
          <button
            onClick={() => setIsGenerateCommissionOpen(true)}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Generate Commission
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Commissions', 
              value: commissions.length.toString(), 
              icon: DollarSign, 
              color: 'bg-blue-500' 
            },
            { 
              label: 'Pending', 
              value: commissions.filter(c => c.commissionstatus === 'Pending').length.toString(), 
              icon: Clock, 
              color: 'bg-yellow-500' 
            },
            { 
              label: 'Released', 
              value: commissions.filter(c => c.commissionstatus === 'Released').length.toString(), 
              icon: CheckCircle, 
              color: 'bg-green-500' 
            },
            { 
              label: 'Total Amount', 
              value: `₱${commissions.reduce((sum, c) => sum + parseFloat(String(c.commissionamount)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
              icon: TrendingUp, 
              color: 'bg-purple-500' 
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by commission ID, staff, client, or transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Released">Released</option>
            </select>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-gray-900">Commissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Commission ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Commission Amount</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Payout Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">No commissions found</td>
                  </tr>
                ) : (
                  filteredCommissions.map((commission) => (
                    <tr key={commission.commissionid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">COMM-{commission.commissionid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{commission.staffName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{commission.transactionCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">₱{parseFloat(String(commission.commissionamount)).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(commission.commissionrate * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          commission.commissionstatus === 'Released' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {commission.commissionstatus === 'Released' && <CheckCircle className="w-3 h-3" />}
                          {commission.commissionstatus === 'Pending' && <Clock className="w-3 h-3" />}
                          {commission.commissionstatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-medium ${
                          commission.payoutStatus === 'Fully Paid' ? 'text-green-600' :
                          commission.payoutStatus === 'Partial' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {commission.payoutStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        <button
                          onClick={() => handleOpenCommissionDetail(commission)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPayoutDialog(commission)}
                          disabled={isSaving}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Commission Detail Dialog */}
      <Dialog open={isCommissionDetailOpen} onOpenChange={setIsCommissionDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
            <DialogDescription>COMM-{selectedCommission?.commissionid}</DialogDescription>
          </DialogHeader>

          {selectedCommission && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Staff</p>
                  <p className="text-gray-900 font-medium">{selectedCommission.staffName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction</p>
                  <p className="text-gray-900 font-medium">{selectedCommission.transactionCode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Commission Amount</p>
                  <p className="text-gray-900 font-medium">₱{parseFloat(String(selectedCommission.commissionamount)).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-gray-900 font-medium">{(selectedCommission.commissionrate * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-gray-900 font-medium">{selectedCommission.commissionstatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Paid Out</p>
                  <p className="text-gray-900 font-medium">₱{parseFloat(String(selectedCommission.totalPaidOut || 0)).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-4">Payouts</h4>
                <CommissionPayouts commissionId={selectedCommission.commissionid} />
              </div>
            </div>
          )}

          <DialogFooter>
            <button onClick={() => setIsCommissionDetailOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Commission Dialog */}
      <Dialog open={isGenerateCommissionOpen} onOpenChange={setIsGenerateCommissionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Commission</DialogTitle>
            <DialogDescription>Create a new commission for a completed transaction</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Completed Transaction <span className="text-red-500">*</span>
              </label>
              <select
                value={generateForm.transactionId || ''}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, transactionId: parseInt(e.target.value) }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Transaction</option>
                {transactions.filter(tx => tx.transactionstatus === 'Completed').map(tx => (
                  <option key={tx.transactionid} value={tx.transactionid}>
                    TX-{tx.transactionid} - ₱{parseFloat(String(tx.negotiatedprice)).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Staff Member <span className="text-red-500">*</span>
              </label>
              <select
                value={generateForm.staffId || ''}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, staffId: parseInt(e.target.value) }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Staff</option>
                {mockStaff.map(staff => (
                  <option key={staff.staffid} value={staff.staffid}>
                    {staff.firstname} {staff.lastname}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Commission Rate (%)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={generateForm.commissionRate * 100}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) / 100 }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="e.g., 5.00"
              />
              <p className="text-xs text-gray-500 mt-1">Enter as percentage (e.g., 5 for 5%)</p>
            </div>

            {generateForm.transactionId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Commission Amount:</strong> ₱{(
                    (transactions.find(t => t.transactionid === generateForm.transactionId)?.negotiatedprice || 0) * generateForm.commissionRate
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsGenerateCommissionOpen(false);
                setGenerateForm({ transactionId: 0, staffId: 0, commissionRate: 0.05 });
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateCommission}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Generate Commission
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payout Dialog */}
      <Dialog open={isRecordPayoutOpen} onOpenChange={setIsRecordPayoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Commission Payout</DialogTitle>
            <DialogDescription>Record a payout for commission COMM-{selectedCommission?.commissionid}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedCommission && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Commission Amount</p>
                    <p className="text-sm font-medium">₱{parseFloat(String(selectedCommission.commissionamount)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Already Paid</p>
                    <p className="text-sm font-medium">₱{parseFloat(String(selectedCommission.totalPaidOut || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payout Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={payoutForm.payoutDate}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutDate: e.target.value }))}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Payout Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={payoutForm.payoutMethod}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutMethod: e.target.value }))}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Payout Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={payoutForm.payoutAmount}
                onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutAmount: e.target.value }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="e.g., 275000.00"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={payoutForm.payoutNotes}
                onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutNotes: e.target.value }))}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                rows={3}
                placeholder="e.g., Cheque #12345, Reference details..."
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsRecordPayoutOpen(false);
                setPayoutForm({
                  commissionId: 0,
                  payoutAmount: '',
                  payoutDate: new Date().toISOString().split('T')[0],
                  payoutMethod: 'Bank Transfer',
                  payoutNotes: '',
                });
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayout}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Record Payout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
