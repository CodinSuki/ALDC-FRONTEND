import { requireAdminSession } from './_utils/auth';
import { supabaseAdmin } from './_utils/supabaseAdmin';

type SellerSubmissionStatusCode = 'PND' | 'REV' | 'ACC' | 'REJ' | 'AVL';

type ListingStatusRow = {
  propertylistingstatusid: number;
  propertylistingstatuscode: string | null;
  propertylistingstatusname: string | null;
};

type PropertyRow = {
  propertyid: number;
  propertyname: string | null;
  createdat: string | null;
  sellerclientid: number | null;
  propertylistingstatusid: number;
};

type ClientRow = {
  clientid: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  emailaddress: string | null;
  contactnumber: string | null;
};

const REVIEW_CODES: SellerSubmissionStatusCode[] = ['PND', 'REV', 'ACC'];

const formatName = (first?: string | null, middle?: string | null, last?: string | null): string =>
  [first, middle, last].filter(Boolean).join(' ').trim();

const hexToBase64 = (hexValue: string): string | null => {
  const normalizedHex = hexValue.startsWith('\\x') ? hexValue.slice(2) : hexValue;
  if (!normalizedHex || normalizedHex.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(normalizedHex)) return null;

  try {
    return Buffer.from(normalizedHex, 'hex').toString('base64');
  } catch {
    return null;
  }
};

const buildPhotoDataUrl = (photoData: string | null | undefined, mimeType: string | null | undefined): string | null => {
  if (!photoData) return null;
  if (photoData.startsWith('data:')) return photoData;

  const base64Data = hexToBase64(photoData);
  if (!base64Data) return null;

  return `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
};

const getStatusRows = async (): Promise<ListingStatusRow[]> => {
  const { data, error } = await supabaseAdmin
    .from('propertylistingstatus')
    .select('propertylistingstatusid, propertylistingstatuscode, propertylistingstatusname');

  if (error) throw error;
  return (data ?? []) as ListingStatusRow[];
};

const getStatusIdByCode = async (code: SellerSubmissionStatusCode): Promise<number> => {
  const { data, error } = await supabaseAdmin
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', code)
    .single();

  if (error || !data) {
    throw error ?? new Error(`Status code not found: ${code}`);
  }

  return Number(data.propertylistingstatusid);
};

const fetchSellerSubmissions = async () => {
  const statusRows = await getStatusRows();

  const statusById = new Map<number, ListingStatusRow>(
    statusRows.map((row) => [Number(row.propertylistingstatusid), row])
  );

  const reviewStatusIds = statusRows
    .filter((row) => REVIEW_CODES.includes((row.propertylistingstatuscode ?? '') as SellerSubmissionStatusCode))
    .map((row) => Number(row.propertylistingstatusid));

  if (reviewStatusIds.length === 0) {
    return [];
  }

  const { data: propertyData, error: propertyError } = await supabaseAdmin
    .from('property')
    .select('propertyid, propertyname, createdat, sellerclientid, propertylistingstatusid')
    .in('propertylistingstatusid', reviewStatusIds)
    .order('createdat', { ascending: false });

  if (propertyError) throw propertyError;

  const properties = (propertyData ?? []) as PropertyRow[];
  const sellerIds = Array.from(
    new Set(properties.map((row) => Number(row.sellerclientid)).filter((value) => Number.isFinite(value) && value > 0))
  );

  let clientById = new Map<number, ClientRow>();

  if (sellerIds.length > 0) {
    const { data: clientsData, error: clientsError } = await supabaseAdmin
      .from('client')
      .select('clientid, firstname, middlename, lastname, emailaddress, contactnumber')
      .in('clientid', sellerIds);

    if (clientsError) throw clientsError;

    clientById = new Map<number, ClientRow>(
      ((clientsData ?? []) as ClientRow[]).map((row) => [Number(row.clientid), row])
    );
  }

  return properties.map((row) => {
    const status = statusById.get(Number(row.propertylistingstatusid));
    const seller = row.sellerclientid ? clientById.get(Number(row.sellerclientid)) : undefined;

    return {
      propertyid: Number(row.propertyid),
      propertyname: row.propertyname ?? `Property #${row.propertyid}`,
      createdat: row.createdat ?? new Date().toISOString(),
      sellerclientid: row.sellerclientid ? Number(row.sellerclientid) : null,
      statusCode: status?.propertylistingstatuscode ?? 'PND',
      statusName: status?.propertylistingstatusname ?? 'Pending',
      sellerName: formatName(seller?.firstname, seller?.middlename, seller?.lastname) || `Seller #${row.sellerclientid ?? 'N/A'}`,
      sellerEmail: seller?.emailaddress ?? null,
      sellerContact: seller?.contactnumber ?? null,
    };
  });
};

const setSubmissionStatus = async (propertyId: number, code: SellerSubmissionStatusCode): Promise<void> => {
  const statusId = await getStatusIdByCode(code);

  const { error } = await supabaseAdmin
    .from('property')
    .update({ propertylistingstatusid: statusId })
    .eq('propertyid', propertyId);

  if (error) throw error;
};

