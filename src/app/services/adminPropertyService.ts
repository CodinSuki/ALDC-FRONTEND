import { supabase } from '../../lib/SupabaseClient';

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

export interface AdminProperty {
  propertyid: number;
  propertyname: string;
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
}

const PROPERTY_SELECT = `
  *,
  project!fk_property_project(projectname),
  propertytype!fk_property_propertytype(propertytypename),
  client!fk_property_seller(firstname,middlename,lastname),
  propertylistingstatus!fk_propertylistingstatus_property(propertylistingstatusname),
  propertyownership!fk_propertyownership_property(*),
  propertylocation!fk_propertylocation_property(
    propertyisland,
    propertyregion,
    propertyprovince,
    propertycity,
    propertybarangay,
    propertystreet,
    propertysize
  ),
  propertyutilities!fk_utilities_cliient(
    propertyhaswater,
    propertyhaselectricity,
    propertyhasmobilesignal,
    propertyhasinternet
  ),
  propertyaccessibility!fk_accessibility_property(
    propertybymotorcycle,
    propertybycar,
    propertybytruck,
    propertybyaccessroad,
    propertybycementedroad,
    propertybyroughroad
  ),
  urbanpropertyamenities!fk_urbanpropertyamenities_property(
    hasgated,
    hassecurity,
    hasclubhouse,
    hassportsfitnesscenter,
    hasparksplaygrounds
  ),
  urbanpropertydetails!fk_urbanpropertydetails_property(
    urbanreflottypeid
  ),
  agriculturalpropertyamenities!fk_agriculturalpropertyamenities_property(
    hasfarmhouse,
    hasbarns,
    haswarehousestorage,
    hasriversstreams,
    hasirrigationcanal,
    haslakelagoon
  )
`;

