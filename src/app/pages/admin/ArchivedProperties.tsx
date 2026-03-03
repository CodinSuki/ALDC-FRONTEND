import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveRestore, Search, Trash2 } from 'lucide-react';
import AdminLayout from '@/app/components/AdminLayout';
import ConfirmActionDialog from '@/app/components/ConfirmActionDialog';
import {
  deleteAdminProperty,
  fetchAdminPropertyData,
  unarchiveAdminProperty,
  type AdminProperty,
  type ProjectOption,
  type PropertyListingStatusOption,
  type PropertyTypeOption,
  type SellerOption,
} from '@/app/services/adminPropertyService';

type ConfirmMode = 'restore' | 'delete';

export default function AdminArchivedProperties() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [listingStatuses, setListingStatuses] = useState<PropertyListingStatusOption[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>('restore');
  const [confirmTarget, setConfirmTarget] = useState<AdminProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAdminPropertyData();
        setProperties(data.properties);
        setProjects(data.projects);
        setSellers(data.sellers);
        setPropertyTypes(data.propertyTypes);
        setListingStatuses(data.listingStatuses);
      } catch (error) {
        console.error('Failed to load archived properties', error);
      }
    };

    loadData();
  }, []);

  const archivedProperties = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return properties.filter((property) => {
      if (!property.is_archived) return false;
      return (
        property.propertyname?.toLowerCase().includes(query) ||
        property.project_name?.toLowerCase().includes(query) ||
        property.seller_name?.toLowerCase().includes(query) ||
        property.property_type_name?.toLowerCase().includes(query)
      );
    });
  }, [properties, searchQuery]);

  const openRestoreDialog = (property: AdminProperty) => {
    setConfirmMode('restore');
    setConfirmTarget(property);
    setConfirmOpen(true);
  };

  const openDeleteDialog = (property: AdminProperty) => {
    setConfirmMode('delete');
    setConfirmTarget(property);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmTarget) {
      setConfirmOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      if (confirmMode === 'restore') {
        const lookup = { projects, sellers, propertyTypes, listingStatuses };
        const restored = await unarchiveAdminProperty(confirmTarget.propertyid, lookup);
        setProperties((prev) => prev.map((entry) => (entry.propertyid === restored.propertyid ? restored : entry)));
        setConfirmOpen(false);
        return;
      }

      await deleteAdminProperty(confirmTarget.propertyid);
      setProperties((prev) => prev.filter((entry) => entry.propertyid !== confirmTarget.propertyid));
      setConfirmOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Archived Properties</h2>
            <p className="text-gray-600">Review and restore archived properties</p>
          </div>
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Properties
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search archived properties..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Landowner</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {archivedProperties.map((property) => (
                  <tr key={property.propertyid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.propertyname}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{property.project_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{property.seller_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{property.property_type_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{property.listing_status_name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => openRestoreDialog(property)}
                        className="text-green-600 hover:text-green-800 mr-3"
                        title="Restore"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(property)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {archivedProperties.length === 0 && (
            <div className="text-center py-12 text-gray-500">No archived properties found.</div>
          )}
        </div>

        <ConfirmActionDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirmMode === 'restore' ? 'Restore Property' : 'Delete Archived Property'}
          description={
            confirmMode === 'restore'
              ? 'Restore this property to active listings?'
              : 'This will permanently delete the archived property. This action cannot be undone.'
          }
          confirmLabel={confirmMode === 'restore' ? 'Restore' : 'Delete Permanently'}
          confirmVariant={confirmMode === 'restore' ? 'default' : 'danger'}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirm}
        />
      </div>
    </AdminLayout>
  );
}
