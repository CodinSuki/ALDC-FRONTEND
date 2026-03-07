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

const mapCodeToStatus = (code: SellerSubmissionStatusCode): string => {
  switch (code) {
    case 'PND':
      return 'Pending Review';
    case 'REV':
      return 'Needs Revision';
    case 'ACC':
      return 'Accepted';
    case 'REJ':
      return 'Rejected';
    case 'AVL':
      return 'Published';
    default:
      return 'Pending Review';
  }
};

export const setSubmissionStatus = async (propertyId: number, code: SellerSubmissionStatusCode): Promise<void> => {
  await apiRequest<{ success: boolean }>('/api/admin/workflows', {
    method: 'PATCH',
    body: JSON.stringify({
      source: 'Seller Submission',
      sourceId: String(propertyId),
      status: mapCodeToStatus(code),
    }),
  });
};

export const deleteSubmissionProperty = async (propertyId: number): Promise<void> => {
  await apiRequest<{ success: boolean }>('/api/admin/workflows', {
    method: 'DELETE',
    body: JSON.stringify({ propertyId }),
  });
};

export const fetchSellerSubmissionDetail = async (propertyId: number): Promise<SellerSubmissionDetail> => {
  // Fetch both the submission item (for basic info) and property details (for location, utilities, etc.)
  const [submissionResponse, propertyDetailsResponse] = await Promise.all([
    // Get submission item from workflows (has seller info, property name, status, etc.)
    apiRequest<{ items: any[] }>('/api/admin/workflows', { method: 'GET' }).then((res) => {
      const sellerItems = (res.items ?? []).filter((item: any) => item.source === 'Seller Submission' && item.sourceId === String(propertyId));
      return sellerItems[0] || null;
    }),
    // Get property details (has location, utilities, accessibility, amenities, photos, etc.)
    apiRequest<any>(`/api/admin/properties?action=details&id=${propertyId}`, { method: 'GET' }).catch(
      () => null
    ),
  ]);

  // Use submission item for basic info, or provide defaults
  const submissionItem = submissionResponse;
  const propertyDetails = propertyDetailsResponse;

  return {
    propertyid: propertyId,
    propertyname: submissionItem?.reference || 'Unknown Property',
    createdat: submissionItem?.createdAt || new Date().toISOString(),
    statusCode: submissionItem ? mapStatusToCode(submissionItem.status) : 'PND',
    statusName: submissionItem?.status || 'Pending Review',
    propertyTypeName: submissionItem?.propertyTypeName || null,
    sellerName: submissionItem?.clientName || 'Unknown Seller',
    sellerEmail: (submissionItem?.email && submissionItem.email !== 'N/A') ? submissionItem.email : null,
    sellerContact: (submissionItem?.contact && submissionItem.contact !== 'N/A') ? submissionItem.contact : null,
    location: propertyDetails ? {
      island: propertyDetails.location_island || null,
      region: propertyDetails.location_region || null,
      province: propertyDetails.location_province || null,
      city: propertyDetails.location_city || null,
      barangay: propertyDetails.location_barangay || null,
      street: propertyDetails.location_street || null,
      size: propertyDetails.lot_size || null,
    } : null,
    utilities: propertyDetails ? {
      hasWater: propertyDetails.utilities_water ?? false,
      hasElectricity: propertyDetails.utilities_electricity ?? false,
      hasMobileSignal: propertyDetails.utilities_sim ?? false,
      hasInternet: propertyDetails.utilities_internet ?? false,
    } : null,
    accessibility: propertyDetails ? {
      byMotorcycle: propertyDetails.access_motorcycle ?? false,
      byCar: propertyDetails.access_car ?? false,
      byTruck: propertyDetails.access_truck ?? false,
      byAccessRoad: propertyDetails.access_road ?? false,
      byCementedRoad: propertyDetails.access_cemented_road ?? false,
      byRoughRoad: propertyDetails.access_rough_road ?? false,
      otherDetails: null,
    } : null,
    urbanLotType: propertyDetails?.urbanreflottypeid ? submissionItem?.urbanLotType || null : null,
    urbanAmenities: propertyDetails?.urbanreflottypeid ? {
      hasGated: propertyDetails.facilities_gated ?? false,
      hasSecurity: propertyDetails.facilities_security ?? false,
      hasClubhouse: propertyDetails.facilities_clubhouse ?? false,
      hasSportsFitnessCenter: propertyDetails.facilities_sports ?? false,
      hasParksPlaygrounds: propertyDetails.facilities_parks ?? false,
      amenitiesNotes: null,
    } : null,
    agriculturalLotTypes: propertyDetails?.agriculturalreflottypeids || [],
    agriculturalAmenities: (propertyDetails?.agriculturalreflottypeids?.length ?? 0) > 0 ? {
      hasFarmhouse: propertyDetails.agri_hasfarmhouse ?? false,
      hasBarns: propertyDetails.agri_hasbarns ?? false,
      hasWarehouseStorage: propertyDetails.agri_haswarehousestorage ?? false,
      hasRiversStreams: propertyDetails.agri_hasriversstreams ?? false,
      hasIrrigationCanal: propertyDetails.agri_hasirrigationcanal ?? false,
      hasLakeLagoon: propertyDetails.agri_haslakelagoon ?? false,
      amenitiesNotes: null,
    } : null,
    photos: propertyDetails?.photos ?? [],
  };
};
