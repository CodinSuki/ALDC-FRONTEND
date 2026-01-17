import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
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

// Database-aligned interfaces
interface Project {
  project_id: number;
  project_name: string;
  project_type: 'Subdivision' | 'Farm' | 'Resort' | 'Other';
  location_id: number;
  // Joined data for display
  location_display?: string;
  property_count?: number;
}

interface Location {
  location_id: number;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
}

// Mock data
const mockLocations: Location[] = [
  { location_id: 1, region: 'CALABARZON', province: 'Laguna', city: 'Santa Rosa', barangay: 'Balibago', street: 'Main Road' },
  { location_id: 2, region: 'CALABARZON', province: 'Batangas', city: 'Lipa', barangay: 'Tambo', street: 'Highway' },
  { location_id: 3, region: 'NCR', province: 'Metro Manila', city: 'Makati', barangay: 'Poblacion', street: 'Ayala Avenue' },
  { location_id: 4, region: 'Central Luzon', province: 'Bataan', city: 'Morong', barangay: 'Sabang', street: 'Beach Road' },
  { location_id: 5, region: 'CALABARZON', province: 'Cavite', city: 'General Trias', barangay: 'San Francisco', street: 'Industrial Ave' },
];

const initialProjects: Project[] = [
  { 
    project_id: 1, 
    project_name: 'Vista Verde Subdivision', 
    project_type: 'Subdivision', 
    location_id: 1,
    location_display: 'Santa Rosa, Laguna',
    property_count: 45
  },
  { 
    project_id: 2, 
    project_name: 'Greenfield Agricultural Estate', 
    project_type: 'Farm', 
    location_id: 2,
    location_display: 'Lipa, Batangas',
    property_count: 28
  },
  { 
    project_id: 3, 
    project_name: 'Metro Business Center', 
    project_type: 'Other', 
    location_id: 3,
    location_display: 'Makati, Metro Manila',
    property_count: 52
  },
  { 
    project_id: 4, 
    project_name: 'Sunrise Beach Resort', 
    project_type: 'Resort', 
    location_id: 4,
    location_display: 'Morong, Bataan',
    property_count: 18
  },
  { 
    project_id: 5, 
    project_name: 'Industrial Park Zone', 
    project_type: 'Other', 
    location_id: 5,
    location_display: 'General Trias, Cavite',
    property_count: 13
  },
];

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [locations] = useState<Location[]>(mockLocations);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    project_name: '',
    project_type: 'Subdivision',
    location_id: 0,
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location_display?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || project.project_type === filterType;
    return matchesSearch && matchesType;
  });

  const getLocationDisplay = (locationId: number): string => {
    const location = locations.find(l => l.location_id === locationId);
    return location ? `${location.city}, ${location.province}` : 'Unknown';
  };

  const handleAddProject = () => {
    if (!formData.project_name || !formData.location_id) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newProject: Project = {
      project_id: Math.max(...projects.map(p => p.project_id), 0) + 1,
      project_name: formData.project_name!,
      project_type: formData.project_type || 'Subdivision',
      location_id: formData.location_id!,
      location_display: getLocationDisplay(formData.location_id!),
      property_count: 0,
    };
    
    setProjects([...projects, newProject]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditProject = () => {
    if (!formData.project_name || !formData.location_id) {
      alert('Please fill in all required fields');
      return;
    }
    
    const updatedProject: Project = {
      project_id: selectedProject!.project_id,
      project_name: formData.project_name!,
      project_type: formData.project_type || 'Subdivision',
      location_id: formData.location_id!,
      location_display: getLocationDisplay(formData.location_id!),
      property_count: selectedProject!.property_count,
    };
    
    setProjects(projects.map(p => 
      p.project_id === selectedProject!.project_id ? updatedProject : p
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      setProjects(projects.filter(p => p.project_id !== selectedProject.project_id));
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const openEditDialog = (project: Project) => {
    setFormData({
      project_name: project.project_name,
      project_type: project.project_type,
      location_id: project.location_id,
    });
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      project_name: '',
      project_type: 'Subdivision',
      location_id: 0,
    });
    setSelectedProject(null);
  };

  const handleFormChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Projects Management</h2>
            <p className="text-gray-600">Manage all real estate projects</p>
          </div>
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by project name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Subdivision">Subdivision</option>
              <option value="Farm">Farm</option>
              <option value="Resort">Resort</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Project ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Project Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      #{project.project_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {project.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        project.project_type === 'Subdivision' ? 'bg-blue-100 text-blue-800' :
                        project.project_type === 'Farm' ? 'bg-green-100 text-green-800' :
                        project.project_type === 'Resort' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.project_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {project.location_display}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.property_count} properties
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        className="text-green-600 hover:text-green-800 mr-3"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditDialog(project)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteDialog(project)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No projects found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Add Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new project to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => handleFormChange('project_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Vista Verde Subdivision"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Project Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => handleFormChange('project_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Subdivision">Subdivision</option>
                <option value="Farm">Farm</option>
                <option value="Resort">Resort</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.location_id || ''}
                onChange={(e) => handleFormChange('location_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location.location_id} value={location.location_id}>
                    {location.city}, {location.province} - {location.region}
                  </option>
                ))}
              </select>
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
              onClick={handleAddProject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Project
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => handleFormChange('project_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Project Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => handleFormChange('project_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Subdivision">Subdivision</option>
                <option value="Farm">Farm</option>
                <option value="Resort">Resort</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.location_id || ''}
                onChange={(e) => handleFormChange('location_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location.location_id} value={location.location_id}>
                    {location.city}, {location.province} - {location.region}
                  </option>
                ))}
              </select>
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
              onClick={handleEditProject}
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
              This will permanently delete the project "{selectedProject?.project_name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
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