const getSingleRelation = <T>(value: T | T[] | null | undefined): T | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const mapPropertyRow = (item: any, lookup: PropertyLookup): AdminProperty => {
  const project = getSingleRelation<{ projectname?: string }>(item.project);
  const propertyType = getSingleRelation<{ propertytypename?: string }>(item.propertytype);
  const client = getSingleRelation<{ firstname?: string | null; middlename?: string | null; lastname?: string | null }>(item.client);
  const listingStatus = getSingleRelation<{ propertylistingstatusname?: string }>(item.propertylistingstatus);
  const ownership = getSingleRelation<{ ownershipname?: string; propertyownershipname?: string; name?: string }>(item.propertyownership);
  const location = getSingleRelation<{
    propertyisland?: string;
    propertyregion?: string;
    propertyprovince?: string;
    propertycity?: string;
    propertybarangay?: string;
    propertystreet?: string;
    propertysize?: number;
  }>(item.propertylocation);
  const utilities = getSingleRelation<{
    propertyhaswater?: boolean;
    propertyhaselectricity?: boolean;
    propertyhasmobilesignal?: boolean;
    propertyhasinternet?: boolean;
  }>(item.propertyutilities);
  const accessibility = getSingleRelation<{
    propertybymotorcycle?: boolean;
    propertybycar?: boolean;
    propertybytruck?: boolean;
    propertybyaccessroad?: boolean;
    propertybycementedroad?: boolean;
    propertybyroughroad?: boolean;
  }>(item.propertyaccessibility);
  const amenities = getSingleRelation<{
    hasgated?: boolean;
    hassecurity?: boolean;
    hasclubhouse?: boolean;
    hassportsfitnesscenter?: boolean;
    hasparksplaygrounds?: boolean;
  }>(item.urbanpropertyamenities);
  const urbanDetails = getSingleRelation<{ urbanreflottypeid?: number | null }>(item.urbanpropertydetails);
  const agriAmenities = getSingleRelation<{
    hasfarmhouse?: boolean;
    hasbarns?: boolean;
    haswarehousestorage?: boolean;
    hasriversstreams?: boolean;
    hasirrigationcanal?: boolean;
    haslakelagoon?: boolean;
  }>(item.agriculturalpropertyamenities);

  const sellerNameFromJoin = [client?.firstname, client?.middlename, client?.lastname]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    propertyid: Number(item.propertyid),
    propertyname: item.propertyname,
    projectid: Number(item.projectid),
    propertytypeid: item.propertytypeid ? Number(item.propertytypeid) : null,
    sellerclientid: item.sellerclientid ? Number(item.sellerclientid) : null,
    propertylistingstatusid: Number(item.propertylistingstatusid ?? 0),
    propertyownershipid: item.propertyownershipid ? Number(item.propertyownershipid) : null,
    project_name: project?.projectname ?? lookup.projects.find((p) => p.projectid === Number(item.projectid))?.projectname,
    seller_name: sellerNameFromJoin || (item.sellerclientid
      ? lookup.sellers.find((s) => s.clientid === Number(item.sellerclientid))?.name
      : undefined),
    property_type_name: propertyType?.propertytypename ?? lookup.propertyTypes.find((type) => type.propertytypeid === Number(item.propertytypeid))?.propertytypename,
    listing_status_name:
      listingStatus?.propertylistingstatusname ??
      lookup.listingStatuses.find((status) => status.propertylistingstatusid === Number(item.propertylistingstatusid))?.propertylistingstatusname,
    ownership_name: ownership?.ownershipname ?? ownership?.propertyownershipname ?? ownership?.name,
    location_island: location?.propertyisland ?? 'Luzon',
    location_region: location?.propertyregion ?? '',
    location_province: location?.propertyprovince ?? '',
    location_city: location?.propertycity ?? '',
    location_barangay: location?.propertybarangay ?? '',
    location_street: location?.propertystreet ?? '',
    lot_size: Number(location?.propertysize ?? 0),
    urbanreflottypeid: urbanDetails?.urbanreflottypeid ?? null,
    utilities_water: Boolean(utilities?.propertyhaswater),
    utilities_electricity: Boolean(utilities?.propertyhaselectricity),
    utilities_sim: Boolean(utilities?.propertyhasmobilesignal),
    utilities_internet: Boolean(utilities?.propertyhasinternet),
    access_motorcycle: Boolean(accessibility?.propertybymotorcycle),
    access_car: Boolean(accessibility?.propertybycar),
    access_truck: Boolean(accessibility?.propertybytruck),
    access_road: Boolean(accessibility?.propertybyaccessroad),
    access_cemented_road: Boolean(accessibility?.propertybycementedroad),
    access_rough_road: Boolean(accessibility?.propertybyroughroad),
    facilities_gated: Boolean(amenities?.hasgated),
    facilities_security: Boolean(amenities?.hassecurity),
    facilities_clubhouse: Boolean(amenities?.hasclubhouse),
    facilities_sports: Boolean(amenities?.hassportsfitnesscenter),
    facilities_parks: Boolean(amenities?.hasparksplaygrounds),
    agriculturalreflottypeids: [],
    agri_hasfarmhouse: Boolean(agriAmenities?.hasfarmhouse),
    agri_hasbarns: Boolean(agriAmenities?.hasbarns),
    agri_haswarehousestorage: Boolean(agriAmenities?.haswarehousestorage),
    agri_hasriversstreams: Boolean(agriAmenities?.hasriversstreams),
    agri_hasirrigationcanal: Boolean(agriAmenities?.hasirrigationcanal),
    agri_haslakelagoon: Boolean(agriAmenities?.haslakelagoon),
  };
};

const isAgriculturalType = (propertyTypeId: number | null, lookup: PropertyLookup): boolean => {
  if (!propertyTypeId) return false;
  const propertyTypeName = lookup.propertyTypes.find((type) => type.propertytypeid === propertyTypeId)?.propertytypename ?? '';
  return propertyTypeName.toLowerCase().includes('agri');
};

