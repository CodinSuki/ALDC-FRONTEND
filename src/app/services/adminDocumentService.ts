export type VerificationStatus = 'PendingVerification' | 'Approved' | 'Rejected' | 'NeedsRevision' | 'Archived';

export interface DocumentType {
  documentTypeId: number;
  documentTypeName: string;
  description?: string | null;
}

export interface PropertyForUpload {
  propertyId: number;
  propertyName: string;
  sellerClientId: number;
  sellerName: string;
  sellerEmail?: string | null;
}

export interface PendingPropertyDocument {
  propertyDocumentId: number;
  propertyId: number;
  propertyName: string;
  documentTypeId: number;
  documentTypeName: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: VerificationStatus;
  createdAt: string;
  notes?: string | null;
  uploadedByStaffId?: number | null;
  uploadedByClientId?: number | null;
  uploaderName?: string;
  uploaderType?: 'client' | 'staff' | null;
  uploaderEmail?: string | null;
}

export interface PropertyDocumentValidationResult {
  valid: boolean;
  required: string[];
  approved: string[];
  missing: string[];
  pendingOrRejected: string[];
}

const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed');
  }

  return payload;
};

export const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
  const payload = await apiRequest<{ items: DocumentType[] }>(
    '/api/admin/documents?action=document-types',
    { method: 'GET' }
  );
  return payload.items ?? [];
};

export const fetchPropertiesForUpload = async (): Promise<PropertyForUpload[]> => {
  const payload = await apiRequest<{ items: PropertyForUpload[] }>(
    '/api/admin/documents?action=properties-for-upload',
    { method: 'GET' }
  );
  return payload.items ?? [];
};

export const fetchPendingPropertyDocuments = async (): Promise<PendingPropertyDocument[]> => {
  const payload = await apiRequest<{ items: PendingPropertyDocument[] }>(
    '/api/admin/documents?action=pending-property',
    { method: 'GET' }
  );
  return payload.items ?? [];
};

export const uploadPropertyDocument = async (params: {
  propertyId: number;
  documentTypeId: number;
  documentName: string;
  file: File;
  uploadedByClientId?: number | null;
}): Promise<{ propertyDocumentId: number }> => {
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:...;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(params.file);
  });

  return apiRequest<{ success: boolean; propertyDocumentId: number }>(
    '/api/admin/documents?action=upload-property',
    {
      method: 'POST',
      body: JSON.stringify({
        propertyId: params.propertyId,
        documentTypeId: params.documentTypeId,
        documentName: params.documentName,
        fileName: params.file.name,
        mimeType: params.file.type || 'application/octet-stream',
        fileBase64,
        uploadedByClientId: params.uploadedByClientId ?? null,
      }),
    }
  );
};

export const verifyPropertyDocument = async (
  propertyDocumentId: number,
  verificationStatus: Exclude<VerificationStatus, 'Archived' | 'PendingVerification'>,
  notes?: string
): Promise<void> => {
  await apiRequest<{ success: boolean }>('/api/admin/documents?action=verify-property', {
    method: 'PATCH',
    body: JSON.stringify({
      propertyDocumentId,
      verificationStatus,
      notes: notes?.trim() ? notes.trim() : null,
    }),
  });
};

export const validatePropertyRequiredDocuments = async (
  propertyId: number
): Promise<PropertyDocumentValidationResult> => {
  return apiRequest<PropertyDocumentValidationResult>(
    `/api/admin/documents?action=validate-property&propertyId=${propertyId}`,
    { method: 'GET' }
  );
};

export const downloadPropertyDocument = async (propertyDocumentId: number): Promise<void> => {
  try {
    const response = await fetch(
      `/api/admin/documents?action=download-document&propertyDocumentId=${propertyDocumentId}`,
      {
        credentials: 'include',
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    // Get filename from Content-Disposition header or use a default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'document';
    
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a temporary URL and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};
