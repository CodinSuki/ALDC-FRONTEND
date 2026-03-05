import { supabaseAdmin } from '../lib/admin/utils/supabaseAdmin.js';

// ===========================
// Shared Types & Utilities
// ===========================

type PropertyRow = {
  propertyid: number;
  propertyname: string;
  propertytype: { propertytypename: string } | { propertytypename: string }[];
  propertylistingstatus: { propertylistingstatusname: string } | { propertylistingstatusname: string }[];
  propertylocation: { propertycity: string; propertysize: number } | { propertycity: string; propertysize: number }[];
};

type PropertyPhotoRow = {
  propertyid: number;
  photoorder: number | null;
  photomimetype: string | null;
  photodata: string | null;
};

type PropertyDetailRow = {
  propertyid: number;
  propertyname: string;
  propertylocation: {
    propertycity: string;
    propertysize: number;
  };
  propertylistingstatus: {
    propertylistingstatusname: string;
  };
  propertytype: {
    propertytypename: string;
  };
  propertyutilities: {
    propertyhaswater: boolean;
    propertyhaselectricity: boolean;
    propertyhasmobilesignal: boolean;
    propertyhasinternet: boolean;
  }[];
  propertyaccessibility: {
    propertybymotorcycle: boolean;
    propertybycar: boolean;
    propertybytruck: boolean;
    propertybyaccessroad: boolean;
    propertybycementedroad: boolean;
    propertybyroughroad: boolean;
  }[];
  urbanpropertyamenities: {
    hasgated: boolean;
    hassecurity: boolean;
    hasclubhouse: boolean;
    hassportsfitnesscenter: boolean;
    hasparksplaygrounds: boolean;
  }[];
  urbanpropertydetails: {
    urbanreflottype: {
      urbanreflottypename: string;
    };
  }[];
};

const getSingleRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const hexToBase64 = (hexValue: string | null | undefined): string | null => {
  if (!hexValue) return null;

  try {
    const normalizedHex = hexValue.startsWith('\\x') ? hexValue.slice(2) : hexValue;
    if (!normalizedHex || normalizedHex.length % 2 !== 0) return null;
    return Buffer.from(normalizedHex, 'hex').toString('base64');
  } catch {
    return null;
  }
};

const buildPhotoDataUrl = (
  photoData: string | null | undefined,
  mimeType: string | null | undefined
): string | null => {
  if (!photoData) return null;
  if (photoData.startsWith('data:')) return photoData;

  const base64Data = hexToBase64(photoData);
  if (!base64Data) return null;

  return `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
};

const toBool = (value: string): boolean => value.toLowerCase() === 'yes';

const parseLotSize = (value: string): number => {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ===========================
// Properties Handlers
// ===========================

const fetchPropertyList = async () => {
  const { data: publishedStatus, error: publishedStatusError } = await supabaseAdmin
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', 'AVL')
    .single();

  if (publishedStatusError || !publishedStatus) {
    throw publishedStatusError ?? new Error('Published listing status (AVL) not found.');
  }

  const { data, error } = await supabaseAdmin
    .from('property')
    .select(`
      propertyid,
      propertyname,
      propertylistingstatus!inner(propertylistingstatusname),
      propertytype!inner(propertytypename),
      propertylocation!fk_propertylocation_property(propertycity,propertysize)
    `)
    .eq('propertylistingstatusid', Number(publishedStatus.propertylistingstatusid))
    .eq('is_archived', false);

  if (error) throw error;

  const rows = (data ?? []) as unknown as PropertyRow[];
  const propertyIds = rows.map((row) => Number(row.propertyid)).filter((value) => Number.isFinite(value));

  const firstPhotoByPropertyId = new Map<number, string>();

  if (propertyIds.length > 0) {
    const { data: photoData, error: photoError } = await supabaseAdmin
      .from('propertyphoto')
      .select('propertyid, photoorder, photomimetype, photodata')
      .in('propertyid', propertyIds)
      .order('photoorder', { ascending: true });

    if (photoError) throw photoError;

    for (const photo of (photoData ?? []) as PropertyPhotoRow[]) {
      const propertyId = Number(photo.propertyid);
      if (firstPhotoByPropertyId.has(propertyId)) continue;

      const dataUrl = buildPhotoDataUrl(photo.photodata, photo.photomimetype);
      if (dataUrl) {
        firstPhotoByPropertyId.set(propertyId, dataUrl);
      }
    }
  }

  return rows.map((row) => {
    const propertyType = getSingleRelation<{ propertytypename: string }>(row.propertytype);
    const listingStatus = getSingleRelation<{ propertylistingstatusname: string }>(row.propertylistingstatus);
    const propertyLocation = getSingleRelation<{ propertycity: string; propertysize: number }>(row.propertylocation);

    return {
      propertyid: Number(row.propertyid),
      propertyname: row.propertyname ?? `Property #${row.propertyid}`,
      propertytype: {
        propertytypename: propertyType?.propertytypename ?? 'Unknown',
      },
      propertylistingstatus: {
        propertylistingstatusname: listingStatus?.propertylistingstatusname ?? 'Unknown',
      },
      propertylocation: {
        propertycity: propertyLocation?.propertycity ?? 'N/A',
        propertysize: Number(propertyLocation?.propertysize ?? 0),
      },
      imageUrl: firstPhotoByPropertyId.get(Number(row.propertyid)),
    };
  });
};