const fetchSellerSubmissionDetail = async (propertyId: number) => {
  const { data: propertyData, error: propertyError } = await supabaseAdmin
    .from('property')
    .select(`
      propertyid,
      propertyname,
      createdat,
      sellerclientid,
      propertylistingstatus(propertylistingstatuscode, propertylistingstatusname),
      propertytype(propertytypename)
    `)
    .eq('propertyid', propertyId)
    .single();

  if (propertyError || !propertyData) {
    throw propertyError ?? new Error(`Submission not found for property #${propertyId}`);
  }

  const property = propertyData as any;
  const sellerClientId = property.sellerclientid ? Number(property.sellerclientid) : null;

  const [sellerRes, locationRes, utilitiesRes, accessibilityRes, urbanDetailsRes, urbanAmenitiesRes, agriAmenitiesRes, agriDetailsRes, photosRes] = await Promise.all([
    sellerClientId
      ? supabaseAdmin
          .from('client')
          .select('clientid, firstname, middlename, lastname, emailaddress, contactnumber')
          .eq('clientid', sellerClientId)
          .single()
      : Promise.resolve({ data: null, error: null } as any),
    supabaseAdmin
      .from('propertylocation')
      .select('propertyisland, propertyregion, propertyprovince, propertycity, propertybarangay, propertystreet, propertysize')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('propertyutilities')
      .select('propertyhaswater, propertyhaselectricity, propertyhasmobilesignal, propertyhasinternet')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('propertyaccessibility')
      .select('propertybymotorcycle, propertybycar, propertybytruck, propertybyaccessroad, propertybycementedroad, propertybyroughroad, propertyotherdetails')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('urbanpropertydetails')
      .select('urbanreflottype(urbanreflottypename)')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('urbanpropertyamenities')
      .select('hasgated, hassecurity, hasclubhouse, hassportsfitnesscenter, hasparksplaygrounds, amenitiesnotes')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('agriculturalpropertyamenities')
      .select('hasfarmhouse, hasbarns, haswarehousestorage, hasriversstreams, hasirrigationcanal, haslakelagoon, amenitiesnotes')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('agriculturalpropertydetails')
      .select('agriculturalpropertydetailsid')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabaseAdmin
      .from('propertyphoto')
      .select('propertyphotoid, photoorder, photofilename, photomimetype, photosize, photodata')
      .eq('propertyid', propertyId)
      .order('photoorder', { ascending: true }),
  ]);

  if (sellerRes.error) throw sellerRes.error;
  if (locationRes.error) throw locationRes.error;
  if (utilitiesRes.error) throw utilitiesRes.error;
  if (accessibilityRes.error) throw accessibilityRes.error;
  if (urbanDetailsRes.error) throw urbanDetailsRes.error;
  if (urbanAmenitiesRes.error) throw urbanAmenitiesRes.error;
  if (agriAmenitiesRes.error) throw agriAmenitiesRes.error;
  if (agriDetailsRes.error) throw agriDetailsRes.error;
  if (photosRes.error) throw photosRes.error;

  let agriculturalLotTypes: string[] = [];

  const detailsId = agriDetailsRes.data?.agriculturalpropertydetailsid
    ? Number(agriDetailsRes.data.agriculturalpropertydetailsid)
    : null;

  if (detailsId) {
    const { data: lotTypeBridgeData, error: lotTypeBridgeError } = await supabaseAdmin
      .from('agriculturalpropertylottype')
      .select('agriculturalreflottype(agriculturalreflottypename)')
      .eq('agriculturalpropertydetailsid', detailsId);

    if (lotTypeBridgeError) throw lotTypeBridgeError;

    agriculturalLotTypes = (lotTypeBridgeData ?? [])
      .map((row: any) => row.agriculturalreflottype?.agriculturalreflottypename)
      .filter((name: string | null | undefined) => Boolean(name));
  }

  const seller = sellerRes.data as any;
  const urbanDetailsData = urbanDetailsRes.data as any;
  const urbanLotTypeName =
    urbanDetailsData?.urbanreflottype?.[0]?.urbanreflottypename ??
    urbanDetailsData?.urbanreflottype?.urbanreflottypename ??
    null;

  return {
    propertyid: Number(property.propertyid),
    propertyname: property.propertyname ?? `Property #${property.propertyid}`,
    createdat: property.createdat ?? new Date().toISOString(),
    statusCode: property.propertylistingstatus?.propertylistingstatuscode ?? 'PND',
    statusName: property.propertylistingstatus?.propertylistingstatusname ?? 'Pending',
    propertyTypeName: property.propertytype?.propertytypename ?? null,
    sellerName: formatName(seller?.firstname, seller?.middlename, seller?.lastname) || `Seller #${sellerClientId ?? 'N/A'}`,
    sellerEmail: seller?.emailaddress ?? null,
    sellerContact: seller?.contactnumber ?? null,
    location: locationRes.data
      ? {
          island: locationRes.data.propertyisland ?? null,
          region: locationRes.data.propertyregion ?? null,
          province: locationRes.data.propertyprovince ?? null,
          city: locationRes.data.propertycity ?? null,
          barangay: locationRes.data.propertybarangay ?? null,
          street: locationRes.data.propertystreet ?? null,
          size: locationRes.data.propertysize ?? null,
        }
      : null,
    utilities: utilitiesRes.data
      ? {
          hasWater: Boolean(utilitiesRes.data.propertyhaswater),
          hasElectricity: Boolean(utilitiesRes.data.propertyhaselectricity),
          hasMobileSignal: Boolean(utilitiesRes.data.propertyhasmobilesignal),
          hasInternet: Boolean(utilitiesRes.data.propertyhasinternet),
        }
      : null,
    accessibility: accessibilityRes.data
      ? {
          byMotorcycle: Boolean(accessibilityRes.data.propertybymotorcycle),
          byCar: Boolean(accessibilityRes.data.propertybycar),
          byTruck: Boolean(accessibilityRes.data.propertybytruck),
          byAccessRoad: Boolean(accessibilityRes.data.propertybyaccessroad),
          byCementedRoad: Boolean(accessibilityRes.data.propertybycementedroad),
          byRoughRoad: Boolean(accessibilityRes.data.propertybyroughroad),
          otherDetails: accessibilityRes.data.propertyotherdetails ?? null,
        }
      : null,
    urbanLotType: urbanLotTypeName,
    urbanAmenities: urbanAmenitiesRes.data
      ? {
          hasGated: Boolean(urbanAmenitiesRes.data.hasgated),
          hasSecurity: Boolean(urbanAmenitiesRes.data.hassecurity),
          hasClubhouse: Boolean(urbanAmenitiesRes.data.hasclubhouse),
          hasSportsFitnessCenter: Boolean(urbanAmenitiesRes.data.hassportsfitnesscenter),
          hasParksPlaygrounds: Boolean(urbanAmenitiesRes.data.hasparksplaygrounds),
          amenitiesNotes: urbanAmenitiesRes.data.amenitiesnotes ?? null,
        }
      : null,
    agriculturalLotTypes,
    agriculturalAmenities: agriAmenitiesRes.data
      ? {
          hasFarmhouse: Boolean(agriAmenitiesRes.data.hasfarmhouse),
          hasBarns: Boolean(agriAmenitiesRes.data.hasbarns),
          hasWarehouseStorage: Boolean(agriAmenitiesRes.data.haswarehousestorage),
          hasRiversStreams: Boolean(agriAmenitiesRes.data.hasriversstreams),
          hasIrrigationCanal: Boolean(agriAmenitiesRes.data.hasirrigationcanal),
          hasLakeLagoon: Boolean(agriAmenitiesRes.data.haslakelagoon),
          amenitiesNotes: agriAmenitiesRes.data.amenitiesnotes ?? null,
        }
      : null,
    photos: (photosRes.data ?? []).map((photo: any) => ({
      propertyphotoid: Number(photo.propertyphotoid),
      photoorder: photo.photoorder ?? null,
      photofilename: photo.photofilename ?? null,
      photomimetype: photo.photomimetype ?? null,
      photosize: photo.photosize ?? null,
      photoDataUrl: buildPhotoDataUrl(photo.photodata, photo.photomimetype),
    })),
  };
};

