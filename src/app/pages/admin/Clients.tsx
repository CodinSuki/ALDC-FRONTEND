import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, Eye } from 'lucide-react';
import { supabase } from '@/lib/SupabaseClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

type ClientRow = {
  clientid: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  emailaddress: string;
  contactnumber: string;
  additionalemailaddress: string | null;
  additionalcontactnumber: string | null;
  created_at: string;
};

type SellerProfileRow = {
  clientid: number;
};

type ConsultationRow = {
  consultationrequestid: number;
  clientid: number | null;
  createdat: string | null;
};

type PropertyInquiryRow = {
  propertyinquiryid: number;
  clientid: number | null;
  createdat: string | null;
};

type PropertyRow = {
  propertyid: number;
  sellerclientid: number | null;
  createdat: string | null;
};

type ClientItem = {
  id: string;
  clientId: number;
  fullName: string;
  contact: string;
  additionalContact: string;
  email: string;
  additionalEmail: string;
  isSeller: boolean;
  consultationCount: number;
  inquiryCount: number;
  propertyCount: number;
  totalActivity: number;
  createdAt: string | null;
  lastActivityAt: string | null;
};

type ClientTypeFilter = 'All' | 'Seller' | 'Non-Seller';

const pick = (...values: unknown[]): string => {
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
  return found == null ? '' : String(found);
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const toTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export default function AdminClients() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ClientTypeFilter>('All');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [clientsRes, sellerRes, consultationRes, inquiryRes, propertyRes] = await Promise.all([
          supabase
            .from('client')
            .select('clientid, firstname, middlename, lastname, emailaddress, contactnumber, additionalemailaddress, additionalcontactnumber, created_at')
            .order('clientid', { ascending: false }),
          supabase.from('sellerprofile').select('clientid'),
          supabase.from('consultationrequest').select('consultationrequestid, clientid, createdat'),
          supabase.from('propertyinquiry').select('propertyinquiryid, clientid, createdat'),
          supabase.from('property').select('propertyid, sellerclientid, createdat'),
        ]);

        const errors: string[] = [];
        if (clientsRes.error) errors.push(`Clients: ${clientsRes.error.message}`);
        if (sellerRes.error) errors.push(`Seller Profile: ${sellerRes.error.message}`);
        if (consultationRes.error) errors.push(`Consultation: ${consultationRes.error.message}`);
        if (inquiryRes.error) errors.push(`Property Inquiry: ${inquiryRes.error.message}`);
        if (propertyRes.error) errors.push(`Property: ${propertyRes.error.message}`);

        const sellerSet = new Set<number>(
          ((sellerRes.data ?? []) as SellerProfileRow[])
            .map((row) => Number(row.clientid))
            .filter((value) => Number.isFinite(value))
        );

        const consultationByClient = new Map<number, ConsultationRow[]>();
        ((consultationRes.data ?? []) as ConsultationRow[]).forEach((row) => {
          if (row.clientid == null) return;
          const clientId = Number(row.clientid);
          const list = consultationByClient.get(clientId) ?? [];
          list.push(row);
          consultationByClient.set(clientId, list);
        });

        const inquiryByClient = new Map<number, PropertyInquiryRow[]>();
        ((inquiryRes.data ?? []) as PropertyInquiryRow[]).forEach((row) => {
          if (row.clientid == null) return;
          const clientId = Number(row.clientid);
          const list = inquiryByClient.get(clientId) ?? [];
          list.push(row);
          inquiryByClient.set(clientId, list);
        });

        const propertyBySeller = new Map<number, PropertyRow[]>();
        ((propertyRes.data ?? []) as PropertyRow[]).forEach((row) => {
          if (row.sellerclientid == null) return;
          const clientId = Number(row.sellerclientid);
          const list = propertyBySeller.get(clientId) ?? [];
          list.push(row);
          propertyBySeller.set(clientId, list);
        });

        const mappedClients: ClientItem[] = ((clientsRes.data ?? []) as ClientRow[]).map((row) => {
          const clientId = Number(row.clientid);
          const consultations = consultationByClient.get(clientId) ?? [];
          const inquiries = inquiryByClient.get(clientId) ?? [];
          const properties = propertyBySeller.get(clientId) ?? [];

          const activityTimes = [
            ...consultations.map((entry) => toTimestamp(entry.createdat)),
            ...inquiries.map((entry) => toTimestamp(entry.createdat)),
            ...properties.map((entry) => toTimestamp(entry.createdat)),
          ].filter((time) => time > 0);

          const lastActivity = activityTimes.length > 0 ? new Date(Math.max(...activityTimes)).toISOString() : null;

          return {
            id: String(clientId),
            clientId,
            fullName: [row.firstname, row.middlename, row.lastname].filter(Boolean).join(' ').trim() || `Client #${clientId}`,
            contact: pick(row.contactnumber) || 'N/A',
            additionalContact: pick(row.additionalcontactnumber) || 'N/A',
            email: pick(row.emailaddress) || 'N/A',
            additionalEmail: pick(row.additionalemailaddress) || 'N/A',
            isSeller: sellerSet.has(clientId),
            consultationCount: consultations.length,
            inquiryCount: inquiries.length,
            propertyCount: properties.length,
            totalActivity: consultations.length + inquiries.length + properties.length,
            createdAt: row.created_at,
            lastActivityAt: lastActivity,
          };
        });

        setClients(mappedClients);

        if (errors.length > 0) {
          setLoadError(errors.join(' | '));
        }
      } catch (error: any) {
        setLoadError(error?.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      client.fullName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.contact.toLowerCase().includes(query);

    const matchesType =
      filterType === 'All' ||
      (filterType === 'Seller' && client.isSeller) ||
      (filterType === 'Non-Seller' && !client.isSeller);

    return matchesSearch && matchesType;
  });

  const totalClients = clients.length;
  const sellerCount = clients.filter((client) => client.isSeller).length;
  const activeClients = clients.filter((client) => client.totalActivity > 0).length;
  const newThisMonthCount = clients.filter((client) => {
    if (!client.createdAt) return false;
    const createdDate = new Date(client.createdAt);
    if (Number.isNaN(createdDate.getTime())) return false;
    const now = new Date();
    return createdDate.getFullYear() === now.getFullYear() && createdDate.getMonth() === now.getMonth();
  }).length;

  const openViewDialog = (client: ClientItem) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-gray-900">Client Directory</h2>
          <p className="text-gray-600">Manage client records and activity across consultations, inquiries, and seller submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Clients', value: String(totalClients), color: 'bg-blue-500' },
            { label: 'Sellers', value: String(sellerCount), color: 'bg-purple-500' },
            { label: 'With Activity', value: String(activeClients), color: 'bg-emerald-500' },
            { label: 'New This Month', value: String(newThisMonthCount), color: 'bg-yellow-500' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ClientTypeFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Clients</option>
              <option value="Seller">Sellers</option>
              <option value="Non-Seller">Non-Sellers</option>
            </select>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading && (
            <div className="px-6 py-3 text-sm text-gray-500 border-b border-gray-200">Loading clients...</div>
          )}
          {loadError && (
            <div className="px-6 py-3 text-sm text-red-600 border-b border-gray-200">{loadError}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Client ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.clientId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {client.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.contact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          client.isSeller ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {client.isSeller ? 'Seller' : 'Client'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="text-gray-900">{client.totalActivity}</span>
                      <span className="text-gray-500">{` (C:${client.consultationCount} / I:${client.inquiryCount} / P:${client.propertyCount})`}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(client.lastActivityAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewDialog(client)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Client"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !loadError && filteredClients.length === 0 && (
            <div className="text-center py-12 text-gray-500">No clients found matching your criteria</div>
          )}
        </div>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              {selectedClient ? `Client #${selectedClient.clientId}` : 'Selected client'}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <p className="text-gray-900">{selectedClient.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <p className="text-gray-900">{selectedClient.isSeller ? 'Seller' : 'Client'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <p className="text-gray-900">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Additional Email</label>
                  <p className="text-gray-900">{selectedClient.additionalEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contact Number</label>
                  <p className="text-gray-900">{selectedClient.contact}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Additional Contact</label>
                  <p className="text-gray-900">{selectedClient.additionalContact}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Created</label>
                  <p className="text-gray-900">{formatDate(selectedClient.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Activity</label>
                  <p className="text-gray-900">{formatDate(selectedClient.lastActivityAt)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Activity Summary</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-gray-900">{selectedClient.totalActivity}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Consultations</p>
                    <p className="text-gray-900">{selectedClient.consultationCount}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Inquiries</p>
                    <p className="text-gray-900">{selectedClient.inquiryCount}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Properties</p>
                    <p className="text-gray-900">{selectedClient.propertyCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
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
