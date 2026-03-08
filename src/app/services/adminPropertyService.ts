// API-based service (no direct Supabase access for admin operations)

export interface ProjectOption {
  projectid: number;
  projectname: string;
}

export interface SellerOption {
  clientid: number;
  name: string;
}

export interface PropertyTypeOption {
  propertytypeid: number;
  propertytypename: string;
}

export interface PropertyListingStatusOption {
  propertylistingstatusid: number;
  propertylistingstatusname: string;
}

export interface UrbanLotTypeOption {
  urbanreflottypeid: number;
  urbanreflottypename: string;
}

export interface AgriculturalLotTypeOption {
  agriculturalreflottypeid: number;
  agriculturalreflottypename: string;
}

export interface CommercialLotTypeOption {
  commercialreflottypeid: number;
  commercialreflottypename: string;
}

export interface IndustrialLotTypeOption {
  industrialreflottypeid: number;
  industrialreflottypename: string;
}

export interface AdminPropertyPhotoUpload {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface AdminProperty {
  propertyid: number;
  propertyname: string;
  is_archived?: boolean;
  projectid: number;
  propertytypeid?: number | null;
  sellerclientid?: number | null;
  propertylistingstatusid: number;
  propertyownershipid?: number | null;
  project_name?: string;
  seller_name?: string;
  property_type_name?: string;
  listing_status_name?: string;
  ownership_name?: string;
  location_island: string;
  location_region: string;
  location_province: string;
  location_city: string;
  location_barangay: string;
  location_street: string;
  lot_size: number;
  urbanreflottypeid?: number | null;
  commercialreflottypeid?: number | null;
  industrialreflottypeid?: number | null;
  detail_istitled?: boolean;
  detail_isoverlooking?: boolean;
  detail_topography?: string | null;
  utilities_water: boolean;
  utilities_electricity: boolean;
  utilities_sim: boolean;
  utilities_internet: boolean;
  access_motorcycle: boolean;
  access_car: boolean;
  access_truck: boolean;
  access_road: boolean;
  access_cemented_road: boolean;
  access_rough_road: boolean;
  facilities_gated: boolean;
  facilities_security: boolean;
  facilities_clubhouse: boolean;
  facilities_sports: boolean;
  facilities_parks: boolean;
  agriculturalreflottypeids: number[];
  agri_hasfarmhouse: boolean;
  agri_hasbarns: boolean;
  agri_haswarehousestorage: boolean;
  agri_hasriversstreams: boolean;
  agri_hasirrigationcanal: boolean;
  agri_haslakelagoon: boolean;
  comm_hasparking?: boolean;
  comm_hasloadingbay?: boolean;
  comm_haselevator?: boolean;
  comm_hasfireprotection?: boolean;
  comm_hassecurity?: boolean;
  comm_hascctv?: boolean;
  ind_hasthreephasepower?: boolean;
  ind_hasheavyhaulroadaccess?: boolean;
  ind_hasloadingdock?: boolean;
  ind_haswarehouse?: boolean;
  ind_hasfireprotection?: boolean;
  ind_hashazmatzone?: boolean;
  ind_hastruckaccess?: boolean;
  photos?: AdminPropertyPhotoUpload[];
}

interface SellerDbRow {
  clientid: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
}

interface PropertyLookup {
  projects: ProjectOption[];
  sellers: SellerOption[];
  propertyTypes: PropertyTypeOption[];
  listingStatuses: PropertyListingStatusOption[];
}

export interface PropertyDetailPayload {
  location_island: string;
  location_region: string;
  location_province: string;
  location_city: string;
  location_barangay: string;
  location_street: string;
  lot_size: number;
  urbanreflottypeid: number | null;
  commercialreflottypeid: number | null;
  industrialreflottypeid: number | null;
  detail_istitled: boolean;
  detail_isoverlooking: boolean;
  detail_topography: string;
  utilities_water: boolean;
  utilities_electricity: boolean;
  utilities_sim: boolean;
  utilities_internet: boolean;
  access_motorcycle: boolean;
  access_car: boolean;
  access_truck: boolean;
  access_road: boolean;
  access_cemented_road: boolean;
  access_rough_road: boolean;
  facilities_gated: boolean;
  facilities_security: boolean;
  facilities_clubhouse: boolean;
  facilities_sports: boolean;
  facilities_parks: boolean;
  agriculturalreflottypeids: number[];
  agri_hasfarmhouse: boolean;
  agri_hasbarns: boolean;
  agri_haswarehousestorage: boolean;
  agri_hasriversstreams: boolean;
  agri_hasirrigationcanal: boolean;
  agri_haslakelagoon: boolean;
  comm_hasparking: boolean;
  comm_hasloadingbay: boolean;
  comm_haselevator: boolean;
  comm_hasfireprotection: boolean;
  comm_hassecurity: boolean;
  comm_hascctv: boolean;
  ind_hasthreephasepower: boolean;
  ind_hasheavyhaulroadaccess: boolean;
  ind_hasloadingdock: boolean;
  ind_haswarehouse: boolean;
  ind_hasfireprotection: boolean;
  ind_hashazmatzone: boolean;
  ind_hastruckaccess: boolean;
}

export interface PropertyPayload {
  propertyname: string;
  projectid: number;
  sellerclientid: number | null;
  propertytypeid: number | null;
  propertylistingstatusid: number;
  propertyownershipid: number | null;
}

export interface AdminPropertyLoadResult {
  properties: AdminProperty[];
  projects: ProjectOption[];
  sellers: SellerOption[];
  propertyTypes: PropertyTypeOption[];
  listingStatuses: PropertyListingStatusOption[];
  urbanLotTypes: UrbanLotTypeOption[];
  agriculturalLotTypes: AgriculturalLotTypeOption[];
  commercialLotTypes: CommercialLotTypeOption[];
  industrialLotTypes: IndustrialLotTypeOption[];
}

export const fetchAdminPropertyDetails = async (
  propertyId: number
): Promise<Pick<AdminProperty,
  | 'location_island'
  | 'location_region'
  | 'location_province'
  | 'location_city'
  | 'location_barangay'
  | 'location_street'
  | 'lot_size'
  | 'urbanreflottypeid'
  | 'commercialreflottypeid'
  | 'industrialreflottypeid'
  | 'detail_istitled'
  | 'detail_isoverlooking'
  | 'detail_topography'
  | 'utilities_water'
  | 'utilities_electricity'
  | 'utilities_sim'
  | 'utilities_internet'
  | 'access_motorcycle'
  | 'access_car'
  | 'access_truck'
  | 'access_road'
  | 'access_cemented_road'
  | 'access_rough_road'
  | 'facilities_gated'
  | 'facilities_security'
  | 'facilities_clubhouse'
  | 'facilities_sports'
  | 'facilities_parks'
  | 'agriculturalreflottypeids'
  | 'agri_hasfarmhouse'
  | 'agri_hasbarns'
  | 'agri_haswarehousestorage'
  | 'agri_hasriversstreams'
  | 'agri_hasirrigationcanal'
  | 'agri_haslakelagoon'
  | 'comm_hasparking'
  | 'comm_hasloadingbay'
  | 'comm_haselevator'
  | 'comm_hasfireprotection'
  | 'comm_hassecurity'
  | 'comm_hascctv'
  | 'ind_hasthreephasepower'
  | 'ind_hasheavyhaulroadaccess'
  | 'ind_hasloadingdock'
  | 'ind_haswarehouse'
  | 'ind_hasfireprotection'
  | 'ind_hashazmatzone'
  | 'ind_hastruckaccess'
>> => {
  const response = await fetch(`/api/admin/properties?action=details&id=${propertyId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch property details');
  }

  return response.json();
};

export const fetchAdminPropertyData = async (): Promise<AdminPropertyLoadResult> => {
  const response = await fetch('/api/admin/properties?action=load', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch admin property data');
  }

  return response.json();
};

export const createAdminProperty = async (
  payload: PropertyPayload,
  detailPayload: PropertyDetailPayload,
  lookup: PropertyLookup,
  photos: AdminPropertyPhotoUpload[] = []
): Promise<AdminProperty> => {
  const response = await fetch('/api/admin/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, detailPayload }),
  });

  if (!response.ok) {
    throw new Error('Failed to create property');
  }

  return response.json();
};

export const updateAdminProperty = async (
  propertyId: number,
  payload: PropertyPayload,
  detailPayload: PropertyDetailPayload,
  lookup: PropertyLookup,
  photos: AdminPropertyPhotoUpload[] = []
): Promise<AdminProperty> => {
  const response = await fetch('/api/admin/properties', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyid: propertyId, payload, detailPayload }),
  });

  if (!response.ok) {
    throw new Error('Failed to update property');
  }

  return response.json();
};

export const deleteAdminProperty = async (propertyId: number): Promise<void> => {
  const response = await fetch('/api/admin/properties', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyid: propertyId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete property');
  }
};

export const archiveAdminProperty = async (
  propertyId: number,
  lookup: PropertyLookup
): Promise<AdminProperty> => {
  const response = await fetch('/api/admin/properties', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyid: propertyId, action: 'archive' }),
  });

  if (!response.ok) {
    throw new Error('Failed to archive property');
  }

  return response.json();
};

export const unarchiveAdminProperty = async (
  propertyId: number,
  lookup: PropertyLookup
): Promise<AdminProperty> => {
  const response = await fetch('/api/admin/properties', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyid: propertyId, action: 'unarchive' }),
  });

  if (!response.ok) {
    throw new Error('Failed to restore property');
  }

  return response.json();
};