const savePropertyDetailRowsByType = async (
  propertyId: number,
  propertyTypeId: number | null,
  details: PropertyDetailPayload,
  lookup: PropertyLookup
): Promise<void> => {
  const locationPayload = {
    propertyid: propertyId,
    propertyisland: details.location_island,
    propertyregion: details.location_region,
    propertyprovince: details.location_province,
    propertycity: details.location_city,
    propertybarangay: details.location_barangay,
    propertystreet: details.location_street,
    propertysize: details.lot_size,
  };

  const utilitiesPayload = {
    propertyid: propertyId,
    propertyhaswater: details.utilities_water,
    propertyhaselectricity: details.utilities_electricity,
    propertyhasmobilesignal: details.utilities_sim,
    propertyhasinternet: details.utilities_internet,
  };

  const accessibilityPayload = {
    propertyid: propertyId,
    propertybymotorcycle: details.access_motorcycle,
    propertybycar: details.access_car,
    propertybytruck: details.access_truck,
    propertybyaccessroad: details.access_road,
    propertybycementedroad: details.access_cemented_road,
    propertybyroughroad: details.access_rough_road,
  };

  const isAgricultural = isAgriculturalType(propertyTypeId, lookup);

  const { data: existingAgriDetails, error: existingAgriDetailsError } = await supabase
    .from('agriculturalpropertydetails')
    .select('agriculturalpropertydetailsid')
    .eq('propertyid', propertyId);

  if (existingAgriDetailsError) throw existingAgriDetailsError;

  const agriDetailIds = (existingAgriDetails ?? []).map((row) => row.agriculturalpropertydetailsid);

  if (agriDetailIds.length > 0) {
    const { error } = await supabase
      .from('agriculturalpropertylottype')
      .delete()
      .in('agriculturalpropertydetailsid', agriDetailIds);

    if (error) throw error;
  }

  const [locationDeleteRes, utilitiesDeleteRes, accessDeleteRes, urbanAmenitiesDeleteRes, urbanDetailsDeleteRes, agriAmenitiesDeleteRes, agriDetailsDeleteRes] = await Promise.all([
    supabase.from('propertylocation').delete().eq('propertyid', propertyId),
    supabase.from('propertyutilities').delete().eq('propertyid', propertyId),
    supabase.from('propertyaccessibility').delete().eq('propertyid', propertyId),
    supabase.from('urbanpropertyamenities').delete().eq('propertyid', propertyId),
    supabase.from('urbanpropertydetails').delete().eq('propertyid', propertyId),
    supabase.from('agriculturalpropertyamenities').delete().eq('propertyid', propertyId),
    supabase.from('agriculturalpropertydetails').delete().eq('propertyid', propertyId),
  ]);

  if (locationDeleteRes.error) throw locationDeleteRes.error;
  if (utilitiesDeleteRes.error) throw utilitiesDeleteRes.error;
  if (accessDeleteRes.error) throw accessDeleteRes.error;
  if (urbanAmenitiesDeleteRes.error) throw urbanAmenitiesDeleteRes.error;
  if (urbanDetailsDeleteRes.error) throw urbanDetailsDeleteRes.error;
  if (agriAmenitiesDeleteRes.error) throw agriAmenitiesDeleteRes.error;
  if (agriDetailsDeleteRes.error) throw agriDetailsDeleteRes.error;

  const [locationInsertRes, utilitiesInsertRes, accessInsertRes] = await Promise.all([
    supabase.from('propertylocation').insert([locationPayload]),
    supabase.from('propertyutilities').insert([utilitiesPayload]),
    supabase.from('propertyaccessibility').insert([accessibilityPayload]),
  ]);

  if (locationInsertRes.error) throw locationInsertRes.error;
  if (utilitiesInsertRes.error) throw utilitiesInsertRes.error;
  if (accessInsertRes.error) throw accessInsertRes.error;

  if (isAgricultural) {
    const agriAmenitiesPayload = {
      propertyid: propertyId,
      hasfarmhouse: details.agri_hasfarmhouse,
      hasbarns: details.agri_hasbarns,
      haswarehousestorage: details.agri_haswarehousestorage,
      hasriversstreams: details.agri_hasriversstreams,
      hasirrigationcanal: details.agri_hasirrigationcanal,
      haslakelagoon: details.agri_haslakelagoon,
    };

    const { error: agriAmenitiesError } = await supabase
      .from('agriculturalpropertyamenities')
      .insert([agriAmenitiesPayload]);

    if (agriAmenitiesError) throw agriAmenitiesError;

    if (details.agriculturalreflottypeids.length > 0) {
      const { data: createdAgriDetails, error: createdAgriDetailsError } = await supabase
        .from('agriculturalpropertydetails')
        .insert([{ propertyid: propertyId }])
        .select('agriculturalpropertydetailsid')
        .single();

      if (createdAgriDetailsError || !createdAgriDetails) {
        throw createdAgriDetailsError ?? new Error('Failed to create agricultural property details');
      }

      const agriculturalLotTypeRows = details.agriculturalreflottypeids.map((lotTypeId) => ({
        agriculturalpropertydetailsid: createdAgriDetails.agriculturalpropertydetailsid,
        agriculturalreflottypeid: lotTypeId,
      }));

      const { error: agriLotTypesError } = await supabase
        .from('agriculturalpropertylottype')
        .insert(agriculturalLotTypeRows);

      if (agriLotTypesError) throw agriLotTypesError;
    }

    return;
  }

  const urbanAmenitiesPayload = {
    propertyid: propertyId,
    hasgated: details.facilities_gated,
    hassecurity: details.facilities_security,
    hasclubhouse: details.facilities_clubhouse,
    hassportsfitnesscenter: details.facilities_sports,
    hasparksplaygrounds: details.facilities_parks,
  };

  const { error: urbanAmenitiesError } = await supabase
    .from('urbanpropertyamenities')
    .insert([urbanAmenitiesPayload]);

  if (urbanAmenitiesError) throw urbanAmenitiesError;

  if (details.urbanreflottypeid) {
    const { error: urbanDetailsError } = await supabase
      .from('urbanpropertydetails')
      .insert([{ propertyid: propertyId, urbanreflottypeid: details.urbanreflottypeid }]);

    if (urbanDetailsError) throw urbanDetailsError;
  }
};

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
>> => {
  const [locationRes, utilitiesRes, accessibilityRes, urbanAmenitiesRes, urbanDetailsRes, agriAmenitiesRes, agriDetailsRes] = await Promise.all([
    supabase
      .from('propertylocation')
      .select('propertyisland, propertyregion, propertyprovince, propertycity, propertybarangay, propertystreet, propertysize')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabase
      .from('propertyutilities')
      .select('propertyhaswater, propertyhaselectricity, propertyhasmobilesignal, propertyhasinternet')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabase
      .from('propertyaccessibility')
      .select('propertybymotorcycle, propertybycar, propertybytruck, propertybyaccessroad, propertybycementedroad, propertybyroughroad')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabase
      .from('urbanpropertyamenities')
      .select('hasgated, hassecurity, hasclubhouse, hassportsfitnesscenter, hasparksplaygrounds')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabase
      .from('urbanpropertydetails')
      .select('urbanreflottypeid')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabase
      .from('agriculturalpropertyamenities')
      .select('hasfarmhouse, hasbarns, haswarehousestorage, hasriversstreams, hasirrigationcanal, haslakelagoon')
      .eq('propertyid', propertyId)
      .maybeSingle(),
    supabase
      .from('agriculturalpropertydetails')
      .select('agriculturalpropertydetailsid')
      .eq('propertyid', propertyId)
      .maybeSingle(),
  ]);

  if (locationRes.error) throw locationRes.error;
  if (utilitiesRes.error) throw utilitiesRes.error;
  if (accessibilityRes.error) throw accessibilityRes.error;
  if (urbanAmenitiesRes.error) throw urbanAmenitiesRes.error;
  if (urbanDetailsRes.error) throw urbanDetailsRes.error;
  if (agriAmenitiesRes.error) throw agriAmenitiesRes.error;
  if (agriDetailsRes.error) throw agriDetailsRes.error;

  let agriculturalreflottypeids: number[] = [];

  if (agriDetailsRes.data?.agriculturalpropertydetailsid) {
    const { data, error } = await supabase
      .from('agriculturalpropertylottype')
      .select('agriculturalreflottypeid')
      .eq('agriculturalpropertydetailsid', agriDetailsRes.data.agriculturalpropertydetailsid);

    if (error) throw error;
    agriculturalreflottypeids = (data ?? []).map((row) => Number(row.agriculturalreflottypeid));
  }

  return {
    location_island: locationRes.data?.propertyisland ?? 'Luzon',
    location_region: locationRes.data?.propertyregion ?? '',
    location_province: locationRes.data?.propertyprovince ?? '',
    location_city: locationRes.data?.propertycity ?? '',
    location_barangay: locationRes.data?.propertybarangay ?? '',
    location_street: locationRes.data?.propertystreet ?? '',
    lot_size: Number(locationRes.data?.propertysize ?? 0),
    urbanreflottypeid: urbanDetailsRes.data?.urbanreflottypeid ?? null,
    utilities_water: Boolean(utilitiesRes.data?.propertyhaswater),
    utilities_electricity: Boolean(utilitiesRes.data?.propertyhaselectricity),
    utilities_sim: Boolean(utilitiesRes.data?.propertyhasmobilesignal),
    utilities_internet: Boolean(utilitiesRes.data?.propertyhasinternet),
    access_motorcycle: Boolean(accessibilityRes.data?.propertybymotorcycle),
    access_car: Boolean(accessibilityRes.data?.propertybycar),
    access_truck: Boolean(accessibilityRes.data?.propertybytruck),
    access_road: Boolean(accessibilityRes.data?.propertybyaccessroad),
    access_cemented_road: Boolean(accessibilityRes.data?.propertybycementedroad),
    access_rough_road: Boolean(accessibilityRes.data?.propertybyroughroad),
    facilities_gated: Boolean(urbanAmenitiesRes.data?.hasgated),
    facilities_security: Boolean(urbanAmenitiesRes.data?.hassecurity),
    facilities_clubhouse: Boolean(urbanAmenitiesRes.data?.hasclubhouse),
    facilities_sports: Boolean(urbanAmenitiesRes.data?.hassportsfitnesscenter),
    facilities_parks: Boolean(urbanAmenitiesRes.data?.hasparksplaygrounds),
    agriculturalreflottypeids,
    agri_hasfarmhouse: Boolean(agriAmenitiesRes.data?.hasfarmhouse),
    agri_hasbarns: Boolean(agriAmenitiesRes.data?.hasbarns),
    agri_haswarehousestorage: Boolean(agriAmenitiesRes.data?.haswarehousestorage),
    agri_hasriversstreams: Boolean(agriAmenitiesRes.data?.hasriversstreams),
    agri_hasirrigationcanal: Boolean(agriAmenitiesRes.data?.hasirrigationcanal),
    agri_haslakelagoon: Boolean(agriAmenitiesRes.data?.haslakelagoon),
  };
};

