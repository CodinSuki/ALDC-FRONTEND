import { useEffect, useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/app/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle, } from '@/app/components/ui/alert-dialog';
import { fetchStaff, type StaffRow } from '@/app/services/adminService';
import { 
  fetchAgents, 
  fetchBrokers, 
  createAgent, 
  createBroker, 
  updateAgent, 
  updateBroker, 
  deleteAgent, 
  deleteBroker,
  type Agent as AgentType,
  type Broker as BrokerType
} from '@/app/services/agentService';
import PersonnelDialog from './components/personnel/PersonnelDialog';

type Agent = AgentType;
type Broker = BrokerType;
type Staff = StaffRow;

export default function AdminAgents() {
  const [activeTab, setActiveTab] = useState<'agents' | 'brokers' | 'staff'>('staff');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>
  ({

  
    name: '',
    email: '',
    contact_number: '',
    license_number: '',
    prc_license: '',
    department: '',
    position: '',
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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (activeTab !== 'staff') {
      return;
    }

    let isMounted = true;

    const loadStaff = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const rows = await fetchStaff();
        if (isMounted) {
          setStaff(rows);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load staff records');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStaff();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Load agents when agents tab is active
  useEffect(() => {
    if (activeTab !== 'agents') {
      return;
    }

    let isMounted = true;

    const loadAgents = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const rows = await fetchAgents();
        if (isMounted) {
          setAgents(rows);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load agents');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAgents();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Load brokers when brokers tab is active
  useEffect(() => {
    if (activeTab !== 'brokers') {
      return;
    }

    let isMounted = true;

    const loadBrokers = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const rows = await fetchBrokers();
        if (isMounted) {
          setBrokers(rows);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load brokers');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBrokers();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleAddAgent = async () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.license_number) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const newAgent = await createAgent({
        name: formData.name,
        email: formData.email,
        contact_number: formData.contact_number,
        license_number: formData.license_number,
        status: formData.status || 'Active',
      });
      
      setAgents([...agents, newAgent]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBroker = async () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.prc_license) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const newBroker = await createBroker({
        name: formData.name,
        email: formData.email,
        contact_number: formData.contact_number,
        prc_license: formData.prc_license,
        status: formData.status || 'Active',
      });
      
      setBrokers([...brokers, newBroker]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create broker');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.department || !formData.position) {
      alert('Please fill in all required fields');
      return;
    }

    const newStaff: Staff = {
      staff_id: Math.max(...staff.map(s => s.staff_id), 0) + 1,
      name: formData.name,
      email: formData.email,
      contact_number: formData.contact_number,
      department: formData.department,
      position: formData.position,
      status: formData.status || 'Active',
    };

    setStaff([...staff, newStaff]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditAgent = async () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.license_number) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!selectedAgent) return;

    try {
      setLoading(true);
      const updatedAgent = await updateAgent(selectedAgent.agent_id, {
        name: formData.name,
        email: formData.email,
        contact_number: formData.contact_number,
        license_number: formData.license_number,
        status: formData.status || 'Active',
      });
      
      setAgents(agents.map(a => 
        a.agent_id === selectedAgent.agent_id ? updatedAgent : a
      ));
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update agent');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBroker = async () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.prc_license) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!selectedBroker) return;

    try {
      setLoading(true);
      const updatedBroker = await updateBroker(selectedBroker.broker_id, {
        name: formData.name,
        email: formData.email,
        contact_number: formData.contact_number,
        prc_license: formData.prc_license,
        status: formData.status || 'Active',
      });
      
      setBrokers(brokers.map(b => 
        b.broker_id === selectedBroker.broker_id ? updatedBroker : b
      ));
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update broker');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = () => {
    if (!formData.name || !formData.email || !formData.contact_number || !formData.department || !formData.position) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedStaff: Staff = {
      staff_id: selectedStaff!.staff_id,
      name: formData.name,
      email: formData.email,
      contact_number: formData.contact_number,
      department: formData.department,
      position: formData.position,
      status: formData.status || 'Active',
    };

    setStaff(staff.map(s =>
      s.staff_id === selectedStaff!.staff_id ? updatedStaff : s
    ));
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'agents' && selectedAgent) {
        await deleteAgent(selectedAgent.agent_id);
        setAgents(agents.filter(a => a.agent_id !== selectedAgent.agent_id));
      } else if (activeTab === 'brokers' && selectedBroker) {
        await deleteBroker(selectedBroker.broker_id);
        setBrokers(brokers.filter(b => b.broker_id !== selectedBroker.broker_id));
      } else if (activeTab === 'staff' && selectedStaff) {
        setStaff(staff.filter(s => s.staff_id !== selectedStaff.staff_id));
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedAgent(null);
      setSelectedBroker(null);
      setSelectedStaff(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleAddByType = () => {
    if (activeTab === 'agents') {
      handleAddAgent();
      return;
    }

    if (activeTab === 'brokers') {
      handleAddBroker();
      return;
    }

    handleAddStaff();
  };

  const openEditDialog = (item: Agent | Broker | Staff) => {
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
    } else if (activeTab === 'brokers') {
      const broker = item as Broker;
      setFormData({
        name: broker.name,
        email: broker.email,
        contact_number: broker.contact_number,
        prc_license: broker.prc_license,
        status: broker.status,
      });
      setSelectedBroker(broker);
    } else {
      const member = item as Staff;
      setFormData({
        name: member.name,
        email: member.email,
        contact_number: member.contact_number,
        department: member.department,
        position: member.position,
        status: member.status,
      });
      setSelectedStaff(member);
    }
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: Agent | Broker | Staff) => {
    if (activeTab === 'agents') {
      setSelectedAgent(item as Agent);
    } else if (activeTab === 'brokers') {
      setSelectedBroker(item as Broker);
    } else {
      setSelectedStaff(item as Staff);
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
      department: '',
      position: '',
      status: 'Active',
    });
    setSelectedAgent(null);
    setSelectedBroker(null);
    setSelectedStaff(null);
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
            Add {activeTab === 'agents' ? 'Agent' : activeTab === 'brokers' ? 'Broker' : 'Staff'}
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
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'staff'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, license, department, or position..."
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
          {loading && (
            <div className="px-6 py-3 text-sm text-gray-500 border-b border-gray-200">
              Loading {activeTab === 'agents' ? 'agents' : activeTab === 'brokers' ? 'brokers' : 'staff'}...
            </div>
          )}
          {loadError && (
            <div className="px-6 py-3 text-sm text-red-600 border-b border-gray-200">{loadError}</div>
          )}
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
                    {activeTab === 'agents' ? 'License Number' : activeTab === 'brokers' ? 'PRC License' : 'Department / Position'}
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
                ) : activeTab === 'brokers' ? (
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
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member.staff_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{member.staff_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.contact_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.department} / {member.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => openEditDialog(member)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteDialog(member)}
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
            (activeTab === 'brokers' && filteredBrokers.length === 0) ||
            (activeTab === 'staff' && filteredStaff.length === 0)) && (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <PersonnelDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        type={activeTab}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleAddByType}
        onCancel={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {activeTab === 'agents' ? 'Agent' : activeTab === 'brokers' ? 'Broker' : 'Staff'}</DialogTitle>
            <DialogDescription>
              Update the {activeTab === 'agents' ? 'agent' : activeTab === 'brokers' ? 'broker' : 'staff member'} details
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

            {activeTab === 'staff' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
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
            ) : (
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
            )}
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
              onClick={activeTab === 'agents' ? handleEditAgent : activeTab === 'brokers' ? handleEditBroker : handleEditStaff}
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
              This will permanently delete this {activeTab === 'agents' ? 'agent' : activeTab === 'brokers' ? 'broker' : 'staff member'}.
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
