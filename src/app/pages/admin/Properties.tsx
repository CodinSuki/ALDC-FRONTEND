import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '@/app/components/AdminLayout';
import ConfirmActionDialog from '@/app/components/ConfirmActionDialog';
import { Plus, Edit, Trash2, Search, Archive } from 'lucide-react';
import {
  archiveAdminProperty,
  deleteAdminProperty,
  fetchAdminPropertyData,
  type AdminProperty,
  type ProjectOption,
  type PropertyListingStatusOption,
  type SellerOption,
} from '@/app/services/adminPropertyService';

export default function AdminProperties() {
  type ConfirmMode = 'delete' | 'archive';

  const navigate = useNavigate();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [listingStatuses, setListingStatuses] = useState<PropertyListingStatusOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const projectIdParam = urlParams.get('projectId');
  const projectIdFilter = projectIdParam ? Number(projectIdParam) : null;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>('delete');
  const [confirmDescription, setConfirmDescription] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<AdminProperty | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchAdminPropertyData();

        setProjects(data.projects);
        setSellers(data.sellers);
        setListingStatuses(data.listingStatuses);
        setProperties(data.properties);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load properties';
        setLoadError(errorMessage);
        console.error('Failed to fetch properties data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProperties = properties.filter(p => {
    if (p.is_archived) return false;

    const matchesSearch =
      p.propertyname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.property_type_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.listing_status_name === filterStatus;
    const matchesProject = projectIdFilter ? p.projectid === projectIdFilter : true;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Properties</h2>
            <p className="text-gray-600">Manage active properties and listings</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              <span>Loading properties...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Properties</h2>
            <p className="text-gray-600">Manage active properties and listings</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Could not load properties</p>
            <p className="text-red-700 text-sm mt-1">{loadError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const requestDeleteProperty = (property: AdminProperty) => {
    setConfirmMode('delete');
    setConfirmTarget(property);
    setConfirmDescription('This action permanently deletes the property and related records. This cannot be undone. Continue?');
    setConfirmOpen(true);
  };

  const requestArchiveProperty = (property: AdminProperty, customDescription?: string) => {
    setConfirmMode('archive');
    setConfirmTarget(property);
    setConfirmDescription(
      customDescription ?? 'Archive this property? It will be hidden from listings and active admin tables.'
    );
    setConfirmOpen(true);
  };

  const handleArchiveProperty = async (propertyId: number) => {
    const lookup = {
      projects,
      sellers,
      propertyTypes: [], // Not needed for archive operation
      listingStatuses,
    };

    try {
      const archived = await archiveAdminProperty(propertyId, lookup);
      setProperties((prev) => prev.map((entry) => (entry.propertyid === propertyId ? archived : entry)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error archiving property';
      alert(`Error archiving property: ${message}`);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) {
      setConfirmOpen(false);
      return;
    }

    setIsActionSubmitting(true);

    try {
      if (confirmMode === 'delete') {
        await deleteAdminProperty(confirmTarget.propertyid);
        setProperties((prev) => prev.filter((entry) => entry.propertyid !== confirmTarget.propertyid));
        setConfirmOpen(false);
        setConfirmTarget(null);
        return;
      }

      await handleArchiveProperty(confirmTarget.propertyid);
      setConfirmOpen(false);
      setConfirmTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting property';

      if (confirmMode === 'delete' && message.toLowerCase().includes('fk_transaction_property')) {
        requestArchiveProperty(
          confirmTarget,
          'This property has linked transactions and cannot be deleted. Archive it instead?'
        );
        return;
      }

      alert(`Error deleting property: ${message}`);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Property Management</h2>
            <p className="text-gray-600">Manage all properties in the system</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/properties/archived"
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-5 h-5" />
              Archived
            </Link>
            <Link
              to="/admin/properties/new"
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by property name, project, seller, or type..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              {listingStatuses.map(status => (
                <option key={status.propertylistingstatusid} value={status.propertylistingstatusname}>
                  {status.propertylistingstatusname}
                </option>
              ))}
            </select> 
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Landowner</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property Type</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProperties.map(p => (
                  <tr key={p.propertyid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.propertyname}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{p.project_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.seller_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.property_type_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        p.listing_status_name === 'Available' ? 'bg-green-100 text-green-800' :
                        p.listing_status_name === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.listing_status_name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link to={`/admin/properties/edit/${p.propertyid}`} className="inline-block text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => requestArchiveProperty(p)} className="text-amber-600 hover:text-amber-800 mr-3">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button onClick={() => requestDeleteProperty(p)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProperties.length === 0 && (
            <div className="text-center py-12 text-gray-500">No properties found matching your criteria</div>
          )}
        </div>

        <ConfirmActionDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirmMode === 'delete' ? 'Confirm Permanent Delete' : 'Confirm Archive'}
          description={confirmDescription}
          confirmLabel={confirmMode === 'delete' ? 'Delete Permanently' : 'Archive Property'}
          confirmVariant={confirmMode === 'delete' ? 'danger' : 'default'}
          isSubmitting={isActionSubmitting}
          onConfirm={handleConfirmAction}
        />
      </div>
    </AdminLayout>
  );
}
