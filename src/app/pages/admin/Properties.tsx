import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export default function AdminProperties() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // --- State for properties ---
  const [properties, setProperties] = useState([
    { property_id: 1, name: 'Vista Verde Subdivision', type: 'Residential', location: 'Laguna', status: 'Available', project_id: 1, location_id: 1, landowner_id: 1, property_code: 'P001', lot_size: 100, price: 500000 }
    // You can keep initial mock or fetch from backend with useEffect
  ]);

  // --- State for Add/Edit modal ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProperty, setNewProperty] = useState({
  project_id: '',
  location_id: '',
  landowner_id: '',
  property_code: '',
  name: '',          // <-- added
  type: '',          // <-- added
  location: '',      // <-- added
  lot_size: '',
  price: '',
  status: 'Available'
});

  const [editPropertyId, setEditPropertyId] = useState<number | null>(null);

  // --- Filtered properties based on search and status ---
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          property.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || property.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- Handlers for Add/Edit/Delete ---

  // Add a new property
  const handleAddProperty = async () => {
    const res = await fetch('http://localhost/aldc-system/api/add_property.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProperty)
    });
    const data = await res.json();
    if (data.success) {
      setProperties(prev => [...prev, data.property]);
      setShowAddModal(false);
      setNewProperty({
        project_id: '',
        location_id: '',
        landowner_id: '',
        property_code: '',
        name: '',       // added
        type: '',       // added
        location: '',   // added
        lot_size: '',
        price: '',
        status: 'Available'
      });
    } else {
      alert('Error adding property');
    }
  };

  // Open edit modal
  const handleEditProperty = (property: any) => {
    setEditPropertyId(property.property_id);
    setNewProperty({
      project_id: '',
      location_id: '',
      landowner_id: '',
      property_code: '',
      name: '',       // added
      type: '',       // added
      location: '',   // added
      lot_size: '',
      price: '',
      status: 'Available'
    });
    setShowAddModal(true);
  };

  // Update existing property
  const handleUpdateProperty = async () => {
    if (!editPropertyId) return;
    const res = await fetch('http://localhost/aldc-system/api/update_property.php', {
      method: 'POST', // could also be PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: editPropertyId, ...newProperty })
    });
    const data = await res.json();
    if (data.success) {
      setProperties(prev => prev.map(p => p.property_id === editPropertyId ? data.property : p));
      setEditPropertyId(null);
      setShowAddModal(false);
    } else {
      alert('Error updating property');
    }
  };

  // Delete property
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
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => { setShowAddModal(true); setEditPropertyId(null); }}
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
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Property ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property.property_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.property_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{property.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{property.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{property.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        property.status === 'Available' ? 'bg-green-100 text-green-800' :
                        property.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleEditProperty(property)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProperty(property.property_id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No properties found matching your criteria
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">{editPropertyId ? 'Edit Property' : 'Add Property'}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Property Code"
                  value={newProperty.property_code}
                  onChange={(e) => setNewProperty({ ...newProperty, property_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Name"
                  value={newProperty.name || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Type"
                  value={newProperty.type || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newProperty.location || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Lot Size"
                  value={newProperty.lot_size || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, lot_size: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newProperty.price || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <select
                  value={newProperty.status}
                  onChange={(e) => setNewProperty({ ...newProperty, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button className="px-4 py-2 border rounded" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={editPropertyId ? handleUpdateProperty : handleAddProperty}
                >
                  {editPropertyId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