const fetchPropertyDetail = async (propertyId: number) => {
  const [propertyRes, photoRes] = await Promise.all([
    supabaseAdmin
      .from('property')
      .select(`
        propertyid,
        propertyname,
        propertylocation!fk_propertylocation_property(propertycity,propertysize),
        propertylistingstatus(propertylistingstatusname),
        propertytype(propertytypename),
        propertyutilities(propertyhaswater,propertyhaselectricity,propertyhasmobilesignal,propertyhasinternet),
        propertyaccessibility(propertybymotorcycle,propertybycar,propertybytruck,propertybyaccessroad,propertybycementedroad,propertybyroughroad),
        urbanpropertyamenities(hasgated,hassecurity,hasclubhouse,hassportsfitnesscenter,hasparksplaygrounds),
        urbanpropertydetails(urbanreflottype(urbanreflottypename))
      `)
      .eq('propertyid', propertyId)
      .eq('is_archived', false)
      .single(),
    supabaseAdmin
      .from('propertyphoto')
      .select('propertyid, photoorder, photomimetype, photodata')
      .eq('propertyid', propertyId)
      .order('photoorder', { ascending: true }),
  ]);

  if (propertyRes.error || !propertyRes.data) {
    throw propertyRes.error ?? new Error('Property not found');
  }

  if (photoRes.error) {
    throw photoRes.error;
  }

  const row = propertyRes.data as unknown as PropertyDetailRow;
  const images = ((photoRes.data ?? []) as PropertyPhotoRow[])
    .map((photo) => buildPhotoDataUrl(photo.photodata, photo.photomimetype))
    .filter((image): image is string => Boolean(image));

  return {
    name: row.propertyname,
    type: row.propertytype.propertytypename,
    location: row.propertylocation.propertycity,
    size: `${row.propertylocation.propertysize} sqm`,
    status: row.propertylistingstatus.propertylistingstatusname,
    property_type: row.propertytype.propertytypename,
    lot_size: `${row.propertylocation.propertysize} sqm`,
    titled: true,
    overlooking: false,
    topography: 'Flat',
    description: 'Full property details available upon consultation.',
    images,
    lot_type: row.urbanpropertydetails?.[0]?.urbanreflottype?.urbanreflottypename,
    utilities: {
      water: row.propertyutilities?.[0]?.propertyhaswater,
      electricity: row.propertyutilities?.[0]?.propertyhaselectricity,
      sim: row.propertyutilities?.[0]?.propertyhasmobilesignal,
      internet: row.propertyutilities?.[0]?.propertyhasinternet,
    },
    facilities: {
      gated: row.urbanpropertyamenities?.[0]?.hasgated,
      security: row.urbanpropertyamenities?.[0]?.hassecurity,
      clubhouse: row.urbanpropertyamenities?.[0]?.hasclubhouse,
      sports: row.urbanpropertyamenities?.[0]?.hassportsfitnesscenter,
      parks: row.urbanpropertyamenities?.[0]?.hasparksplaygrounds,
      pool: false,
      other: '',
    },
    accessibility: {
      motorcycle: row.propertyaccessibility?.[0]?.propertybymotorcycle,
      car: row.propertyaccessibility?.[0]?.propertybycar,
      truck: row.propertyaccessibility?.[0]?.propertybytruck,
      access_road: row.propertyaccessibility?.[0]?.propertybyaccessroad,
      cemented_road: row.propertyaccessibility?.[0]?.propertybycementedroad,
      rough_road: row.propertyaccessibility?.[0]?.propertybyroughroad,
    },
  };
};

