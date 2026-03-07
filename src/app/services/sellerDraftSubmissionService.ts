import { supabase } from '../../lib/SupabaseClient';

const DEFAULT_ISLAND_OPTIONS = ['Luzon', 'Visayas', 'Mindanao'];
const DEFAULT_REGION_OPTIONS = ['Region I', 'Region II', 'Region III', 'NCR', 'CALABARZON', 'MIMAROPA'];

export type SellerDraftPhoto = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type SellerFormOptions = {
  propertyTypes: string[];
  urbanLotTypes: string[];
  agriculturalLotTypes: string[];
  agriculturalAmenities: string[];
  urbanAmenities: string[];
  islands: string[];
  regions: string[];
};

type SellerDraftFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  propertyName: string;
  propertyType: string;
  locationIsland: string;
  locationRegion: string;
  locationProvince: string;
  locationCity: string;
  locationBarangay: string;
  locationStreet: string;
  lotSize: string;
  lotType: string;
  agriLotTypes: string[];
  utilitiesWater: string;
  utilitiesElectricity: string;
  utilitiesSIM: string;
  utilitiesInternet: string;
  facilitiesGated: string;
  facilitiesSecurity: string;
  facilitiesClubhouse: string;
  facilitiesSports: string;
  facilitiesParks: string;
  facilitiesOther: string;
  agriAmenities: string[];
  accessMotorcycle: string;
  accessCar: string;
  accessTruck: string;
  accessRoad: string;
  accessCementedRoad: string;
  accessRoughRoad: string;
  photos: SellerDraftPhoto[];
};

// Vercel serverless request bodies are limited; keep a safety margin for headers/overhead.
const MAX_SELLER_DRAFT_REQUEST_BYTES = 4_200_000;

type ListingStatusRow = {
  propertylistingstatusid: number;
};

type PropertyTypeRow = {
  propertytypeid: number;
  propertytypename: string;
};

type PropertyOwnershipRow = {
  propertyownershipid: number;
};

type ClientRow = {
  clientid: number;
};

type OptionRpcPayload = {
  property_types?: Array<{ propertytypename?: string }>;
  urban_lot_types?: Array<{ urbanreflottypename?: string }>;
  agricultural_lot_types?: Array<{ agriculturalreflottypename?: string }>;
  agricultural_amenities?: string[];
  urban_amenities?: string[];
  islands?: string[];
  regions?: string[];
};

const toBool = (value: string): boolean => value.toLowerCase() === 'yes';

const parseLotSize = (value: string): number => {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const DEFAULT_AGRICULTURAL_AMENITIES = [
  'Farmhouse',
  'Barns',
  'Warehouse / Storage',
  'Rivers / Streams',
  'Irrigation / Canal',
  'Lake / Lagoon',
];

const DEFAULT_URBAN_AMENITIES = [
  'Gated',
  'Security',
  'Clubhouse / Function Hall',
  'Sports & Fitness Center',
  'Parks & Playgrounds',
];

const asUniqueSortedValues = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => (value ?? '').trim())
        .filter((value) => value.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

const parseOptionRpcPayload = (payload: unknown): OptionRpcPayload | null => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    const first = payload[0];
    return first && typeof first === 'object' ? (first as OptionRpcPayload) : null;
  }

  if (typeof payload === 'object') {
    return payload as OptionRpcPayload;
  }

  return null;
};

