import { useEffect, useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Plus, Eye, EyeOff, Copy, Check, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/app/components/ui/alert-dialog';
import { fetchStaff, type StaffRow } from '@/app/services/adminService';

interface StaffWithCredential extends StaffRow {
  hasPassword?: boolean;
}

export default function PasswordInitialization() {
  const [staff, setStaff] = useState<StaffWithCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await fetchStaff();
      setStaff(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const openGenerateDialog = (staffId: number) => {
    setSelectedStaffId(staffId);
    setGeneratedPassword(generateTemporaryPassword());
    setShowGenerateDialog(true);
  };

  const initializePassword = async () => {
    if (!selectedStaffId || !generatedPassword) return;

    try {
      setInitializing(true);
      setError(null);

      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init-password',
          staffId: selectedStaffId,
          password: generatedPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize password');
      }

      const selectedStaffMember = staff.find(s => s.staff_id === selectedStaffId);
      setSuccessMessage(`Password initialized for ${selectedStaffMember?.name}`);
      
      setTimeout(() => setSuccessMessage(null), 5000);

      setShowGenerateDialog(false);
      setGeneratedPassword('');
      setSelectedStaffId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize password');
    } finally {
      setInitializing(false);
    }
  };

  const copyToClipboard = async (text: string, staffId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(staffId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && staff.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-gray-900">Password Initialization</h2>
            <p className="text-gray-600">Initialize or reset passwords for staff members</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              <span>Loading staff members...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-gray-900">Password Initialization</h2>
          <p className="text-gray-600">Initialize or reset passwords for staff members</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.staff_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.position}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openGenerateDialog(member.staff_id)}
                        disabled={member.status !== 'Active'}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Initialize Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredStaff.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No staff members found matching your search
            </div>
          )}
        </div>
      </div>

      {/* Generate Password Dialog */}
      <AlertDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Initialize Password</AlertDialogTitle>
            <AlertDialogDescription>
              A temporary password has been generated. Share this with the staff member. They should change it on first login.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Password
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword}
                    readOnly
                    className="flex-1 bg-transparent outline-none font-mono"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedPassword, selectedStaffId || 0)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {copiedId === selectedStaffId ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Important:</strong> Make sure to communicate this password securely to the staff member. 
                They should change it immediately after their first login.
              </p>
            </div>

            {generatedPassword && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">Password format:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Length: 12 characters</li>
                  <li>✓ Contains uppercase, lowercase, numbers, and symbols</li>
                  <li>✓ Minimum 6 characters required (exceeds requirement)</li>
                </ul>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={initializePassword}
              disabled={initializing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              {initializing ? 'Initializing...' : 'Confirm & Initialize'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