export const fetchAdminPropertyData = async (): Promise<AdminPropertyLoadResult> => {
  const [propertyTypesRes, propertiesRes, projectsRes, sellersRes, listingStatusesRes, urbanLotTypesRes, agriculturalLotTypesRes] = await Promise.all([
    supabase.from('propertytype').select('propertytypeid, propertytypename').order('propertytypeid', { ascending: true }),
    supabase.from('property').select(PROPERTY_SELECT).order('propertyid', { ascending: true }),
    supabase.from('project').select('projectid, projectname').order('projectid', { ascending: true }),
    supabase.from('client').select('clientid, firstname, middlename, lastname').order('clientid', { ascending: true }),
    supabase
      .from('propertylistingstatus')
      .select('propertylistingstatusid, propertylistingstatusname')
      .order('propertylistingstatusid', { ascending: true }),
    supabase
      .from('urbanreflottype')
      .select('urbanreflottypeid, urbanreflottypename')
      .order('urbanreflottypeid', { ascending: true }),
    supabase
      .from('agriculturalreflottype')
      .select('agriculturalreflottypeid, agriculturalreflottypename')
      .order('agriculturalreflottypeid', { ascending: true }),
  ]);

  if (propertyTypesRes.error) throw propertyTypesRes.error;
  if (propertiesRes.error) throw propertiesRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (sellersRes.error) throw sellersRes.error;
  if (listingStatusesRes.error) throw listingStatusesRes.error;
  if (urbanLotTypesRes.error) throw urbanLotTypesRes.error;
  if (agriculturalLotTypesRes.error) throw agriculturalLotTypesRes.error;

  const propertyTypes = (propertyTypesRes.data ?? []) as PropertyTypeOption[];
  const projects = (projectsRes.data ?? []) as ProjectOption[];
  const sellers = ((sellersRes.data ?? []) as SellerDbRow[]).map((seller) => ({
    clientid: seller.clientid,
    name: [seller.firstname, seller.middlename, seller.lastname].filter(Boolean).join(' ').trim(),
  }));
  const listingStatuses = (listingStatusesRes.data ?? []) as PropertyListingStatusOption[];
  const urbanLotTypes = (urbanLotTypesRes.data ?? []) as UrbanLotTypeOption[];
  const agriculturalLotTypes = (agriculturalLotTypesRes.data ?? []) as AgriculturalLotTypeOption[];

  const lookup: PropertyLookup = {
    projects,
    sellers,
    propertyTypes,
    listingStatuses,
  };

  const properties = (propertiesRes.data ?? []).map((item) => mapPropertyRow(item, lookup));

  return {
    properties,
    projects,
    sellers,
    propertyTypes,
    listingStatuses,
    urbanLotTypes,
    agriculturalLotTypes,
  };
};

