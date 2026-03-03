import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import PropertyDialog from './components/property/PropertyDialog';
import {
  createAdminProperty,
  deleteAdminProperty,
  fetchAdminPropertyData,
  fetchAdminPropertyDetails,
  updateAdminProperty,
  type AgriculturalLotTypeOption,
  type AdminProperty,
  type ProjectOption,
  type PropertyDetailPayload,
  type PropertyListingStatusOption,
  type PropertyPayload,
  type PropertyTypeOption,
  type SellerOption,
  type UrbanLotTypeOption,
} from '@/app/services/adminPropertyService';

export default function AdminProperties() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [listingStatuses, setListingStatuses] = useState<PropertyListingStatusOption[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const projectIdParam = urlParams.get('projectId');
  const projectIdFilter = projectIdParam ? Number(projectIdParam) : null;

  const [showModal, setShowModal] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<number | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [urbanLotTypes, setUrbanLotTypes] = useState<UrbanLotTypeOption[]>([]);
  const [agriculturalLotTypes, setAgriculturalLotTypes] = useState<AgriculturalLotTypeOption[]>([]);


  const [formData, setFormData] = useState<Partial<AdminProperty>>({
    propertyname: '',
    projectid: 0,
    sellerclientid: null,
    propertytypeid: null,
    propertylistingstatusid: 0,
    propertyownershipid: null,
    location_island: 'Luzon',
    location_region: '',
    location_province: '',
    location_city: '',
    location_barangay: '',
    location_street: '',
    lot_size: 0,
    urbanreflottypeid: null,
    utilities_water: false,
    utilities_electricity: false,
    utilities_sim: false,
    utilities_internet: false,
    access_motorcycle: false,
    access_car: false,
    access_truck: false,
    access_road: false,
    access_cemented_road: false,
    access_rough_road: false,
    facilities_gated: false,
    facilities_security: false,
    facilities_clubhouse: false,
    facilities_sports: false,
    facilities_parks: false,
    agriculturalreflottypeids: [],
    agri_hasfarmhouse: false,
    agri_hasbarns: false,
    agri_haswarehousestorage: false,
    agri_hasriversstreams: false,
    agri_hasirrigationcanal: false,
    agri_haslakelagoon: false,
  });

  const buildPayload = (): PropertyPayload => ({
    propertyname: formData.propertyname ?? '',
    projectid: Number(formData.projectid),
    sellerclientid: formData.sellerclientid ?? null,
    propertytypeid: formData.propertytypeid ?? null,
    propertylistingstatusid: Number(formData.propertylistingstatusid),
    propertyownershipid: formData.propertyownershipid ?? null,
  });

  const buildDetailPayload = (): PropertyDetailPayload => ({
    location_island: String(formData.location_island ?? 'Luzon'),
    location_region: String(formData.location_region ?? ''),
    location_province: String(formData.location_province ?? ''),
    location_city: String(formData.location_city ?? ''),
    location_barangay: String(formData.location_barangay ?? ''),
    location_street: String(formData.location_street ?? ''),
    lot_size: Number(formData.lot_size ?? 0),
    urbanreflottypeid: formData.urbanreflottypeid ? Number(formData.urbanreflottypeid) : null,
    utilities_water: Boolean(formData.utilities_water),
    utilities_electricity: Boolean(formData.utilities_electricity),
    utilities_sim: Boolean(formData.utilities_sim),
    utilities_internet: Boolean(formData.utilities_internet),
    access_motorcycle: Boolean(formData.access_motorcycle),
    access_car: Boolean(formData.access_car),
    access_truck: Boolean(formData.access_truck),
    access_road: Boolean(formData.access_road),
    access_cemented_road: Boolean(formData.access_cemented_road),
    access_rough_road: Boolean(formData.access_rough_road),
    facilities_gated: Boolean(formData.facilities_gated),
    facilities_security: Boolean(formData.facilities_security),
    facilities_clubhouse: Boolean(formData.facilities_clubhouse),
    facilities_sports: Boolean(formData.facilities_sports),
    facilities_parks: Boolean(formData.facilities_parks),
    agriculturalreflottypeids: (formData.agriculturalreflottypeids as number[] | undefined) ?? [],
    agri_hasfarmhouse: Boolean(formData.agri_hasfarmhouse),
    agri_hasbarns: Boolean(formData.agri_hasbarns),
    agri_haswarehousestorage: Boolean(formData.agri_haswarehousestorage),
    agri_hasriversstreams: Boolean(formData.agri_hasriversstreams),
    agri_hasirrigationcanal: Boolean(formData.agri_hasirrigationcanal),
    agri_haslakelagoon: Boolean(formData.agri_haslakelagoon),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAdminPropertyData();

        setPropertyTypes(data.propertyTypes);
        setProjects(data.projects);
        setSellers(data.sellers);
        setListingStatuses(data.listingStatuses);
        setUrbanLotTypes(data.urbanLotTypes);
        setAgriculturalLotTypes(data.agriculturalLotTypes);
        setProperties(data.properties);
      } catch (err) {
        console.error('Failed to fetch properties data', err);
      }
    };

    loadData();
  }, []);

  const filteredProperties = properties.filter(p => {
    const matchesSearch =
      p.propertyname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.property_type_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.listing_status_name === filterStatus;
    const matchesProject = projectIdFilter ? p.projectid === projectIdFilter : true;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const resetForm = () => {
    setFormData({
      propertyname: '',
      projectid: 0,
      sellerclientid: null,
      propertytypeid: null,
      propertylistingstatusid: 0,
      propertyownershipid: null,
      location_island: 'Luzon',
      location_region: '',
      location_province: '',
      location_city: '',
      location_barangay: '',
      location_street: '',
      lot_size: 0,
      urbanreflottypeid: null,
      utilities_water: false,
      utilities_electricity: false,
      utilities_sim: false,
      utilities_internet: false,
      access_motorcycle: false,
      access_car: false,
      access_truck: false,
      access_road: false,
      access_cemented_road: false,
      access_rough_road: false,
      facilities_gated: false,
      facilities_security: false,
      facilities_clubhouse: false,
      facilities_sports: false,
      facilities_parks: false,
      agriculturalreflottypeids: [],
      agri_hasfarmhouse: false,
      agri_hasbarns: false,
      agri_haswarehousestorage: false,
      agri_hasriversstreams: false,
      agri_hasirrigationcanal: false,
      agri_haslakelagoon: false,
    });
    setEditPropertyId(null);
  };



  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = async (property: AdminProperty) => {
    try {
      const detailData = await fetchAdminPropertyDetails(property.propertyid);

      setFormData({
        ...property,
        ...detailData,
        projectid: property.projectid,
        propertytypeid: property.propertytypeid ?? null,
        sellerclientid: property.sellerclientid ?? null,
        propertylistingstatusid: property.propertylistingstatusid,
        propertyownershipid: property.propertyownershipid ?? null,
      });
      setEditPropertyId(property.propertyid);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load property details for edit', error);
      alert('Failed to load complete property details. Please try again.');
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field as keyof AdminProperty]: value }));
  };

  const handleAddOrUpdateProperty = async () => {
    if (
      !formData.propertyname ||
      !formData.projectid ||
      !formData.propertylistingstatusid ||
      !formData.location_region ||
      !formData.location_province ||
      !formData.location_city ||
      !formData.location_barangay ||
      !formData.location_street ||
      !formData.lot_size
    ) {
      alert('Please fill all required fields');
      return;
    }

    const payload = buildPayload();
    const detailPayload = buildDetailPayload();
    const lookup = {
      projects,
      sellers,
      propertyTypes,
      listingStatuses,
    };

    try {
      const newProp = editPropertyId
        ? await updateAdminProperty(editPropertyId, payload, detailPayload, lookup)
        : await createAdminProperty(payload, detailPayload, lookup);

      setProperties(prev => {
        if (editPropertyId) {
          return prev.map(p => (p.propertyid === editPropertyId ? newProp : p));
        }
        return [...prev, newProp];
      });

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving property', error);
      alert('Error saving property');
    }
  };

  const handleDeleteProperty = async (property_id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await deleteAdminProperty(property_id);
      setProperties(prev => prev.filter(p => p.propertyid !== property_id));
    } catch {
      alert('Error deleting property');
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
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
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
                      <button onClick={() => openEditModal(p)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProperty(p.propertyid)} className="text-red-600 hover:text-red-800">
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

        {/* Add/Edit Dialog */}
        <PropertyDialog
          open={showModal}
          onOpenChange={setShowModal}
          formData={formData}
          projects={projects}
          sellers={sellers}
          propertyTypes={propertyTypes}
          listingStatuses={listingStatuses}
          urbanLotTypes={urbanLotTypes}
          agriculturalLotTypes={agriculturalLotTypes}
          onChange={handleFormChange}
          onSubmit={handleAddOrUpdateProperty}
          onCancel={() => setShowModal(false)}
          isEditMode={Boolean(editPropertyId)}
        />
      </div>
    </AdminLayout>
  );
}
