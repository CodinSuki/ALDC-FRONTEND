import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import PageHeader from '@/app/components/ui/PageHeader';
import FilterBar from '@/app/components/ui/FilterBar';
import DataTableWrapper, { TableHeaderCell, TableDataCell } from '@/app/components/ui/DataTableWrapper';
import StatusBadge from '@/app/components/ui/StatusBadge';
import ActionButtons from '@/app/components/ui/ActionButtons';
import { SimpleStatCard } from '@/app/components/ui/StatCard';

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

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
        const response = await fetch('/api/admin/clients', {
          method: 'GET',
          credentials: 'include',
        });

        const payload = (await response.json().catch(() => ({}))) as {
          items?: ClientItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load clients');
        }

        setClients(payload.items ?? []);
      } catch (error: unknown) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load clients');
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
        <PageHeader 
          title="Client Directory" 
          description="Manage client records and activity across consultations, inquiries, and seller submissions"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SimpleStatCard label="Total Clients" value={totalClients} color="bg-blue-500" />
          <SimpleStatCard label="Sellers" value={sellerCount} color="bg-purple-500" />
          <SimpleStatCard label="With Activity" value={activeClients} color="bg-emerald-500" />
          <SimpleStatCard label="New This Month" value={newThisMonthCount} color="bg-yellow-500" />
        </div>

        {/* Filters */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by name, email, or contact..."
          filters={[
            {
              value: filterType,
              onChange: (value: string) => setFilterType(value as ClientTypeFilter),
              options: [
                { value: 'All', label: 'All Clients' },
                { value: 'Seller', label: 'Sellers' },
                { value: 'Non-Seller', label: 'Non-Sellers' },
              ],
            },
          ]}
        />

        {/* Clients Table */}
        <DataTableWrapper
          loading={loading}
          error={loadError}
          loadingMessage="Loading clients..."
          isEmpty={filteredClients.length === 0}
          emptyMessage="No clients found"
          colSpan={9}
        >
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <TableHeaderCell>Client ID</TableHeaderCell>
              <TableHeaderCell>Client Name</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Activity</TableHeaderCell>
              <TableHeaderCell>Last Activity</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell align="right">Actions</TableHeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <TableDataCell className="text-sm text-gray-900">
                  {client.clientId}
                </TableDataCell>
                <TableDataCell className="text-gray-900">
                  {client.fullName}
                </TableDataCell>
                <TableDataCell className="text-sm text-gray-600">
                  {client.contact}
                </TableDataCell>
                <TableDataCell className="text-sm text-gray-600">
                  {client.email}
                </TableDataCell>
                <TableDataCell>
                  <StatusBadge 
                    status={client.isSeller ? 'Seller' : 'Client'} 
                    color={client.isSeller ? 'purple' : 'gray'} 
                  />
                </TableDataCell>
                <TableDataCell className="text-sm">
                  <span className="text-gray-900">{client.totalActivity}</span>
                  <span className="text-gray-500">{` (C:${client.consultationCount} / I:${client.inquiryCount} / P:${client.propertyCount})`}</span>
                </TableDataCell>
                <TableDataCell className="text-sm text-gray-600">
                  {formatDate(client.lastActivityAt)}
                </TableDataCell>
                <TableDataCell className="text-sm text-gray-600">
                  {formatDate(client.createdAt)}
                </TableDataCell>
                <TableDataCell align="right">
                  <ActionButtons onView={() => openViewDialog(client)} />
                </TableDataCell>
              </tr>
            ))}
          </tbody>
        </DataTableWrapper>
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
