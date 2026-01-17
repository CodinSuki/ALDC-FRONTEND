import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Eye, ArrowRight, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

// Database-aligned interfaces
interface Inquiry {
  inquiry_id: number;
  client_id: number;
  property_id: number;
  inquiry_date: string;
  status: 'Pending' | 'Converted' | 'Closed';
  notes: string;
  // Joined data for display
  client_name?: string;
  property_code?: string;
  project_name?: string;
}

interface Client {
  client_id: number;
  name: string;
  email: string;
  contact_number: string;
}

interface Property {
  property_id: number;
  property_code: string;
  project_name: string;
}

// Mock data
const mockClients: Client[] = [
  { client_id: 1, name: 'Juan Santos', email: 'juan.santos@email.com', contact_number: '09171234567' },
  { client_id: 2, name: 'Maria Garcia', email: 'maria.garcia@email.com', contact_number: '09181234567' },
  { client_id: 3, name: 'Carlos Reyes', email: 'carlos.reyes@email.com', contact_number: '09191234567' },
  { client_id: 4, name: 'Ana Lopez', email: 'ana.lopez@email.com', contact_number: '09201234567' },
  { client_id: 5, name: 'Pedro Cruz', email: 'pedro.cruz@email.com', contact_number: '09211234567' },
];

const mockProperties: Property[] = [
  { property_id: 1, property_code: 'VV-BLK1-LOT5', project_name: 'Vista Verde Subdivision' },
  { property_id: 2, property_code: 'GF-FARM-A12', project_name: 'Greenfield Agricultural Estate' },
  { property_id: 3, property_code: 'MBC-FL5-U501', project_name: 'Metro Business Center' },
  { property_id: 4, property_code: 'SBR-LOT-B8', project_name: 'Sunrise Beach Resort' },
  { property_id: 5, property_code: 'IPZ-WARE-W3', project_name: 'Industrial Park Zone' },
];

