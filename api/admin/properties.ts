import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from './_utils/auth.js';
import { supabaseAdmin } from './_utils/supabaseAdmin.js';

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

const mapPropertyRow = (item: any): any => {
  const project = getSingleRelation<{ projectname?: string }>(item.project);
  const propertyType = getSingleRelation<{ propertytypename?: string }>(item.propertytype);
  const client = getSingleRelation<{
    firstname?: string | null;
    middlename?: string | null;
    lastname?: string | null;
  }>(item.client);
  const listingStatus = getSingleRelation<{ propertylistingstatusname?: string }>(
    item.propertylistingstatus
  );
  const ownership = getSingleRelation<{
    ownershipname?: string;
    propertyownershipname?: string;
    name?: string;
  }>(item.propertyownership);
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
  const urbanDetails = getSingleRelation<{ urbanreflottypeid?: number | null }>(
    item.urbanpropertydetails
  );
  const agriAmenities = getSingleRelation<{
    hasfarmhouse?: boolean;
    hasbarns?: boolean;
    haswarehousestorage?: boolean;
    hasriversstreams?: boolean;
    hasirrigationcanal?: boolean;
    haslakelagoon?: boolean;
  }>(item.agriculturalpropertyamenities);

  const sellerName = [client?.firstname, client?.middlename, client?.lastname]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    propertyid: item.propertyid,
    propertyname: item.propertyname,
    is_archived: item.is_archived,
    projectid: item.projectid,
    propertytypeid: item.propertytypeid ?? null,
    sellerclientid: item.sellerclientid ?? null,
    propertylistingstatusid: item.propertylistingstatusid,
    propertyownershipid: item.propertyownershipid ?? null,
    project_name: project?.projectname,
    seller_name: sellerName,
    property_type_name: propertyType?.propertytypename,
    listing_status_name: listingStatus?.propertylistingstatusname,
    ownership_name: ownership?.propertyownershipname ?? ownership?.name,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify admin session
  if (!requireAdminSession(req, res)) {
    return;
  }

  try {
    // GET /api/admin/properties - fetch all properties
    if (req.method === 'GET') {
      const query = req.query.action as string;

      if (query === 'load') {
        const [
          propertyTypesRes,
          propertiesRes,
          projectsRes,
          sellersRes,
          listingStatusesRes,
          urbanLotTypesRes,
          agriculturalLotTypesRes,
        ] = await Promise.all([
          supabaseAdmin
            .from('propertytype')
            .select('propertytypeid, propertytypename')
            .order('propertytypeid', { ascending: true }),
          supabaseAdmin.from('property').select(PROPERTY_SELECT).order('propertyid', { ascending: true }),
          supabaseAdmin
            .from('project')
            .select('projectid, projectname')
            .order('projectid', { ascending: true }),
          supabaseAdmin
            .from('client')
            .select('clientid, firstname, middlename, lastname')
            .order('clientid', { ascending: true }),
          supabaseAdmin
            .from('propertylistingstatus')
            .select('propertylistingstatusid, propertylistingstatusname')
            .order('propertylistingstatusid', { ascending: true }),
          supabaseAdmin
            .from('urbanreflottype')
            .select('urbanreflottypeid, urbanreflottypename')
            .order('urbanreflottypeid', { ascending: true }),
          supabaseAdmin
            .from('agriculturalreflottype')
            .select('agriculturalreflottypeid, agriculturalreflottypename')
            .order('agriculturalreflottypeid', { ascending: true }),
        ]);

        const properties = (propertiesRes.data ?? []).map((item: any) => mapPropertyRow(item));

        return res.status(200).json({
          properties,
          projects: projectsRes.data ?? [],
          sellers: (sellersRes.data ?? []).map((seller: any) => ({
            clientid: seller.clientid,
            name: [seller.firstname, seller.middlename, seller.lastname]
              .filter(Boolean)
              .join(' ')
              .trim(),
          })),
          propertyTypes: propertyTypesRes.data ?? [],
          listingStatuses: listingStatusesRes.data ?? [],
          urbanLotTypes: urbanLotTypesRes.data ?? [],
          agriculturalLotTypes: agriculturalLotTypesRes.data ?? [],
        });
      }

      if (query === 'details') {
        const propertyId = parseInt(req.query.id as string, 10);
        if (isNaN(propertyId)) {
          return res.status(400).json({ error: 'Invalid property ID' });
        }

        const [locationRes, utilitiesRes, accessibilityRes, urbanAmenitiesRes, urbanDetailsRes, agriAmenitiesRes, agriDetailsRes] = await Promise.all([
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
            .select('propertybymotorcycle, propertybycar, propertybytruck, propertybyaccessroad, propertybycementedroad, propertybyroughroad')
            .eq('propertyid', propertyId)
            .maybeSingle(),
          supabaseAdmin
            .from('urbanpropertyamenities')
            .select('hasgated, hassecurity, hasclubhouse, hassportsfitnesscenter, hasparksplaygrounds')
            .eq('propertyid', propertyId)
            .maybeSingle(),
          supabaseAdmin
            .from('urbanpropertydetails')
            .select('urbanreflottypeid')
            .eq('propertyid', propertyId)
            .maybeSingle(),
          supabaseAdmin
            .from('agriculturalpropertyamenities')
            .select('hasfarmhouse, hasbarns, haswarehousestorage, hasriversstreams, hasirrigationcanal, haslakelagoon')
            .eq('propertyid', propertyId)
            .maybeSingle(),
          supabaseAdmin
            .from('agriculturalpropertydetails')
            .select('agriculturalpropertydetailsid')
            .eq('propertyid', propertyId)
            .maybeSingle(),
        ]);

        let agriculturalreflottypeids: number[] = [];

        if (agriDetailsRes.data?.agriculturalpropertydetailsid) {
          const { data, error } = await supabaseAdmin
            .from('agriculturalpropertylottype')
            .select('agriculturalreflottypeid')
            .eq('agriculturalpropertydetailsid', agriDetailsRes.data.agriculturalpropertydetailsid);

          if (error) throw error;
          agriculturalreflottypeids = (data ?? []).map((row: any) => Number(row.agriculturalreflottypeid));
        }

        return res.status(200).json({
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
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // POST /api/admin/properties - create property
    if (req.method === 'POST') {
      const { payload } = req.body;

      const { data, error } = await supabaseAdmin
        .from('property')
        .insert([payload])
        .select(PROPERTY_SELECT)
        .single();

      if (error || !data) {
        throw error ?? new Error('Failed to create property');
      }

      return res.status(201).json(data);
    }

    // PUT /api/admin/properties - update property
    if (req.method === 'PUT') {
      const { propertyid, payload } = req.body;

      if (!propertyid) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('property')
        .update(payload)
        .eq('propertyid', propertyid)
        .select(PROPERTY_SELECT)
        .single();

      if (error || !data) {
        throw error ?? new Error('Failed to update property');
      }

      return res.status(200).json(data);
    }

    // DELETE /api/admin/properties - delete property
    if (req.method === 'DELETE') {
      const { propertyid } = req.body;

      if (!propertyid) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      const { error } = await supabaseAdmin.rpc('delete_property_cascade', {
        p_propertyid: propertyid,
      });

      if (error) {
        if (error.message?.includes('fk_transaction_property')) {
          return res.status(400).json({ error: 'Property has linked transactions' });
        }
        throw error;
      }

      return res.status(200).json({ success: true });
    }

    // PATCH /api/admin/properties - archive/unarchive property
    if (req.method === 'PATCH') {
      const { propertyid, action } = req.body;

      if (!propertyid || !action) {
        return res.status(400).json({ error: 'Property ID and action are required' });
      }

      const isArchive = action === 'archive';
      const { data, error } = await supabaseAdmin
        .from('property')
        .update({ is_archived: isArchive })
        .eq('propertyid', propertyid)
        .select(PROPERTY_SELECT)
        .single();

      if (error || !data) {
        throw error ?? new Error(`Failed to ${action} property`);
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Property API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