const deleteSubmissionProperty = async (propertyId: number): Promise<void> => {
  const { error } = await supabaseAdmin.rpc('delete_property_cascade', {
    p_propertyid: propertyId,
  });

  if (error) throw error;
};

const getPropertyId = (value: string | string[] | undefined): number => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const propertyId = Number(rawValue);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw new Error('Invalid propertyId');
  }
  return propertyId;
};

export default async function handler(req: any, res: any) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  try {
    if (req.method === 'GET') {
      const hasPropertyId = req.query?.propertyId != null;

      if (hasPropertyId) {
        const propertyId = getPropertyId(req.query.propertyId);
        const detail = await fetchSellerSubmissionDetail(propertyId);
        res.status(200).json(detail);
        return;
      }

      const rows = await fetchSellerSubmissions();
      res.status(200).json(rows);
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

    if (req.method === 'PATCH') {
      const propertyId = Number(body.propertyId);
      const code = body.code as SellerSubmissionStatusCode;
      if (!Number.isInteger(propertyId) || propertyId <= 0) {
        res.status(400).json({ error: 'Invalid propertyId' });
        return;
      }
      if (!['PND', 'REV', 'ACC', 'REJ', 'AVL'].includes(code)) {
        res.status(400).json({ error: 'Invalid status code' });
        return;
      }

      await setSubmissionStatus(propertyId, code);
      res.status(200).json({ success: true });
      return;
    }

    if (req.method === 'DELETE') {
      const propertyId = Number(body.propertyId);
      if (!Number.isInteger(propertyId) || propertyId <= 0) {
        res.status(400).json({ error: 'Invalid propertyId' });
        return;
      }

      await deleteSubmissionProperty(propertyId);
      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Request failed' });
  }
}