export const fetchSellerFormOptions = async (): Promise<SellerFormOptions> => {
  const fallbackLoad = async (): Promise<SellerFormOptions> => {
    const [propertyTypeResult, urbanLotTypeResult, agriculturalLotTypeResult] = await Promise.all([
      supabase.from('propertytype').select('propertytypename, propertyisactive').order('propertytypename', { ascending: true }),
      supabase.from('urbanreflottype').select('urbanreflottypename, lottypeisactive').order('urbanreflottypename', { ascending: true }),
      supabase.from('agriculturalreflottype').select('agriculturalreflottypename, isactive').order('agriculturalreflottypename', { ascending: true }),
    ]);

    if (propertyTypeResult.error) throw propertyTypeResult.error;
    if (urbanLotTypeResult.error) throw urbanLotTypeResult.error;
    if (agriculturalLotTypeResult.error) throw agriculturalLotTypeResult.error;

    const propertyTypes = asUniqueSortedValues(
      (propertyTypeResult.data ?? [])
        .filter((row: any) => row.propertyisactive !== false)
        .map((row: any) => row.propertytypename)
    );

    const urbanLotTypes = asUniqueSortedValues(
      (urbanLotTypeResult.data ?? [])
        .filter((row: any) => row.lottypeisactive !== false)
        .map((row: any) => row.urbanreflottypename)
    );

    const agriculturalLotTypes = asUniqueSortedValues(
      (agriculturalLotTypeResult.data ?? [])
        .filter((row: any) => row.isactive !== false)
        .map((row: any) => row.agriculturalreflottypename)
    );

    return {
      propertyTypes,
      urbanLotTypes,
      agriculturalLotTypes,
      agriculturalAmenities: DEFAULT_AGRICULTURAL_AMENITIES,
      urbanAmenities: DEFAULT_URBAN_AMENITIES,
      islands: DEFAULT_ISLAND_OPTIONS,
      regions: DEFAULT_REGION_OPTIONS,
    };
  };

  const { data, error } = await supabase.rpc('get_seller_form_options');

  if (error) {
    return fallbackLoad();
  }

  const payload = parseOptionRpcPayload(data);
  if (!payload) {
    return fallbackLoad();
  }

  const propertyTypes = asUniqueSortedValues(
    (payload.property_types ?? []).map((entry) => entry.propertytypename)
  );
  const urbanLotTypes = asUniqueSortedValues(
    (payload.urban_lot_types ?? []).map((entry) => entry.urbanreflottypename)
  );
  const agriculturalLotTypes = asUniqueSortedValues(
    (payload.agricultural_lot_types ?? []).map((entry) => entry.agriculturalreflottypename)
  );

  const fallback = await fallbackLoad();

  return {
    propertyTypes: propertyTypes.length > 0 ? propertyTypes : fallback.propertyTypes,
    urbanLotTypes: urbanLotTypes.length > 0 ? urbanLotTypes : fallback.urbanLotTypes,
    agriculturalLotTypes: agriculturalLotTypes.length > 0 ? agriculturalLotTypes : fallback.agriculturalLotTypes,
    agriculturalAmenities: (() => {
      const values = asUniqueSortedValues(payload.agricultural_amenities ?? DEFAULT_AGRICULTURAL_AMENITIES);
      return values.length > 0 ? values : fallback.agriculturalAmenities;
    })(),
    urbanAmenities: (() => {
      const values = asUniqueSortedValues(payload.urban_amenities ?? DEFAULT_URBAN_AMENITIES);
      return values.length > 0 ? values : fallback.urbanAmenities;
    })(),
    islands: (() => {
      const values = asUniqueSortedValues(payload.islands ?? DEFAULT_ISLAND_OPTIONS);
      return values.length > 0 ? values : fallback.islands;
    })(),
    regions: (() => {
      const values = asUniqueSortedValues(payload.regions ?? DEFAULT_REGION_OPTIONS);
      return values.length > 0 ? values : fallback.regions;
    })(),
  };
};

const resolvePendingStatusId = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', 'PND')
    .single();

  if (error || !data) {
    throw error ?? new Error('Pending listing status (PND) not found.');
  }

  return (data as ListingStatusRow).propertylistingstatusid;
};

const resolvePropertyTypeId = async (propertyTypeName: string): Promise<number> => {
  const parsedId = Number(propertyTypeName);
  if (Number.isFinite(parsedId) && parsedId > 0) {
    return parsedId;
  }

  const { data, error } = await supabase
    .from('propertytype')
    .select('propertytypeid, propertytypename')
    .order('propertytypeid', { ascending: true });

  if (error || !data) {
    throw error ?? new Error('Unable to resolve property type.');
  }

  const rows = data as PropertyTypeRow[];
  const normalized = propertyTypeName.trim().toLowerCase();

  const match =
    rows.find((row) => row.propertytypename?.trim().toLowerCase() === normalized) ??
    rows.find((row) => row.propertytypename?.trim().toLowerCase().includes(normalized)) ??
    rows.find((row) => normalized.includes('agri') && row.propertytypename?.trim().toLowerCase().includes('agri')) ??
    rows[0];

  if (!match) {
    throw new Error('No property types available.');
  }

  return Number(match.propertytypeid);
};

const resolvePropertyOwnershipId = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('propertyownership')
    .select('propertyownershipid')
    .order('propertyownershipid', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw error ?? new Error('Unable to resolve property ownership default.');
  }

  return (data as PropertyOwnershipRow).propertyownershipid;
};

