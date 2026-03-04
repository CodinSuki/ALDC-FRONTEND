export type SellerSubmissionStatusCode = 'PND' | 'REV' | 'ACC' | 'REJ' | 'AVL';

export interface SellerSubmissionRow {
  propertyid: number;
  propertyname: string;
  createdat: string;
  sellerclientid: number | null;
  statusCode: SellerSubmissionStatusCode | string;
  statusName: string;
  sellerName: string;
  sellerEmail: string | null;
  sellerContact: string | null;
}

export interface SellerSubmissionDetail {
  propertyid: number;
  propertyname: string;
  createdat: string;
  statusCode: string;
  statusName: string;
  propertyTypeName: string | null;
  sellerName: string;
  sellerEmail: string | null;
  sellerContact: string | null;
  location: {
    island: string | null;
    region: string | null;
    province: string | null;
    city: string | null;
    barangay: string | null;
    street: string | null;
    size: number | null;
  } | null;
  utilities: {
    hasWater: boolean;
    hasElectricity: boolean;
    hasMobileSignal: boolean;
    hasInternet: boolean;
  } | null;
  accessibility: {
    byMotorcycle: boolean;
    byCar: boolean;
    byTruck: boolean;
    byAccessRoad: boolean;
    byCementedRoad: boolean;
    byRoughRoad: boolean;
    otherDetails: string | null;
  } | null;
  urbanLotType: string | null;
  urbanAmenities: {
    hasGated: boolean;
    hasSecurity: boolean;
    hasClubhouse: boolean;
    hasSportsFitnessCenter: boolean;
    hasParksPlaygrounds: boolean;
    amenitiesNotes: string | null;
  } | null;
  agriculturalLotTypes: string[];
  agriculturalAmenities: {
    hasFarmhouse: boolean;
    hasBarns: boolean;
    hasWarehouseStorage: boolean;
    hasRiversStreams: boolean;
    hasIrrigationCanal: boolean;
    hasLakeLagoon: boolean;
    amenitiesNotes: string | null;
  } | null;
  photos: Array<{
    propertyphotoid: number;
    photoorder: number | null;
    photofilename: string | null;
    photomimetype: string | null;
    photosize: number | null;
    photoDataUrl: string | null;
  }>;
}

const apiRequest = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Request failed');
  }

  return payload as T;
};

export const fetchSellerSubmissions = async (): Promise<SellerSubmissionRow[]> => {
  const response = await apiRequest<{ items: any[]; staffOptions: any[] }>('/api/admin/workflows', {
    method: 'GET',
  });

  // Filter for seller submission items only and map to expected format
  const sellerItems = (response.items ?? []).filter((item: any) => item.source === 'Seller Submission');

  return sellerItems.map((item: any) => ({
    propertyid: Number(item.sourceId),
    propertyname: item.reference || 'Unknown Property',
    createdat: item.createdAt,
    sellerclientid: null, // Not available in current structure
    statusCode: mapStatusToCode(item.status),
    statusName: item.status,
    sellerName: item.clientName,
    sellerEmail: item.email !== 'N/A' ? item.email : null,
    sellerContact: item.contact !== 'N/A' ? item.contact : null,
  }));
};

const mapStatusToCode = (status: string): SellerSubmissionStatusCode => {
  const normalized = status.toLowerCase();
  if (normalized.includes('pending') || normalized.includes('review')) return 'PND';
  if (normalized.includes('revision')) return 'REV';
  if (normalized.includes('accept') || normalized.includes('client linked')) return 'ACC';
  if (normalized.includes('reject')) return 'REJ';
  if (normalized.includes('publish') || normalized.includes('available')) return 'AVL';
  return 'PND';
};

export const setSubmissionStatus = async (propertyId: number, code: SellerSubmissionStatusCode): Promise<void> => {
  await apiRequest<{ success: boolean }>('/api/admin/workflows', {
    method: 'PATCH',
    body: JSON.stringify({ propertyId, code }),
  });
};

export const deleteSubmissionProperty = async (propertyId: number): Promise<void> => {
  await apiRequest<{ success: boolean }>('/api/admin/workflows', {
    method: 'DELETE',
    body: JSON.stringify({ propertyId }),
  });
};

export const fetchSellerSubmissionDetail = async (propertyId: number): Promise<SellerSubmissionDetail> => {
  return apiRequest<SellerSubmissionDetail>(`/api/admin/workflows?propertyId=${propertyId}`, {
    method: 'GET',
  });
};
