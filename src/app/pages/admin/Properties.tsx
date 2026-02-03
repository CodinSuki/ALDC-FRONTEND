import { useState, useEffect } from 'react';
import PropertyLocationForm from '@/app/components/ui/PropertyLocationForm';
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

interface Project {
  project_id: number;
  project_name: string;
  project_type: string;
}

interface Landowner {
  landowner_id: number;
  name: string;
}

interface Property {
  property_id: number;
  property_code: string;
  project_id: number;
  landowner_id: number | null;
  property_type_id?: number | null;

  lot_size?: number;
  price?: number;
  status: 'Available' | 'Reserved' | 'Sold';
  location_id?: number;

  // Display helpers
  project_name?: string;
  location_display?: string;
  landowner_name?: string;
  property_type_name?: string;

  // Location fields
  region?: string;
  province?: string;
  city?: string;
  barangay?: string;
  street?: string;
}



interface PropertyType {
  id: number;
  type_name: string;
}


export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [landowners, setLandowners] = useState<Landowner[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Reserved' | 'Sold'>('All');
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const projectIdParam = urlParams.get('projectId');
  const projectIdFilter = projectIdParam ? Number(projectIdParam) : null;

  const [showModal, setShowModal] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<number | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);


  const [formData, setFormData] = useState<Partial<Property>>({
    property_code: '',
    project_id: 0,
    landowner_id: null,
    lot_size: undefined,
    price: undefined,
    status: 'Available',
    region: '',
    province: '',
    city: '',
    barangay: '',
    street: '',
  });

  useEffect(() => {
    // Fetch property types first
    fetch('http://localhost/aldc-system/api/admin/property-types/get_property_types.php')
      .then(res => res.json())
      .then(data => { if (data.success) setPropertyTypes(data.data); })
      .catch(err => console.error('Failed to fetch property types', err));
  }, []);

  useEffect(() => {
    // Fetch properties with joined location & project & landowner
    fetch('http://localhost/aldc-system/api/admin/properties/get_properties.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const mapped: Property[] = data.data.map((item: any) => {
            const propertyType = propertyTypes.find(pt => pt.id === Number(item.property_type_id));
            return {
              property_id: Number(item.property_id),
              property_code: item.property_code,
              project_id: Number(item.project_id),
              landowner_id: item.landowner_id ? Number(item.landowner_id) : null,
              property_type_id: item.property_type_id ? Number(item.property_type_id) : null,
              lot_size: Number(item.lot_size),
              price: Number(item.price),
              status: item.status,
              project_name: item.project_name,
              landowner_name: item.landowner_name,
              property_type_name: propertyType?.type_name,
              location_id: item.location_id ? Number(item.location_id) : undefined,
              region: item.region,
              province: item.province,
              city: item.city,
              barangay: item.barangay,
              street: item.street,
              location_display: [item.street, item.barangay, item.city, item.province, item.region]
                .filter(Boolean)
                .join(', '),
            };
          });
          setProperties(mapped);
        }
      })
      .catch(err => console.error('Failed to fetch properties', err));

    // Fetch projects
    fetch('http://localhost/aldc-system/api/admin/projects/get_projects.php')
      .then(res => res.json())
      .then(data => { if (data.success) setProjects(data.data); });

    // Fetch landowners
    fetch('http://localhost/aldc-system/api/admin/landowners/get_landowners.php')
      .then(res => res.json())
      .then(data => { if (data.success) setLandowners(data.data); });
  }, [propertyTypes]);

  const filteredProperties = properties.filter(p => {
    const matchesSearch =
      p.property_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_display?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchesProject = projectIdFilter ? p.project_id === projectIdFilter : true;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const resetForm = () => {
    setFormData({
      property_code: '',
      project_id: 0,
      landowner_id: null,
      property_type_id: null,
      lot_size: undefined,
      price: undefined,
      status: 'Available',
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: '',
    });
    setEditPropertyId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (property: Property) => {
    setFormData({ ...property });
    setEditPropertyId(property.property_id);
    setShowModal(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field as keyof Property]: value }));
  };

  const handleAddOrUpdateProperty = async () => {
    if (!formData.property_code || !formData.project_id || !formData.city || !formData.lot_size || !formData.price) {
      alert('Please fill all required fields');
      return;
    }

    const endpoint = editPropertyId
      ? 'http://localhost/aldc-system/api/update_property.php'
      : 'http://localhost/aldc-system/api/add_property.php';

    const payload = editPropertyId ? { property_id: editPropertyId, ...formData } : formData;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      // Refresh the property list
      const newProp: Property = {
        ...data.property,
        project_name: projects.find(p => p.project_id === data.property.project_id)?.project_name,
        landowner_name: landowners.find(l => l.landowner_id === data.property.landowner_id)?.name,
        location_display: [data.property.street, data.property.barangay, data.property.city, data.property.province, data.property.region]
          .filter(Boolean)
          .join(', '),
        region: data.property.region,
        province: data.property.province,
        city: data.property.city,
        barangay: data.property.barangay,
        street: data.property.street,
      };

      setProperties(prev => {
        if (editPropertyId) {
          return prev.map(p => p.property_id === editPropertyId ? newProp : p);
        }
        return [...prev, newProp];    
      });

      setShowModal(false);
      resetForm();
    } else {
      alert('Error saving property');
    }
  };

  const handleDeleteProperty = async (property_id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    const res = await fetch(`http://localhost/aldc-system/api/delete_property.php?property_id=${property_id}`);
    const data = await res.json();
    if (data.success) {
      setProperties(prev => prev.filter(p => p.property_id !== property_id));
    } else {
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
                placeholder="Search by property code, project, or location..."
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
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property Code</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Landowner</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property Type</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Lot Size</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProperties.map(p => (
                  <tr key={p.property_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.property_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{p.project_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.location_display}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.landowner_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.property_type_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.lot_size?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">₱{p.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        p.status === 'Available' ? 'bg-green-100 text-green-800' :
                        p.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => openEditModal(p)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProperty(p.property_id)} className="text-red-600 hover:text-red-800">
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
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPropertyId ? 'Edit Property' : 'Add Property'}</DialogTitle>
              <DialogDescription>
                {editPropertyId ? 'Update the property details' : 'Fill in the details to add a new property'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Property & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Property Code</label>
                  <input
                    type="text"
                    value={formData.property_code || ''}
                    onChange={e => handleFormChange('property_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Project</label>
                  <select
                    value={formData.project_id || ''}
                    onChange={e => handleFormChange('project_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_name} ({p.project_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Inputs (consolidated) */}
              <PropertyLocationForm
                region={formData.region}
                province={formData.province}
                city={formData.city}
                barangay={formData.barangay}
                street={formData.street}
                onChange={handleFormChange}
              />

              {/* Landowner, Lot Size, Price, Status, Property type*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Landowner</label>
                  <select
                    value={formData.landowner_id || ''}
                    onChange={e => handleFormChange('landowner_id', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Landowner (Optional)</option>
                    {landowners.map(l => (
                      <option key={l.landowner_id} value={l.landowner_id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lot_size || ''}
                    onChange={e => handleFormChange('lot_size', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={e => handleFormChange('price', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleFormChange('status', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={formData.property_type_id || ''}
                    onChange={e =>
                      handleFormChange(
                        'property_type_id',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Property Type</option>
                    {propertyTypes.map(pt => (
                      <option key={pt.id} value={pt.id}>
                        {pt.type_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateProperty}
                className={`ml-2 px-4 py-2 rounded-lg text-white ${editPropertyId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {editPropertyId ? 'Update Property' : 'Add Property'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