const resolveSellerClientId = async (formData: SellerDraftFormData): Promise<number> => {
  const { data: existingByEmail, error: emailError } = await supabase
    .from('client')
    .select('clientid')
    .eq('emailaddress', formData.email)
    .limit(1);

  if (emailError) {
    throw emailError;
  }

  if (existingByEmail && existingByEmail.length > 0) {
    return Number((existingByEmail[0] as ClientRow).clientid);
  }

  const { data: existingByPhone, error: phoneError } = await supabase
    .from('client')
    .select('clientid')
    .eq('contactnumber', formData.phone)
    .limit(1);

  if (phoneError) {
    throw phoneError;
  }

  if (existingByPhone && existingByPhone.length > 0) {
    return Number((existingByPhone[0] as ClientRow).clientid);
  }

  const { data: createdClient, error: createClientError } = await supabase
    .from('client')
    .insert([
      {
        firstname: formData.firstName,
        middlename: formData.middleName || null,
        lastname: formData.lastName,
        emailaddress: formData.email,
        contactnumber: formData.phone,
      },
    ])
    .select('clientid')
    .single();

  if (createClientError || !createdClient) {
    throw createClientError ?? new Error('Failed to create seller client.');
  }

  return Number((createdClient as ClientRow).clientid);
};

const getSingleRelationIdByName = async (
  tableName: 'urbanreflottype' | 'agriculturalreflottype',
  idColumn: 'urbanreflottypeid' | 'agriculturalreflottypeid',
  nameColumn: 'urbanreflottypename' | 'agriculturalreflottypename',
  desiredName: string
): Promise<number | null> => {
  if (!desiredName.trim()) return null;

  const { data, error } = await supabase
    .from(tableName)
    .select(`${idColumn}, ${nameColumn}`);

  if (error || !data) {
    throw error ?? new Error(`Unable to load ${tableName}.`);
  }

  const normalized = desiredName.trim().toLowerCase();
  const match = (data as Array<Record<string, unknown>>).find((row) =>
    String(row[nameColumn] ?? '')
      .trim()
      .toLowerCase()
      .includes(normalized)
  );

  return match ? Number(match[idColumn]) : null;
};

const getManyAgriculturalLotTypeIds = async (lotTypeNames: string[]): Promise<number[]> => {
  if (lotTypeNames.length === 0) return [];

  const { data, error } = await supabase
    .from('agriculturalreflottype')
    .select('agriculturalreflottypeid, agriculturalreflottypename');

  if (error || !data) {
    throw error ?? new Error('Unable to load agricultural lot types.');
  }

  const normalizedWanted = lotTypeNames.map((name) => name.trim().toLowerCase());

  return (data as Array<Record<string, unknown>>)
    .filter((row) => normalizedWanted.some((wanted) => String(row.agriculturalreflottypename ?? '').trim().toLowerCase().includes(wanted)))
    .map((row) => Number(row.agriculturalreflottypeid));
};

const isAgriculturalSelection = (propertyTypeLabel: string): boolean =>
  propertyTypeLabel.trim().toLowerCase().includes('agri');

const uploadPropertyPhotos = async (propertyId: number, photos: SellerDraftPhoto[]): Promise<void> => {
  if (photos.length === 0) return;

  if (photos.length > 10) {
    throw new Error('You can upload up to 10 photos only.');
  }

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];

    const { error } = await supabase.rpc('insert_property_photo_base64', {
      p_propertyid: propertyId,
      p_photo_data_url: photo.dataUrl,
      p_filename: photo.fileName,
      p_mimetype: photo.mimeType,
      p_photoorder: index + 1,
    });

    if (error) {
      throw error;
    }
  }
};

export const submitSellerDraftProperty = async (formData: SellerDraftFormData): Promise<number> => {
  const requestBody = JSON.stringify(formData);
  const requestSizeBytes = new TextEncoder().encode(requestBody).length;

  if (requestSizeBytes > MAX_SELLER_DRAFT_REQUEST_BYTES) {
    const requestSizeMb = (requestSizeBytes / (1024 * 1024)).toFixed(2);
    const limitMb = (MAX_SELLER_DRAFT_REQUEST_BYTES / (1024 * 1024)).toFixed(2);

    throw new Error(
      `Your submission is too large (${requestSizeMb} MB). Please upload fewer or smaller photos and keep total payload under about ${limitMb} MB.`
    );
  }

  const response = await fetch('/api/public?resource=seller-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  if (response.status === 413) {
    throw new Error('Submission is too large. Please reduce photo count or image file sizes and try again.');
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Failed to submit property draft.');
  }

  return Number(payload.propertyId);
};
