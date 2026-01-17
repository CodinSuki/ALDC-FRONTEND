import { useState } from 'react';
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
interface Agent {
  agent_id: number;
  name: string;
  email: string;
  contact_number: string;
  license_number: string;
  status: 'Active' | 'Inactive';
}

interface Broker {
  broker_id: number;
  name: string;
  email: string;
  contact_number: string;
  prc_license: string;
  status: 'Active' | 'Inactive';
}

// Mock data
const initialAgents: Agent[] = [
  {
    agent_id: 1,
    name: 'Robert Martinez',
    email: 'robert.martinez@aldc.ph',
    contact_number: '09171234567',
    license_number: 'AGT-2022-001',
    status: 'Active',
  },
  {
    agent_id: 2,
    name: 'Lisa Chen',
    email: 'lisa.chen@aldc.ph',
    contact_number: '09181234568',
    license_number: 'AGT-2022-002',
    status: 'Active',
  },
  {
    agent_id: 3,
    name: 'Michael Torres',
    email: 'michael.torres@aldc.ph',
    contact_number: '09191234569',
    license_number: 'AGT-2023-003',
    status: 'Inactive',
  },
];

const initialBrokers: Broker[] = [
  {
    broker_id: 1,
    name: 'David Santiago',
    email: 'david.santiago@aldc.ph',
    contact_number: '09201234570',
    prc_license: 'PRC-BRK-2020-001',
    status: 'Active',
  },
  {
    broker_id: 2,
    name: 'Jennifer Lopez',
    email: 'jennifer.lopez@aldc.ph',
    contact_number: '09211234571',
    prc_license: 'PRC-BRK-2021-002',
    status: 'Active',
  },
];

export default function AdminAgents() {
  const [activeTab, setActiveTab] = useState<'agents' | 'brokers'>('agents');
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [brokers, setBrokers] = useState<Broker[]>(initialBrokers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    contact_number: '',
    license_number: '',
    prc_license: '',
    status: 'Active',
  });

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.license_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = 
      broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.prc_license.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || broker.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddAgent = () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.license_number) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newAgent: Agent = {
      agent_id: Math.max(...agents.map(a => a.agent_id), 0) + 1,
      name: formData.name,
      email: formData.email,
      contact_number: formData.contact_number,
      license_number: formData.license_number,
      status: formData.status || 'Active',
    };
    
    setAgents([...agents, newAgent]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleAddBroker = () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.prc_license) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newBroker: Broker = {
      broker_id: Math.max(...brokers.map(b => b.broker_id), 0) + 1,
      name: formData.name,
      email: formData.email,
      contact_number: formData.contact_number,
      prc_license: formData.prc_license,
      status: formData.status || 'Active',
    };
    
    setBrokers([...brokers, newBroker]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditAgent = () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.license_number) {
      alert('Please fill in all required fields');
      return;
    }
    
    const updatedAgent: Agent = {
      agent_id: selectedAgent!.agent_id,
      name: formData.name,
      email: formData.email,
      contact_number: formData.contact_number,
      license_number: formData.license_number,
      status: formData.status || 'Active',
    };
    
    setAgents(agents.map(a => 
      a.agent_id === selectedAgent!.agent_id ? updatedAgent : a
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleEditBroker = () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.prc_license) {
      alert('Please fill in all required fields');
      return;
    }
    
    const updatedBroker: Broker = {
      broker_id: selectedBroker!.broker_id,
      name: formData.name,
      email: formData.email,
      contact_number: formData.contact_number,
      prc_license: formData.prc_license,
      status: formData.status || 'Active',
    };
    
    setBrokers(brokers.map(b => 
      b.broker_id === selectedBroker!.broker_id ? updatedBroker : b
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (activeTab === 'agents' && selectedAgent) {
      setAgents(agents.filter(a => a.agent_id !== selectedAgent.agent_id));
    } else if (activeTab === 'brokers' && selectedBroker) {
      setBrokers(brokers.filter(b => b.broker_id !== selectedBroker.broker_id));
    }
    setIsDeleteDialogOpen(false);
    setSelectedAgent(null);
    setSelectedBroker(null);
  };

  const openEditDialog = (item: Agent | Broker) => {
    if (activeTab === 'agents') {
      const agent = item as Agent;
      setFormData({
        name: agent.name,
        email: agent.email,
        contact_number: agent.contact_number,
        license_number: agent.license_number,
        status: agent.status,
      });
      setSelectedAgent(agent);
    } else {
      const broker = item as Broker;
      setFormData({
        name: broker.name,
        email: broker.email,
        contact_number: broker.contact_number,
        prc_license: broker.prc_license,
        status: broker.status,
      });
      setSelectedBroker(broker);
    }
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: Agent | Broker) => {
    if (activeTab === 'agents') {
      setSelectedAgent(item as Agent);
    } else {
      setSelectedBroker(item as Broker);
    }
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      contact_number: '',
      license_number: '',
      prc_license: '',
      status: 'Active',
    });
    setSelectedAgent(null);
    setSelectedBroker(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Agents & Brokers Management</h2>
            <p className="text-gray-600">Manage agents and brokers in the system</p>
          </div>
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add {activeTab === 'agents' ? 'Agent' : 'Broker'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-2">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'agents'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('brokers')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'brokers'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Brokers
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or license..."
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Contact Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    {activeTab === 'agents' ? 'License Number' : 'PRC License'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'agents' ? (
                  filteredAgents.map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{agent.agent_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {agent.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {agent.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {agent.contact_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.license_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          agent.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => openEditDialog(agent)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteDialog(agent)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredBrokers.map((broker) => (
                    <tr key={broker.broker_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{broker.broker_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {broker.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {broker.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {broker.contact_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {broker.prc_license}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          broker.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {broker.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => openEditDialog(broker)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteDialog(broker)}
                          className="text-red-600 hover:text-red-800"
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

          {((activeTab === 'agents' && filteredAgents.length === 0) || 
            (activeTab === 'brokers' && filteredBrokers.length === 0)) && (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New {activeTab === 'agents' ? 'Agent' : 'Broker'}</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new {activeTab === 'agents' ? 'agent' : 'broker'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="email@aldc.ph"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => handleFormChange('contact_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="09XX XXX XXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  {activeTab === 'agents' ? 'License Number' : 'PRC License'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={activeTab === 'agents' ? formData.license_number : formData.prc_license}
                  onChange={(e) => handleFormChange(activeTab === 'agents' ? 'license_number' : 'prc_license', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={activeTab === 'agents' ? 'AGT-YYYY-XXX' : 'PRC-BRK-YYYY-XXX'}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
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
              onClick={activeTab === 'agents' ? handleAddAgent : handleAddBroker}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add {activeTab === 'agents' ? 'Agent' : 'Broker'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {activeTab === 'agents' ? 'Agent' : 'Broker'}</DialogTitle>
            <DialogDescription>
              Update the {activeTab === 'agents' ? 'agent' : 'broker'} details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => handleFormChange('contact_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  {activeTab === 'agents' ? 'License Number' : 'PRC License'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={activeTab === 'agents' ? formData.license_number : formData.prc_license}
                  onChange={(e) => handleFormChange(activeTab === 'agents' ? 'license_number' : 'prc_license', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
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
              onClick={activeTab === 'agents' ? handleEditAgent : handleEditBroker}
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
              This will permanently delete this {activeTab === 'agents' ? 'agent' : 'broker'}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
