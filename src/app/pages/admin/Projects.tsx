import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
  type Project,
} from '@/app/services/projectService';
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

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    project_name: '',
    project_description: '',
  });

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);

      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
        alert('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const projectStatuses = useMemo(
    () => Array.from(new Set(projects.map((project) => project.project_status))).sort(),
    [projects]
  );

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location_display?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || project.project_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const generateProjectCode = () => {
    const suffix = `${Date.now()}`.slice(-6);
    return `PRJ-${suffix}`;
  };

  const handleAddProject = async () => {
    if (!formData.project_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const createdProject = await createProject({
        projectcode: generateProjectCode(),
        projectname: formData.project_name,
        projectdescription: formData.project_description || null,
      });

      setProjects((prev) => [...prev, createdProject]);
      setIsAddDialogOpen(false);
      resetForm();

      alert('Project created. Add at least one property now to complete setup.');
      navigate(`/admin/properties?projectId=${createdProject.project_id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !formData.project_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const updatedProject = await updateProject(selectedProject.project_id, {
        projectname: formData.project_name,
        projectdescription: formData.project_description || null,
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.project_id === selectedProject.project_id ? updatedProject : project
        )
      );
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) {
      return;
    }

    if (selectedProject.property_count > 0) {
      alert('Cannot delete a project with linked properties.');
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      return;
    }

    try {
      await deleteProject(selectedProject.project_id);

      setProjects((prev) => prev.filter((project) => project.project_id !== selectedProject.project_id));
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  const openEditDialog = (project: Project) => {
    setFormData({
      project_name: project.project_name,
      project_description: project.project_description,
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
      project_description: '',
    });
    setSelectedProject(null);
  };

  const handleFormChange = (field: keyof Project | 'project_description', value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Projects Management</h2>
            <p className="text-gray-600">Manage project folders for grouped properties</p>
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
                placeholder="Search by project code, name, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="All">All Statuses</option>
              {projectStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
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
                    Project Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading projects...
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      #{project.project_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {project.project_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {project.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {project.project_status}
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
                        onClick={() => navigate(`/admin/properties?projectId=${project.project_id}`)}
                        className="text-green-600 hover:text-green-800 mr-3"
                        title="View properties for this project"
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
                        className={`text-red-600 hover:text-red-800 ${project.property_count > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={project.property_count > 0}
                        title={project.property_count > 0 ? 'Cannot delete projects with linked properties' : 'Delete project'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredProjects.length === 0 && (
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
              Create a project folder, then add at least one property under it.
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
                Description
              </label>
              <textarea
                value={formData.project_description || ''}
                onChange={(e) => handleFormChange('project_description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                placeholder="Optional project description"
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
              onClick={handleAddProject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Project
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
              Update project details
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
                Description
              </label>
              <textarea
                value={formData.project_description || ''}
                onChange={(e) => handleFormChange('project_description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                placeholder="Optional project description"
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
              Projects with linked properties cannot be deleted.
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