const initialInquiries: Inquiry[] = [
  {
    inquiry_id: 1,
    client_id: 1,
    property_id: 1,
    inquiry_date: '2026-01-14',
    status: 'Pending',
    notes: 'Interested in lot size and payment terms',
    client_name: 'Juan Santos',
    property_code: 'VV-BLK1-LOT5',
    project_name: 'Vista Verde Subdivision',
  },
  {
    inquiry_id: 2,
    client_id: 2,
    property_id: 2,
    inquiry_date: '2026-01-13',
    status: 'Pending',
    notes: 'Asking about agricultural zoning requirements',
    client_name: 'Maria Garcia',
    property_code: 'GF-FARM-A12',
    project_name: 'Greenfield Agricultural Estate',
  },
  {
    inquiry_id: 3,
    client_id: 3,
    property_id: 3,
    inquiry_date: '2026-01-12',
    status: 'Converted',
    notes: 'Ready to proceed with purchase',
    client_name: 'Carlos Reyes',
    property_code: 'MBC-FL5-U501',
    project_name: 'Metro Business Center',
  },
  {
    inquiry_id: 4,
    client_id: 4,
    property_id: 4,
    inquiry_date: '2026-01-11',
    status: 'Pending',
    notes: 'Requesting site visit',
    client_name: 'Ana Lopez',
    property_code: 'SBR-LOT-B8',
    project_name: 'Sunrise Beach Resort',
  },
  {
    inquiry_id: 5,
    client_id: 5,
    property_id: 5,
    inquiry_date: '2026-01-10',
    status: 'Closed',
    notes: 'Client decided not to proceed',
    client_name: 'Pedro Cruz',
    property_code: 'IPZ-WARE-W3',
    project_name: 'Industrial Park Zone',
  },
];

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [clients] = useState<Client[]>(mockClients);
  const [properties] = useState<Property[]>(mockProperties);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [formData, setFormData] = useState<Partial<Inquiry>>({
    client_id: 0,
    property_id: 0,
    inquiry_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    notes: '',
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.property_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || inquiry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId: number): string => {
    return clients.find(c => c.client_id === clientId)?.name || 'Unknown';
  };

  const getPropertyDisplay = (propertyId: number): { code: string; project: string } => {
    const property = properties.find(p => p.property_id === propertyId);
    return property 
      ? { code: property.property_code, project: property.project_name }
      : { code: 'Unknown', project: 'Unknown' };
  };

  const handleAddInquiry = () => {
    if (!formData.client_id || !formData.property_id || !formData.inquiry_date) {
      alert('Please fill in all required fields');
      return;
    }
    
    const propertyDisplay = getPropertyDisplay(formData.property_id!);
    const newInquiry: Inquiry = {
      inquiry_id: Math.max(...inquiries.map(i => i.inquiry_id), 0) + 1,
      client_id: formData.client_id!,
      property_id: formData.property_id!,
      inquiry_date: formData.inquiry_date!,
      status: formData.status || 'Pending',
      notes: formData.notes || '',
      client_name: getClientName(formData.client_id!),
      property_code: propertyDisplay.code,
      project_name: propertyDisplay.project,
    };
    
    setInquiries([...inquiries, newInquiry]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleConvertToTransaction = (inquiry: Inquiry) => {
    if (confirm(`Convert inquiry #${inquiry.inquiry_id} to transaction?`)) {
      setInquiries(inquiries.map(i => 
        i.inquiry_id === inquiry.inquiry_id 
          ? { ...i, status: 'Converted' as const }
          : i
      ));
      alert('Inquiry converted! Redirecting to Transactions page...');
      // In a real app, this would navigate to the transactions page
    }
  };

  const handleUpdateStatus = (inquiryId: number, newStatus: 'Pending' | 'Converted' | 'Closed') => {
    setInquiries(inquiries.map(i => 
      i.inquiry_id === inquiryId 
        ? { ...i, status: newStatus }
        : i
    ));
  };

  const openViewDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      client_id: 0,
      property_id: 0,
      inquiry_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: '',
    });
  };

  const handleFormChange = (field: keyof Inquiry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Inquiries Management</h2>
            <p className="text-gray-600">Manage client inquiries and convert them to transactions</p>
          </div>
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Inquiry
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
                placeholder="Search by client, property code, or project..."
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
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Inquiry ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Property Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Inquiry Date
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
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.inquiry_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      #{inquiry.inquiry_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {inquiry.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.property_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {inquiry.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(inquiry.inquiry_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        inquiry.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'Converted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button 
                        onClick={() => openViewDialog(inquiry)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      {inquiry.status === 'Pending' && (
                        <button 
                          onClick={() => handleConvertToTransaction(inquiry)}
                          className="text-green-600 hover:text-green-800"
                          title="Convert to Transaction"
                        >
                          <ArrowRight className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInquiries.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No inquiries found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* View Inquiry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Inquiry #{selectedInquiry?.inquiry_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Client Name</label>
                  <p className="text-gray-900">{selectedInquiry.client_name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Inquiry Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedInquiry.inquiry_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Property Code</label>
                  <p className="text-gray-900">{selectedInquiry.property_code}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Project Name</label>
                  <p className="text-gray-900">{selectedInquiry.project_name}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => handleUpdateStatus(selectedInquiry.inquiry_id, e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Converted">Converted</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedInquiry.notes}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setIsViewDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            {selectedInquiry?.status === 'Pending' && (
              <button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleConvertToTransaction(selectedInquiry);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Convert to Transaction
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Inquiry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Inquiry</DialogTitle>
            <DialogDescription>
              Record a new client inquiry
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.client_id || ''}
                onChange={(e) => handleFormChange('client_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.property_id || ''}
                onChange={(e) => handleFormChange('property_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.property_id} value={property.property_id}>
                    {property.property_code} - {property.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Inquiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.inquiry_date}
                onChange={(e) => handleFormChange('inquiry_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional notes about the inquiry..."
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
              onClick={handleAddInquiry}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Inquiry
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
