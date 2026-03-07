import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Eye, UserPlus, Link2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

type IntakeSource = 'Consultation' | 'Buyer Inquiry' | 'Seller Submission';
type IntakeStatus =
  | 'New'
  | 'Assigned'
  | 'Scheduled'
  | 'Consulted'
  | 'Not Consulted'
  | 'Contacted'
  | 'Qualified'
  | 'Converted'
  | 'Closed'
  | 'Received'
  | 'Client Linked'
  | 'Property Drafted'
  | 'Pending Review'
  | 'Published';

interface ConsultationRow {
  consultationrequestid: number;
  clientid?: number | null;
  fullname: string | null;
  emailaddress: string | null;
  contactnumber: string | null;
  preferredpropertytypeid: number | null;
  preferredlocation: string | null;
  budgetrange: string | null;
  additionalrequirements: string | null;
  consultationstatus: string | null;
  assignedstaffid?: number | null;
  scheduledat?: string | null;
  createdat: string | null;
}

interface PropertyInquiryRow {
  propertyinquiryid: number;
  propertyid: number | null;
  clientid: number | null;
  inquirystatus: string | null;
  inquirynotes: string | null;
  createdat: string | null;
}

interface PropertyRow {
  propertyid: number;
  propertyname: string | null;
  propertytypeid: number | null;
  propertylistingstatusid: number | null;
  sellerclientid: number | null;
  createdat: string | null;
}

interface PropertyTypeRow {
  propertytypeid: number;
  propertytypename: string | null;
}

interface ClientRow {
  clientid: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  emailaddress: string | null;
  contactnumber: string | null;
}

interface PropertyListingStatusRow {
  propertylistingstatusid: number;
  propertylistingstatusname: string | null;
}

interface StaffRow {
  staffid: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
}

interface StaffOption {
  staffId: number;
  name: string;
}

interface IntakeItem {
  id: string;
  source: IntakeSource;
  sourceId: string;
  clientName: string;
  contact: string;
  email: string;
  reference: string;
  details: string;
  status: IntakeStatus;
  createdAt: string;
  notes: string;
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  scheduledAt?: string | null;
}

interface InquiriesApiResponse {
  items: IntakeItem[];
  staffOptions: StaffOption[];
}

const normalizeStatus = (value: unknown, fallback: IntakeStatus): IntakeStatus => {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('contact')) return 'Contacted';
  if (text.includes('qualif')) return 'Qualified';
  if (text.includes('convert')) return 'Converted';
  if (text.includes('close')) return 'Closed';
  if (text.includes('assign')) return 'Assigned';
  if (text.includes('sched')) return 'Scheduled';
  if (text.includes('consulted')) return 'Consulted';
  if (text.includes('not consulted')) return 'Not Consulted';
  if (text.includes('linked')) return 'Client Linked';
  if (text.includes('draft')) return 'Property Drafted';
  if (text.includes('pending')) return 'Pending Review';
  if (text.includes('new')) return 'New';
  if (text.includes('receive')) return 'Received';
  return fallback;
};

const formatName = (first?: string | null, middle?: string | null, last?: string | null): string =>
  [first, middle, last].filter(Boolean).join(' ').trim();

const pick = (...values: unknown[]): string => {
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
  return found == null ? '' : String(found);
};

