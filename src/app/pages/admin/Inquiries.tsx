import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Eye, UserPlus, Link2, Search } from 'lucide-react';
import { supabase } from '@/lib/SupabaseClient';
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
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IntakeItem | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionForm, setActionForm] = useState({
    assignedStaffId: '',
    scheduledAt: '',
    consultationStatus: 'New' as IntakeStatus,
  });

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(items.map((item) => item.status)));
    return statuses.sort((a, b) => a.localeCompare(b));
  }, [items]);
  

useEffect(() => {
  const loadIntake = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [consultationRes, inquiryRes, propertyRes, propertyTypeRes, clientRes, listingStatusRes, staffRes] = await Promise.all([
        supabase
          .from('consultationrequest')
          .select('*')
          .order('consultationrequestid', { ascending: false }),

        supabase
          .from('propertyinquiry')
          .select(`
            propertyinquiryid,
            propertyid,
            clientid,
            inquirystatus,
            inquirynotes,
            createdat
          `)
          .order('propertyinquiryid', { ascending: false }),

        supabase
          .from('property')
          .select(`
            propertyid,
            propertyname,
            propertytypeid,
            propertylistingstatusid,
            sellerclientid,
            createdat
          `)
          .order('propertyid', { ascending: false }),

        supabase.from('propertytype').select('propertytypeid, propertytypename'),

        supabase.from('client').select('clientid, firstname, middlename, lastname, emailaddress, contactnumber'),

        supabase
          .from('propertylistingstatus')
          .select('propertylistingstatusid, propertylistingstatusname'),

        supabase
          .from('staff')
          .select('staffid, firstname, middlename, lastname')
          .order('staffid', { ascending: true }),
      ]);

      const errors: string[] = [];
      if (consultationRes.error) errors.push(`Consultation: ${consultationRes.error.message}`);
      if (inquiryRes.error) errors.push(`Buyer Inquiry: ${inquiryRes.error.message}`);
      if (propertyRes.error) errors.push(`Seller Submission: ${propertyRes.error.message}`);
      if (propertyTypeRes.error) errors.push(`Property Type: ${propertyTypeRes.error.message}`);
      if (clientRes.error) errors.push(`Client: ${clientRes.error.message}`);
      if (listingStatusRes.error) errors.push(`Listing Status: ${listingStatusRes.error.message}`);
      if (staffRes.error) errors.push(`Staff: ${staffRes.error.message}`);

      const mappedStaffOptions: StaffOption[] = ((staffRes.data ?? []) as StaffRow[]).map((row) => ({
        staffId: Number(row.staffid),
        name: formatName(row.firstname, row.middlename, row.lastname) || `Staff #${row.staffid}`,
      }));

      setStaffOptions(mappedStaffOptions);

      const staffById = new Map<number, StaffOption>(
        mappedStaffOptions.map((staff) => [staff.staffId, staff])
      );

      const propertyTypeById = new Map<number, string>(
        ((propertyTypeRes.data ?? []) as PropertyTypeRow[]).map((r) => [r.propertytypeid, pick(r.propertytypename)])
      );

      const clientById = new Map<number, ClientRow>(
        ((clientRes.data ?? []) as ClientRow[]).map((r) => [r.clientid, r])
      );

      const propertyById = new Map<number, PropertyRow>(
        ((propertyRes.data ?? []) as PropertyRow[]).map((r) => [r.propertyid, r])
      );

      const listingStatusById = new Map<number, string>(
        ((listingStatusRes.data ?? []) as PropertyListingStatusRow[]).map((r) => [r.propertylistingstatusid, pick(r.propertylistingstatusname)])
      );

      const consultationItems: IntakeItem[] = ((consultationRes.data ?? []) as ConsultationRow[]).map((r) => ({
        id: `consultation-${r.consultationrequestid}`,
        source: 'Consultation',
        sourceId: String(r.consultationrequestid),
        clientName: pick(r.fullname) || 'Unknown Client',
        contact: pick(r.contactnumber) || 'N/A',
        email: pick(r.emailaddress) || 'N/A',
        reference: propertyTypeById.get(Number(r.preferredpropertytypeid)) || `Property Type #${r.preferredpropertytypeid ?? 'N/A'}`,
        details: [r.preferredlocation, r.budgetrange].filter(Boolean).join(' • ') || 'No preferences provided',
        status: normalizeStatus(r.consultationstatus, 'New'),
        createdAt: r.createdat || new Date().toISOString(),
        notes: pick(r.additionalrequirements) || 'No additional requirements',
        assignedStaffId: r.assignedstaffid ? Number(r.assignedstaffid) : null,
        assignedStaffName: r.assignedstaffid ? staffById.get(Number(r.assignedstaffid))?.name ?? `Staff #${r.assignedstaffid}` : null,
        scheduledAt: r.scheduledat || null,
      }));

      const buyerItems: IntakeItem[] = ((inquiryRes.data ?? []) as PropertyInquiryRow[]).map((r) => {
        const client = r.clientid ? clientById.get(Number(r.clientid)) : undefined;
        const property = r.propertyid ? propertyById.get(Number(r.propertyid)) : undefined;

        return {
          id: `buyer-${r.propertyinquiryid}`,
          source: 'Buyer Inquiry',
          sourceId: String(r.propertyinquiryid),
          clientName: formatName(client?.firstname, client?.middlename, client?.lastname) || `Client #${r.clientid ?? 'N/A'}`,
          contact: pick(client?.contactnumber) || 'N/A',
          email: pick(client?.emailaddress) || 'N/A',
          reference:
            pick(property?.propertyname) ||
            (property?.propertytypeid ? propertyTypeById.get(Number(property.propertytypeid)) : '') ||
            `Property #${r.propertyid ?? 'N/A'}`,
          details: 'Buyer inquiry submitted',
          status: normalizeStatus(r.inquirystatus, 'New'),
          createdAt: r.createdat || new Date().toISOString(),
          notes: pick(r.inquirynotes) || 'No notes',
        };
      });

      const toSellerStatus = (propertylistingstatusid: unknown): IntakeStatus => {
        const name = listingStatusById.get(Number(propertylistingstatusid))?.toLowerCase() ?? '';
        if (name.includes('draft')) return 'Property Drafted';
        if (name.includes('pending')) return 'Pending Review';
        if (name.includes('available') || name.includes('publish') || name.includes('active')) return 'Published';
        return 'Received';
      };

      const sellerItems: IntakeItem[] = ((propertyRes.data ?? []) as PropertyRow[])
        .filter((r) => r.sellerclientid != null)
        .map((r) => {
          const seller = r.sellerclientid ? clientById.get(Number(r.sellerclientid)) : undefined;

          return {
            id: `seller-${r.propertyid}`,
            source: 'Seller Submission',
            sourceId: String(r.propertyid),
            clientName: formatName(seller?.firstname, seller?.middlename, seller?.lastname) || `Seller #${r.sellerclientid ?? 'N/A'}`,
            contact: pick(seller?.contactnumber) || 'N/A',
            email: pick(seller?.emailaddress) || 'N/A',
            reference: pick(r.propertyname) || `Property #${r.propertyid}`,
            details: 'Property submitted for internal review',
            status: toSellerStatus(r.propertylistingstatusid),
            createdAt: r.createdat || new Date().toISOString(),
            notes: 'Seller onboarding item.',
          };
        });

      const merged = [...consultationItems, ...buyerItems, ...sellerItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(merged);
      if (errors.length) setLoadError(errors.join(' | '));
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
      consultationStatus: item.status,
    });
    setIsViewDialogOpen(true);
  };

  const saveConsultationWorkflow = async () => {
    if (!selectedItem || selectedItem.source !== 'Consultation') {
      return;
    }

    setActionSaving(true);

    const sourceId = Number(selectedItem.sourceId);
    const assignedStaffId = actionForm.assignedStaffId ? Number(actionForm.assignedStaffId) : null;
    const scheduledAt = actionForm.scheduledAt ? new Date(actionForm.scheduledAt).toISOString() : null;

    const fullPayload = {
      consultationstatus: actionForm.consultationStatus,
      assignedstaffid: assignedStaffId,
      scheduledat: scheduledAt,
    } as Record<string, unknown>;

    const { error: fullUpdateError } = await supabase
      .from('consultationrequest')
      .update(fullPayload)
      .eq('consultationrequestid', sourceId);

    if (fullUpdateError) {
      const { error: statusOnlyError } = await supabase
        .from('consultationrequest')
        .update({ consultationstatus: actionForm.consultationStatus })
        .eq('consultationrequestid', sourceId);

      if (statusOnlyError) {
        setActionSaving(false);
        alert(statusOnlyError.message || 'Failed to update consultation workflow');
        return;
      }
    }

    const assignedStaffName = assignedStaffId
      ? staffOptions.find((staff) => staff.staffId === assignedStaffId)?.name ?? `Staff #${assignedStaffId}`
      : null;

    const updatedItem: IntakeItem = {
      ...selectedItem,
      status: actionForm.consultationStatus,
      assignedStaffId,
      assignedStaffName,
      scheduledAt,
    };

    setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? updatedItem : item)));
    setSelectedItem(updatedItem);
    setActionSaving(false);
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
          {loading && (
            <div className="px-6 py-3 text-sm text-gray-500 border-b border-gray-200">Loading intake items...</div>
          )}
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
                      <button className="text-emerald-600 hover:text-emerald-800" title="Find or Link Client">
                        <Link2 className="w-4 h-4 inline" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-800" title="Create/Confirm Client">
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
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedItem.status}</p>
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
                      value={actionForm.consultationStatus}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, consultationStatus: e.target.value as IntakeStatus }))}
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

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedItem.notes}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedItem?.source === 'Consultation' && (
              <button
                onClick={saveConsultationWorkflow}
                disabled={actionSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {actionSaving ? 'Saving...' : 'Save Consultation Workflow'}
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
    </AdminLayout>
  );
}
