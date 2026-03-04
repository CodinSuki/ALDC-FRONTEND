import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import {
  fetchPendingPropertyDocuments,
  fetchDocumentTypes,
  fetchPropertiesForUpload,
  validatePropertyRequiredDocuments,
  verifyPropertyDocument,
  uploadPropertyDocument,
  downloadPropertyDocument,
  type PendingPropertyDocument,
  type DocumentType,
  type PropertyForUpload,
} from '@/app/services/adminDocumentService';
import { Upload, Eye } from 'lucide-react';

const statusBadgeClass = (status: string): string => {
  if (status === 'Approved') return 'bg-green-100 text-green-800 border border-green-200';
  if (status === 'Rejected') return 'bg-red-100 text-red-800 border border-red-200';
  if (status === 'NeedsRevision') return 'bg-amber-100 text-amber-800 border border-amber-200';
  return 'bg-blue-100 text-blue-800 border border-blue-200';
};

export default function AdminDocuments() {
  const [rows, setRows] = useState<PendingPropertyDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [properties, setProperties] = useState<PropertyForUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  
  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadPropertyId, setUploadPropertyId] = useState('');
  const [uploadDocumentTypeId, setUploadDocumentTypeId] = useState('');
  const [uploadDocumentName, setUploadDocumentName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Validation state
  const [propertyIdInput, setPropertyIdInput] = useState('');
  const [validationResult, setValidationResult] = useState<null | {
    valid: boolean;
    required: string[];
    approved: string[];
    missing: string[];
    pendingOrRejected: string[];
  }>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [docsData, typesData, propsData] = await Promise.all([
        fetchPendingPropertyDocuments(),
        fetchDocumentTypes(),
        fetchPropertiesForUpload(),
      ]);
      setRows(docsData);
      setDocumentTypes(typesData);
      setProperties(propsData);
    } catch (error) {
      console.error('Failed to load documents', error);
      alert('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(
    () => rows.filter((row) => row.verificationStatus === 'PendingVerification').length,
    [rows]
  );

  const onVerify = async (
    row: PendingPropertyDocument,
    status: 'Approved' | 'Rejected' | 'NeedsRevision'
  ) => {
    const notes = prompt(`Optional review note (${status}):`) ?? '';
    setBusyId(row.propertyDocumentId);
    try {
      await verifyPropertyDocument(row.propertyDocumentId, status, notes);
      await load();
    } catch (error) {
      console.error('Failed to verify document', error);
      alert('Failed to verify document');
    } finally {
      setBusyId(null);
    }
  };

  const onViewDocument = async (row: PendingPropertyDocument) => {
    setBusyId(row.propertyDocumentId);
    try {
      await downloadPropertyDocument(row.propertyDocumentId);
    } catch (error) {
      console.error('Failed to download document', error);
      alert('Failed to download document');
    } finally {
      setBusyId(null);
    }
  };

  const onValidateProperty = async () => {
    const propertyId = Number(propertyIdInput);
    if (!propertyId || Number.isNaN(propertyId)) {
      alert('Enter a valid numeric Property ID');
      return;
    }

    try {
      const result = await validatePropertyRequiredDocuments(propertyId);
      setValidationResult(result);
    } catch (error) {
      console.error('Failed to validate required documents', error);
      alert('Failed to validate required documents');
    }
  };

  const onUploadDocument = async () => {
    const propertyId = Number(uploadPropertyId);
    const documentTypeId = Number(uploadDocumentTypeId);

    if (!propertyId || !documentTypeId || !uploadDocumentName.trim() || !uploadFile) {
      alert('Please fill all required fields and select a file');
      return;
    }

    const selectedProperty = properties.find((p) => p.propertyId === propertyId);

    setUploading(true);
    try {
      await uploadPropertyDocument({
        propertyId,
        documentTypeId,
        documentName: uploadDocumentName.trim(),
        file: uploadFile,
        uploadedByClientId: selectedProperty?.sellerClientId ?? null,
      });

      alert('Document uploaded successfully');
      setShowUploadForm(false);
      setUploadPropertyId('');
      setUploadDocumentTypeId('');
      setUploadDocumentName('');
      setUploadFile(null);
      await load();
    } catch (error) {
      console.error('Failed to upload document', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const selectedProperty = properties.find((p) => p.propertyId === Number(uploadPropertyId));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-gray-900">Document Compliance</h2>
          <p className="text-gray-600">
            Upload property documents after negotiation, verify ownership, and enforce listing requirements.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium text-gray-900">Upload Property Document</h3>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Upload size={16} />
              {showUploadForm ? 'Hide Form' : 'Upload Document'}
            </button>
          </div>

          {showUploadForm && (
            <div className="border-t pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Property *</label>
                  <select
                    value={uploadPropertyId}
                    onChange={(e) => setUploadPropertyId(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    disabled={uploading}
                  >
                    <option value="">Select Property</option>
                    {properties.map((prop) => (
                      <option key={prop.propertyId} value={prop.propertyId}>
                        #{prop.propertyId} - {prop.propertyName} (Seller: {prop.sellerName})
                      </option>
                    ))}
                  </select>
                  {selectedProperty && (
                    <p className="text-xs text-gray-500 mt-1">
                      Seller: {selectedProperty.sellerName} ({selectedProperty.sellerEmail || 'No email'})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Document Type *</label>
                  <select
                    value={uploadDocumentTypeId}
                    onChange={(e) => setUploadDocumentTypeId(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    disabled={uploading}
                  >
                    <option value="">Select Document Type</option>
                    {documentTypes.map((type) => (
                      <option key={type.documentTypeId} value={type.documentTypeId}>
                        {type.documentTypeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Document Name *</label>
                  <input
                    type="text"
                    value={uploadDocumentName}
                    onChange={(e) => setUploadDocumentName(e.target.value)}
                    placeholder="e.g., Land Title - Lot 123"
                    className="w-full border rounded px-3 py-2 text-sm"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">File *</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    disabled={uploading}
                  />
                  {uploadFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadPropertyId('');
                    setUploadDocumentTypeId('');
                    setUploadDocumentName('');
                    setUploadFile(null);
                  }}
                  disabled={uploading}
                  className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onUploadDocument}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending verification queue</p>
              <p className="text-2xl text-gray-900">{pendingCount}</p>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Validate Property ID</label>
                <input
                  value={propertyIdInput}
                  onChange={(event) => setPropertyIdInput(event.target.value)}
                  className="border rounded px-3 py-2 text-sm w-40"
                  placeholder="e.g. 101"
                />
              </div>
              <button
                onClick={onValidateProperty}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Check Requirements
              </button>
            </div>
          </div>

          {validationResult && (
            <div className="mt-4 rounded border p-3 text-sm">
              <p className={validationResult.valid ? 'text-green-700' : 'text-red-700'}>
                {validationResult.valid
                  ? 'Property is compliant for publish/transaction checks.'
                  : 'Property is not compliant yet.'}
              </p>
              {!validationResult.valid && (
                <div className="mt-2 space-y-1 text-gray-700">
                  <p>Missing: {validationResult.missing.join(', ') || 'None'}</p>
                  <p>Pending or Rejected: {validationResult.pendingOrRejected.join(', ') || 'None'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500">Loading documents...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">Property</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">Owner/Uploader</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">Document Type</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">File</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.propertyDocumentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{row.propertyName || `Property #${row.propertyId}`}</div>
                        <div className="text-xs text-gray-500">Property ID: {row.propertyId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{row.uploaderName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">
                          {row.uploaderType === 'client' ? 'Client' : row.uploaderType === 'staff' ? 'Staff' : 'N/A'}
                          {row.uploaderEmail && ` • ${row.uploaderEmail}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.documentTypeName || row.documentTypeId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{row.fileName || row.documentName}</div>
                        <div className="text-xs text-gray-500">{row.mimeType || 'Unknown type'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${statusBadgeClass(row.verificationStatus)}`}>
                          {row.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onViewDocument(row)}
                            disabled={busyId === row.propertyDocumentId}
                            className="px-2 py-1 border border-blue-300 text-blue-700 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-60 flex items-center gap-1"
                            title="View/Download Document"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={() => onVerify(row, 'Approved')}
                            disabled={busyId === row.propertyDocumentId}
                            className="px-2 py-1 border border-green-300 text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onVerify(row, 'NeedsRevision')}
                            disabled={busyId === row.propertyDocumentId}
                            className="px-2 py-1 border border-amber-300 text-amber-700 bg-amber-50 rounded hover:bg-amber-100 disabled:opacity-60"
                          >
                            Needs Revision
                          </button>
                          <button
                            onClick={() => onVerify(row, 'Rejected')}
                            disabled={busyId === row.propertyDocumentId}
                            className="px-2 py-1 border border-red-300 text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 && (
                <div className="p-8 text-center text-gray-500">No property documents in queue.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
