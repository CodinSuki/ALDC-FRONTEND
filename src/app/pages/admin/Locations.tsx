import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Edit, Trash2, Search, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

// Database-aligned interface
interface Location {
  location_id: number;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
}

// Mock usage data
interface LocationUsage {
  projectCount: number;
  propertyCount: number;
  projectNames: string[];
  propertyCodes: string[];
}

const mockLocationUsage: Record<number, LocationUsage> = {
  1: { projectCount: 2, propertyCount: 5, projectNames: ['Laguna Business Hub', 'Santa Rosa Residences'], propertyCodes: ['SR-001', 'SR-002', 'SR-003', 'SR-004', 'SR-005'] },
  2: { projectCount: 1, propertyCount: 3, projectNames: ['Makati Corporate'], propertyCodes: ['MK-001', 'MK-002', 'MK-003'] },
};

const initialLocations: Location[] = [
  { location_id: 1, region: 'CALABARZON', province: 'Laguna', city: 'Santa Rosa', barangay: 'Balibago', street: 'Main Road' },
  { location_id: 2, region: 'CALABARZON', province: 'Batangas', city: 'Lipa', barangay: 'Tambo', street: 'Highway' },
];

export default function AdminLocations() {
  // NOTE: Top-level Locations management is deprecated.
  // Location fields are now managed inside the Property create/edit form to ensure locations
  // are always attached to a Property and to avoid dangling reference data being edited
  // out-of-band. The top-level route has been removed from the sidebar and routing.
  const [locations, setLocations] = useState<Location[]>(initialLocations);

  // Early return: display informative banner to prevent standalone use. The detailed
  // management UI below is retained for reference and can be re-used inside property flows.
  if (true) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800">Locations Page Deprecated</h2>
            <p className="text-sm text-yellow-700 mt-2">Locations are now edited as part of Property create/edit flows. This consolidates location management and prevents inconsistencies across projects and properties.</p>
            <div className="mt-4">
              <a href="/admin/properties" className="text-sm text-blue-600 underline">Go to Properties</a>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Partial<Location>>({
    region: '',
    province: '',
    city: '',
    barangay: '',
    street: '',
  });

  // Helper function to get location usage
  const getLocationUsage = (locationId: number): LocationUsage => {
    return mockLocationUsage[locationId] || { projectCount: 0, propertyCount: 0, projectNames: [], propertyCodes: [] };
  };

  // Check if location is in use
  const isLocationInUse = (locationId: number): boolean => {
    const usage = getLocationUsage(locationId);
    return usage.projectCount > 0 || usage.propertyCount > 0;
  };

  const filteredLocations = locations.filter(location => {
    const searchLower = searchQuery.toLowerCase();
    return (
      location.region.toLowerCase().includes(searchLower) ||
      location.province.toLowerCase().includes(searchLower) ||
      location.city.toLowerCase().includes(searchLower) ||
      location.barangay.toLowerCase().includes(searchLower) ||
      location.street.toLowerCase().includes(searchLower)
    );
  });

  const handleAddLocation = () => {
    if (!formData.region || !formData.province || !formData.city || !formData.barangay || !formData.street) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newLocation: Location = {
      location_id: Math.max(...locations.map(l => l.location_id), 0) + 1,
      region: formData.region!,
      province: formData.province!,
      city: formData.city!,
      barangay: formData.barangay!,
      street: formData.street!,
    };
    
    setLocations([...locations, newLocation]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditLocation = () => {
    if (!formData.region || !formData.province || !formData.city || !formData.barangay || !formData.street) {
      alert('Please fill in all required fields');
      return;
    }
    
    const updatedLocation: Location = {
      location_id: selectedLocation!.location_id,
      region: formData.region!,
      province: formData.province!,
      city: formData.city!,
      barangay: formData.barangay!,
      street: formData.street!,
    };
    
    setLocations(locations.map(l => 
      l.location_id === selectedLocation!.location_id ? updatedLocation : l
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteLocation = () => {
    if (selectedLocation) {
      setLocations(locations.filter(l => l.location_id !== selectedLocation.location_id));
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
    }
  };

  const openEditDialog = (location: Location) => {
    setFormData({
      region: location.region,
      province: location.province,
      city: location.city,
      barangay: location.barangay,
      street: location.street,
    });
    setSelectedLocation(location);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: '',
    });
    setSelectedLocation(null);
  };

  const handleFormChange = (field: keyof Location, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Locations Management</h2>
            <p className="text-gray-600">Manage location reference data for projects and properties</p>
            <div className="mt-2 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Locations are shared reference data. Editing affects all linked projects and properties. Deletion is prevented for locations in use.</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Location
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by region, province, city, barangay, or street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Locations Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Province
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Barangay
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Street
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Used By
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLocations.map((location) => {
                  const usage = getLocationUsage(location.location_id);
                  const inUse = isLocationInUse(location.location_id);
                  return (
                    <tr key={location.location_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{location.location_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.province}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {location.barangay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {location.street}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inUse 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                            inUse ? 'bg-yellow-600' : 'bg-green-600'
                          }`}></span>
                          {inUse ? 'In Use' : 'Unused'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {inUse ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-blue-600 hover:text-blue-800 cursor-help font-medium">
                                {usage.projectCount} Projects • {usage.propertyCount} Properties
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="text-sm space-y-2">
                                  {usage.projectNames.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-white">Projects:</p>
                                      <ul className="text-gray-200 list-disc list-inside">
                                        {usage.projectNames.map((name, idx) => (
                                          <li key={idx}>{name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {usage.propertyCodes.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-white">Properties:</p>
                                      <ul className="text-gray-200 list-disc list-inside">
                                        {usage.propertyCodes.map((code, idx) => (
                                          <li key={idx}>{code}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-gray-400 italic">Unused</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => openEditDialog(location)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {inUse ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  disabled
                                  className="text-gray-400 cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cannot delete: Location is used by {usage.projectCount} project{usage.projectCount !== 1 ? 's' : ''} and {usage.propertyCount} propert{usage.propertyCount === 1 ? 'y' : 'ies'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <button 
                            onClick={() => openDeleteDialog(location)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No locations found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Fill in the location details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleFormChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., CALABARZON"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleFormChange('province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Laguna"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Santa Rosa"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) => handleFormChange('barangay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Balibago"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Street <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleFormChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Main Road"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLocation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Location
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleFormChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleFormChange('province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) => handleFormChange('barangay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Street <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleFormChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditLocation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the location "{selectedLocation?.city}, {selectedLocation?.province}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLocation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
