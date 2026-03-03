import { supabaseAdmin } from '../admin/_utils/supabaseAdmin';

type SellerDraftPhoto = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
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

type ListingStatusRow = { propertylistingstatusid: number };
type PropertyTypeRow = { propertytypeid: number; propertytypename: string };
type PropertyOwnershipRow = { propertyownershipid: number };
type ClientRow = { clientid: number };

const toBool = (value: string): boolean => value.toLowerCase() === 'yes';

const parseLotSize = (value: string): number => {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolvePendingStatusId = async (): Promise<number> => {
  const { data, error } = await supabaseAdmin
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

  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
  const { data: existingByEmail, error: emailError } = await supabaseAdmin
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

  const { data: existingByPhone, error: phoneError } = await supabaseAdmin
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

  const { data: createdClient, error: createClientError } = await supabaseAdmin
    .from('client')
    .insert([
      {
        firstname: formData.firstName,
        middlename: formData.middleName || null,
        lastname: formData.lastName,
        emailaddress: formData.email,
        contactnumber: formData.phone,
        clientsource: 'seller_form',
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

  const { data, error } = await supabaseAdmin.from(tableName).select(`${idColumn}, ${nameColumn}`);

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

  const { data, error } = await supabaseAdmin
    .from('agriculturalreflottype')
    .select('agriculturalreflottypeid, agriculturalreflottypename');

  if (error || !data) {
    throw error ?? new Error('Unable to load agricultural lot types.');
  }

  const normalizedWanted = lotTypeNames.map((name) => name.trim().toLowerCase());

  return (data as Array<Record<string, unknown>>)
    .filter((row) =>
      normalizedWanted.some((wanted) =>
        String(row.agriculturalreflottypename ?? '').trim().toLowerCase().includes(wanted)
      )
    )
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

    const { error } = await supabaseAdmin.rpc('insert_property_photo_base64', {
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

const submitSellerDraftProperty = async (formData: SellerDraftFormData): Promise<number> => {
  const [pendingStatusId, propertyTypeId, propertyOwnershipId, sellerClientId] = await Promise.all([
    resolvePendingStatusId(),
    resolvePropertyTypeId(formData.propertyType),
    resolvePropertyOwnershipId(),
    resolveSellerClientId(formData),
  ]);

  const { data: propertyRow, error: propertyError } = await supabaseAdmin
    .from('property')
    .insert([
      {
        propertyname: formData.propertyName,
        projectid: null,
        propertyownershipid: propertyOwnershipId,
        propertylistingstatusid: pendingStatusId,
        propertytypeid: propertyTypeId,
        sellerclientid: sellerClientId,
      },
    ])
    .select('propertyid')
    .single();

  if (propertyError || !propertyRow) {
    throw propertyError ?? new Error('Failed to create property draft.');
  }

  const propertyId = Number((propertyRow as { propertyid: number }).propertyid);

  const [locationRes, utilitiesRes, accessibilityRes] = await Promise.all([
    supabaseAdmin.from('propertylocation').insert([
      {
        propertyid: propertyId,
        propertyisland: formData.locationIsland || 'Luzon',
        propertyregion: formData.locationRegion || '',
        propertyprovince: formData.locationProvince || '',
        propertycity: formData.locationCity || '',
        propertybarangay: formData.locationBarangay || '',
        propertystreet: formData.locationStreet || '',
        propertysize: parseLotSize(formData.lotSize),
      },
    ]),
    supabaseAdmin.from('propertyutilities').insert([
      {
        propertyid: propertyId,
        propertyhaswater: toBool(formData.utilitiesWater),
        propertyhaselectricity: toBool(formData.utilitiesElectricity),
        propertyhasmobilesignal: toBool(formData.utilitiesSIM),
        propertyhasinternet: toBool(formData.utilitiesInternet),
      },
    ]),
    supabaseAdmin.from('propertyaccessibility').insert([
      {
        propertyid: propertyId,
        propertybymotorcycle: toBool(formData.accessMotorcycle),
        propertybycar: toBool(formData.accessCar),
        propertybytruck: toBool(formData.accessTruck),
        propertybyaccessroad: toBool(formData.accessRoad),
        propertybycementedroad: toBool(formData.accessCementedRoad),
        propertybyroughroad: toBool(formData.accessRoughRoad),
      },
    ]),
  ]);

  if (locationRes.error) throw locationRes.error;
  if (utilitiesRes.error) throw utilitiesRes.error;
  if (accessibilityRes.error) throw accessibilityRes.error;

  if (isAgriculturalSelection(formData.propertyType)) {
    const agriAmenities = {
      propertyid: propertyId,
      hasfarmhouse: formData.agriAmenities.includes('Farmhouse'),
      hasbarns: formData.agriAmenities.includes('Barns'),
      haswarehousestorage: formData.agriAmenities.includes('Warehouse / Storage'),
      hasriversstreams: formData.agriAmenities.includes('Rivers / Streams'),
      hasirrigationcanal: formData.agriAmenities.includes('Irrigation / Canal'),
      haslakelagoon: formData.agriAmenities.includes('Lake / Lagoon'),
      amenitiesnotes: formData.facilitiesOther || null,
    };

    const { error: agriAmenitiesError } = await supabaseAdmin
      .from('agriculturalpropertyamenities')
      .insert([agriAmenities]);

    if (agriAmenitiesError) throw agriAmenitiesError;

    const lotTypeIds = await getManyAgriculturalLotTypeIds(formData.agriLotTypes);

    if (lotTypeIds.length > 0) {
      const { data: agriDetails, error: agriDetailsError } = await supabaseAdmin
        .from('agriculturalpropertydetails')
        .insert([{ propertyid: propertyId }])
        .select('agriculturalpropertydetailsid')
        .single();

      if (agriDetailsError || !agriDetails) {
        throw agriDetailsError ?? new Error('Failed to create agricultural property detail.');
      }

      const detailsId = Number(
        (agriDetails as { agriculturalpropertydetailsid: number }).agriculturalpropertydetailsid
      );
      const lotTypeRows = lotTypeIds.map((lotTypeId) => ({
        agriculturalpropertydetailsid: detailsId,
        agriculturalreflottypeid: lotTypeId,
      }));

      const { error: lotTypeBridgeError } = await supabaseAdmin
        .from('agriculturalpropertylottype')
        .insert(lotTypeRows);

      if (lotTypeBridgeError) throw lotTypeBridgeError;
    }

    await uploadPropertyPhotos(propertyId, formData.photos ?? []);
    return propertyId;
  }

  const urbanAmenities = {
    propertyid: propertyId,
    hasgated: toBool(formData.facilitiesGated),
    hassecurity: toBool(formData.facilitiesSecurity),
    hasclubhouse: toBool(formData.facilitiesClubhouse),
    hassportsfitnesscenter: toBool(formData.facilitiesSports),
    hasparksplaygrounds: toBool(formData.facilitiesParks),
    amenitiesnotes: formData.facilitiesOther || null,
  };

  const { error: urbanAmenitiesError } = await supabaseAdmin
    .from('urbanpropertyamenities')
    .insert([urbanAmenities]);

  if (urbanAmenitiesError) throw urbanAmenitiesError;

  const urbanLotTypeId = await getSingleRelationIdByName(
    'urbanreflottype',
    'urbanreflottypeid',
    'urbanreflottypename',
    formData.lotType
  );

  if (urbanLotTypeId) {
    const { error: urbanDetailsError } = await supabaseAdmin
      .from('urbanpropertydetails')
      .insert([{ propertyid: propertyId, urbanreflottypeid: urbanLotTypeId }]);

    if (urbanDetailsError) throw urbanDetailsError;
  }

  await uploadPropertyPhotos(propertyId, formData.photos ?? []);
  return propertyId;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as SellerDraftFormData;

    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.propertyName || !body.propertyType) {
      res.status(400).json({ error: 'Missing required seller draft fields' });
      return;
    }

    if (!Array.isArray(body.photos) || body.photos.length < 5 || body.photos.length > 10) {
      res.status(400).json({ error: 'Please upload at least 5 photos and at most 10 photos.' });
      return;
    }

    const propertyId = await submitSellerDraftProperty(body);

    res.status(201).json({ success: true, propertyId });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to submit seller draft property' });
  }
}