export default function AdminInquiries() {
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IntakeItem | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionForm, setActionForm] = useState({
    assignedStaffId: '',
    scheduledAt: '',
    status: 'New' as IntakeStatus,
    notes: '',
  });

  // Client search/link states
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [clientLinkingItem, setClientLinkingItem] = useState<IntakeItem | null>(null);

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(items.map((item) => item.status)));
    return statuses.sort((a, b) => a.localeCompare(b));
  }, [items]);
  
  useEffect(() => {
    const loadIntake = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch('/api/admin/workflows', {
          method: 'GET',
          credentials: 'include',
        });

        const result = (await response.json().catch(() => ({}))) as Partial<InquiriesApiResponse> & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to load intake');
        }

        setItems(result.items ?? []);
        setStaffOptions(result.staffOptions ?? []);
      } catch (err: any) {
        setLoadError(err?.message || 'Failed to load intake');
      } finally {
        setLoading(false);
      }
    };

    loadIntake();
  }, []);

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.clientName.toLowerCase().includes(query) ||
      item.reference.toLowerCase().includes(query) ||
      item.details.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query);
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesSource = filterSource === 'All' || item.source === filterSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const openViewDialog = (item: IntakeItem) => {
    setSelectedItem(item);
    setActionForm({
      assignedStaffId: item.assignedStaffId ? String(item.assignedStaffId) : '',
      scheduledAt: item.scheduledAt ? String(item.scheduledAt).slice(0, 16) : '',
      status: item.status,
      notes: item.notes,
    });
    setIsViewDialogOpen(true);
  };

  const saveInboxWorkflow = async () => {
    if (!selectedItem) {
      return;
    }

    setActionSaving(true);

    try {
      const payload = {
        source: selectedItem.source,
        sourceId: selectedItem.sourceId,
        status: actionForm.status,
        assignedStaffId: actionForm.assignedStaffId ? Number(actionForm.assignedStaffId) : null,
        scheduledAt: actionForm.scheduledAt ? new Date(actionForm.scheduledAt).toISOString() : null,
        notes: actionForm.notes,
      };

      const response = await fetch('/api/admin/workflows', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        item?: IntakeItem | null;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Failed to update inbox workflow');
      }

      if (result.item) {
        setItems((prev) => prev.map((item) => (item.id === result.item!.id ? result.item! : item)));
        setSelectedItem(result.item);
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to update inbox workflow');
    } finally {
      setActionSaving(false);
    }
  };

  const searchClients = async (term: string) => {
    if (!term || term.length < 2) {
      setClientSearchResults([]);
      return;
    }

    setClientSearchLoading(true);
    try {
      const response = await fetch('/api/admin/workflows?action=searchClients', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: term }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to search clients');

      setClientSearchResults(result.clients || []);
    } catch (error: any) {
      alert(error?.message || 'Failed to search clients');
    } finally {
      setClientSearchLoading(false);
    }
  };

  const linkClientToIntake = async (clientId: number) => {
    if (!clientLinkingItem) return;

    try {
      const response = await fetch('/api/admin/workflows?action=linkClient', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: clientLinkingItem.source,
          sourceId: clientLinkingItem.sourceId,
          clientId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to link client');

      alert('Client linked successfully!');
      setIsClientSearchOpen(false);
      
      // Reload items
      const loadResponse = await fetch('/api/admin/workflows', { method: 'GET', credentials: 'include' });
      const loadResult = await loadResponse.json();
      setItems(loadResult.items ?? []);
    } catch (error: any) {
      alert(error?.message || 'Failed to link client');
    }
  };

  const createClientFromIntake = async () => {
    if (!clientLinkingItem) return;

    try {
      const response = await fetch('/api/admin/workflows?action=createClient', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: clientLinkingItem.source,
          sourceId: clientLinkingItem.sourceId,
          fullname: clientLinkingItem.clientName,
          email: clientLinkingItem.email,
          contact: clientLinkingItem.contact,
        }),
      });

      const result = await response.json();
      
      if (response.status === 409) {
        const useExisting = confirm(
          `A client with this email or contact already exists (Client #${result.existingClientId}). Would you like to link this intake to the existing client instead?`
        );
        if (useExisting) {
          await linkClientToIntake(result.existingClientId);
          return;
        }
        return;
      }

      if (!response.ok) throw new Error(result.error || 'Failed to create client');

      alert(`Client created successfully! Client ID: ${result.clientId}`);
      setIsCreateClientOpen(false);
      
      // Reload items
      const loadResponse = await fetch('/api/admin/workflows', { method: 'GET', credentials: 'include' });
      const loadResult = await loadResponse.json();
      setItems(loadResult.items ?? []);
    } catch (error: any) {
      alert(error?.message || 'Failed to create client');
    }
  };

  const openClientSearchDialog = (item: IntakeItem) => {
    setClientLinkingItem(item);
    setClientSearchTerm('');
    setClientSearchResults([]);
    setIsClientSearchOpen(true);
  };

  const openCreateClientDialog = (item: IntakeItem) => {
    setClientLinkingItem(item);
    setIsCreateClientOpen(true);
  };

  const sourceBadgeClass = (source: IntakeSource) => {
    if (source === 'Consultation') return 'bg-blue-100 text-blue-800';
    if (source === 'Buyer Inquiry') return 'bg-emerald-100 text-emerald-800';
    return 'bg-purple-100 text-purple-800';
  };

  const statusBadgeClass = (status: IntakeStatus) => {
    const lowered = status.toLowerCase();
    if (lowered.includes('convert') || lowered.includes('publish')) return 'bg-green-100 text-green-800';
    if (lowered.includes('consulted')) return 'bg-green-100 text-green-800';
    if (lowered.includes('contact') || lowered.includes('qualif')) return 'bg-yellow-100 text-yellow-800';
    if (lowered.includes('assigned') || lowered.includes('scheduled')) return 'bg-indigo-100 text-indigo-800';
    if (lowered.includes('close')) return 'bg-gray-100 text-gray-800';
    if (lowered.includes('pending') || lowered.includes('draft')) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading && items.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-gray-900">Unified Intake Inbox</h2>
              <p className="text-gray-600">Consultation requests, buyer inquiries, and seller submissions in one queue</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              <span>Loading intake items...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Unified Intake Inbox</h2>
            <p className="text-gray-600">Consultation requests, buyer inquiries, and seller submissions in one queue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by client, reference, detail, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Source Filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Sources</option>
              <option value="Consultation">Consultation</option>
              <option value="Buyer Inquiry">Buyer Inquiry</option>
              <option value="Seller Submission">Seller Submission</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Intake Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loadError && (
            <div className="px-6 py-3 text-sm text-red-600 border-b border-gray-200">{loadError}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Created
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${sourceBadgeClass(item.source)}`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {item.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{item.email}</div>
                      <div className="text-xs text-gray-500">{item.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button 
                        onClick={() => openViewDialog(item)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => openClientSearchDialog(item)}
                        className="text-emerald-600 hover:text-emerald-800" 
                        title="Find or Link Client"
                      >
                        <Link2 className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => openCreateClientDialog(item)}
                        className="text-purple-600 hover:text-purple-800" 
                        title="Create/Confirm Client"
                      >
                        <UserPlus className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No intake items found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* View Intake Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Intake Details</DialogTitle>
            <DialogDescription>
              {selectedItem?.source} #{selectedItem?.sourceId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Source</label>
                  <p className="text-gray-900">{selectedItem.source}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Created</label>
                  <p className="text-gray-900">
                    {new Date(selectedItem.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Client Name</label>
                  <p className="text-gray-900">{selectedItem.clientName}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Reference</label>
                  <p className="text-gray-900">{selectedItem.reference}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <p className="text-gray-900">{selectedItem.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contact</label>
                  <p className="text-gray-900">{selectedItem.contact}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Details</label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedItem.details}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{actionForm.status}</p>
              </div>

              {selectedItem.source === 'Consultation' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Assigned Staff</label>
                    <select
                      value={actionForm.assignedStaffId}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, assignedStaffId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Unassigned</option>
                      {staffOptions.map((staff) => (
                        <option key={staff.staffId} value={staff.staffId}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Scheduled Consultation</label>
                    <input
                      type="datetime-local"
                      value={actionForm.scheduledAt}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Consultation Status</label>
                    <select
                      value={actionForm.status}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, status: e.target.value as IntakeStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="New">New</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Consulted">Consulted</option>
                      <option value="Not Consulted">Not Consulted</option>
                    </select>
                  </div>
                </>
              )}

              {selectedItem.source === 'Buyer Inquiry' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Inquiry Status</label>
                    <select
                      value={actionForm.status}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, status: e.target.value as IntakeStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Converted">Converted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <textarea
                      value={actionForm.notes}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {selectedItem.source === 'Seller Submission' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Submission Status</label>
                  <select
                    value={actionForm.status}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, status: e.target.value as IntakeStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Received">Received</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{actionForm.notes || 'No notes'}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedItem && (
              <button
                onClick={saveInboxWorkflow}
                disabled={actionSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {actionSaving ? 'Saving...' : 'Save Workflow'}
              </button>
            )}
            <button
              onClick={() => setIsViewDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Search Dialog */}
      <Dialog open={isClientSearchOpen} onOpenChange={setIsClientSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Find and Link Existing Client</DialogTitle>
            <DialogDescription>
              Search for an existing client to link to {clientLinkingItem?.source} #{clientLinkingItem?.sourceId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by name, email, or contact
              </label>
              <input
                type="text"
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value);
                  searchClients(e.target.value);
                }}
                placeholder="Type to search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {clientSearchLoading && (
                <div className="text-center py-8 text-gray-500">Searching...</div>
              )}
              
              {!clientSearchLoading && clientSearchResults.length === 0 && clientSearchTerm.length >= 2 && (
                <div className="text-center py-8 text-gray-500">No clients found</div>
              )}

              {!clientSearchLoading && clientSearchResults.length === 0 && clientSearchTerm.length < 2 && (
                <div className="text-center py-8 text-gray-400 text-sm">Enter at least 2 characters to search</div>
              )}

              <div className="space-y-2">
                {clientSearchResults.map((client: any) => (
                  <div
                    key={client.clientid}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{client.fullname}</div>
                      <div className="text-sm text-gray-600">
                        {client.email && <div>Email: {client.email}</div>}
                        {client.contact && <div>Contact: {client.contact}</div>}
                        <div className="text-xs text-gray-400 mt-1">Client ID: {client.clientid}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => linkClientToIntake(client.clientid)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsClientSearchOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Client Dialog */}
      <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Create a new client record and link to {clientLinkingItem?.source} #{clientLinkingItem?.sourceId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={clientLinkingItem?.clientName || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">From intake form</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="text"
                value={clientLinkingItem?.email || 'Not provided'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
              <input
                type="text"
                value={clientLinkingItem?.contact || 'Not provided'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will create a new client record with the information from the intake form.
                If a client with this email or contact already exists, you'll be prompted to link to that client instead.
              </p>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsCreateClientOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createClientFromIntake}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Client
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