// ===========================
// Buyer Inquiry Handlers
// ===========================

type BuyerInquiryBody = {
  client?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    contact_email?: string;
    contact_number?: string;
  };
  inquiry?: {
    property_id?: string | number;
    message?: string;
    status?: string;
  };
};

const resolveBuyerClientId = async (client: NonNullable<BuyerInquiryBody['client']>): Promise<number> => {
  const email = String(client.contact_email ?? '').trim();
  const phone = String(client.contact_number ?? '').trim();

  const { data: existingByEmail, error: emailError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('emailaddress', email)
    .limit(1);

  if (emailError) throw emailError;

  if (existingByEmail?.[0]?.clientid) {
    return Number(existingByEmail[0].clientid);
  }

  const { data: existingByPhone, error: phoneError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('contactnumber', phone)
    .limit(1);

  if (phoneError) throw phoneError;

  if (existingByPhone?.[0]?.clientid) {
    return Number(existingByPhone[0].clientid);
  }

  const { data: createdClient, error: createError } = await supabaseAdmin
    .from('client')
    .insert([
      {
        firstname: String(client.first_name ?? '').trim(),
        middlename: String(client.middle_name ?? '').trim() || null,
        lastname: String(client.last_name ?? '').trim(),
        emailaddress: email,
        contactnumber: phone,
        clientsource: 'buyer_form',
      },
    ])
    .select('clientid')
    .single();

  if (createError || !createdClient) {
    throw createError ?? new Error('Failed to create buyer client');
  }

  return Number(createdClient.clientid);
};

const handleBuyerInquiry = async (req: any, res: any) => {
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as BuyerInquiryBody;
  const client = body.client ?? {};
  const inquiry = body.inquiry ?? {};

  const firstName = String(client.first_name ?? '').trim();
  const lastName = String(client.last_name ?? '').trim();
  const email = String(client.contact_email ?? '').trim();
  const phone = String(client.contact_number ?? '').trim();
  const propertyId = Number(inquiry.property_id);
  const message = String(inquiry.message ?? '').trim();

  if (!firstName || !lastName || !email || !phone || !Number.isInteger(propertyId) || propertyId <= 0) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const clientId = await resolveBuyerClientId({
    first_name: firstName,
    middle_name: String(client.middle_name ?? '').trim(),
    last_name: lastName,
    contact_email: email,
    contact_number: phone,
  });

  const { data: inquiryRow, error: inquiryError } = await supabaseAdmin
    .from('propertyinquiry')
    .insert([
      {
        propertyid: propertyId,
        clientid: clientId,
        inquirystatus: 'New',
        inquirynotes: message || null,
      },
    ])
    .select('propertyinquiryid')
    .single();

  if (inquiryError || !inquiryRow) {
    throw inquiryError ?? new Error('Failed to submit buyer inquiry');
  }

  res.status(201).json({
    success: true,
    message: 'Inquiry submitted successfully',
    data: {
      propertyInquiryId: Number(inquiryRow.propertyinquiryid),
      clientId,
    },
  });
};

// ===========================
// Consultation Handlers
// ===========================

type ConsultationBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredPropertyTypeId?: number;
  preferredLocation?: string;
  budgetRange?: string;
  additionalRequirements?: string | null;
};

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const resolveConsultationClientId = async (fullName: string, email: string, phone: string): Promise<number> => {
  const normalizedEmail = email.trim();
  const normalizedPhone = phone.trim();

  const { data: existingByEmail, error: emailError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('emailaddress', normalizedEmail)
    .limit(1);

  if (emailError) throw emailError;

  if (existingByEmail?.[0]?.clientid) {
    return Number(existingByEmail[0].clientid);
  }

  const { data: existingByPhone, error: phoneError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('contactnumber', normalizedPhone)
    .limit(1);

  if (phoneError) throw phoneError;

  if (existingByPhone?.[0]?.clientid) {
    return Number(existingByPhone[0].clientid);
  }

  const { firstName, middleName, lastName } = splitFullName(fullName);

  const { data: createdClient, error: createError } = await supabaseAdmin
    .from('client')
    .insert([
      {
        firstname: firstName,
        middlename: middleName || null,
        lastname: lastName,
        emailaddress: normalizedEmail,
        contactnumber: normalizedPhone,
        clientsource: 'consultation_form',
      },
    ])
    .select('clientid')
    .single();

  if (createError || !createdClient) {
    throw createError ?? new Error('Failed to create client record');
  }

  return Number(createdClient.clientid);
};

const handleConsultation = async (req: any, res: any) => {
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as ConsultationBody;

  const fullName = String(body.fullName ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const preferredPropertyTypeId = Number(body.preferredPropertyTypeId);
  const preferredLocation = String(body.preferredLocation ?? '').trim();
  const budgetRange = String(body.budgetRange ?? '').trim();
  const additionalRequirements =
    body.additionalRequirements == null || String(body.additionalRequirements).trim() === ''
      ? null
      : String(body.additionalRequirements).trim();

  if (!fullName || !email || !phone || !preferredLocation || !budgetRange || !Number.isFinite(preferredPropertyTypeId) || preferredPropertyTypeId <= 0) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const clientId = await resolveConsultationClientId(fullName, email, phone);

  const { data: consultationRow, error: consultationError } = await supabaseAdmin
    .from('consultationrequest')
    .insert([
      {
        clientid: clientId,
        fullname: fullName,
        emailaddress: email,
        contactnumber: phone,
        preferredpropertytypeid: preferredPropertyTypeId,
        preferredlocation: preferredLocation,
        budgetrange: budgetRange,
        additionalrequirements: additionalRequirements,
        consultationstatus: 'New',
        assignedstaffid: null,
        scheduledat: null,
      },
    ])
    .select('consultationrequestid')
    .single();

  if (consultationError || !consultationRow) {
    throw consultationError ?? new Error('Failed to create consultation request');
  }

  res.status(201).json({
    success: true,
    consultationRequestId: Number(consultationRow.consultationrequestid),
    clientId,
  });
};

// ===========================
// Seller Draft Handlers
// ===========================

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

const resolvePendingStatusId = async (): Promise<number> => {
  const { data, error } = await supabaseAdmin
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', 'PND')
    .single();

  if (error || !data) {
    throw error ?? new Error('Pending listing status (PND) not found.');
  }

  return Number(data.propertylistingstatusid);
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

  const normalized = propertyTypeName.trim().toLowerCase();

  const match =
    data.find((row: any) => row.propertytypename?.trim().toLowerCase() === normalized) ??
    data.find((row: any) => row.propertytypename?.trim().toLowerCase().includes(normalized)) ??
    data.find((row: any) => normalized.includes('agri') && row.propertytypename?.trim().toLowerCase().includes('agri')) ??
    data[0];

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

  return Number(data.propertyownershipid);
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
    return Number(existingByEmail[0].clientid);
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
    return Number(existingByPhone[0].clientid);
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

  return Number(createdClient.clientid);
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

  const propertyId = Number(propertyRow.propertyid);

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

      const detailsId = Number(agriDetails.agriculturalpropertydetailsid);
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

const handleSellerDraft = async (req: any, res: any) => {
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
};

// ===========================
// Main Router
// ===========================

export default async function handler(req: any, res: any) {
  try {
    const resource = req.query?.resource;

    if (resource === 'properties') {
      if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const idParam = req.query?.id;

      if (idParam !== undefined) {
        const propertyId = Number(idParam);
        if (!Number.isInteger(propertyId) || propertyId <= 0) {
          res.status(400).json({ error: 'Invalid property id' });
          return;
        }

        const item = await fetchPropertyDetail(propertyId);
        res.status(200).json({ item });
        return;
      }

      const items = await fetchPropertyList();
      res.status(200).json({ items });
      return;
    }

    if (resource === 'buyer-inquiry') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      await handleBuyerInquiry(req, res);
      return;
    }

    if (resource === 'consultation') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      await handleConsultation(req, res);
      return;
    }

    if (resource === 'seller-draft') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      await handleSellerDraft(req, res);
      return;
    }

    res.status(400).json({ error: 'Invalid resource' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Request failed' });
  }
}