export const createAdminProperty = async (
  payload: PropertyPayload,
  detailPayload: PropertyDetailPayload,
  lookup: PropertyLookup
): Promise<AdminProperty> => {
  const { data, error } = await supabase
    .from('property')
    .insert([payload])
    .select(PROPERTY_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create property');
  }

  await savePropertyDetailRowsByType(Number(data.propertyid), payload.propertytypeid, detailPayload, lookup);

  const { data: refreshedData, error: refreshError } = await supabase
    .from('property')
    .select(PROPERTY_SELECT)
    .eq('propertyid', Number(data.propertyid))
    .single();

  if (refreshError || !refreshedData) {
    throw refreshError ?? new Error('Failed to refresh created property');
  }

  return mapPropertyRow(refreshedData, lookup);
};

export const updateAdminProperty = async (
  propertyId: number,
  payload: PropertyPayload,
  detailPayload: PropertyDetailPayload,
  lookup: PropertyLookup
): Promise<AdminProperty> => {
  const { data, error } = await supabase
    .from('property')
    .update(payload)
    .eq('propertyid', propertyId)
    .select(PROPERTY_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to update property');
  }

  await savePropertyDetailRowsByType(propertyId, payload.propertytypeid, detailPayload, lookup);

  const { data: refreshedData, error: refreshError } = await supabase
    .from('property')
    .select(PROPERTY_SELECT)
    .eq('propertyid', propertyId)
    .single();

  if (refreshError || !refreshedData) {
    throw refreshError ?? new Error('Failed to refresh updated property');
  }

  return mapPropertyRow(refreshedData, lookup);
};

export const deleteAdminProperty = async (propertyId: number): Promise<void> => {
  const { error } = await supabase.rpc('delete_property_cascade', {
    p_propertyid: propertyId,
  });

  if (error) {
    throw error;
  }
};
