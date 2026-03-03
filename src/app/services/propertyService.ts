import { supabase } from '../../lib/SupabaseClient';

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

export type PublicPropertyListItem = {
  propertyid: number;
  propertyname: string;
  propertytype: { propertytypename: string };
  propertylistingstatus: { propertylistingstatusname: string };
  propertylocation: { propertycity: string; propertysize: number };
  imageUrl?: string;
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

export type MappedPropertyDetail = {
  name: string;
  type: string;
  location: string;
  size: string;
  status: string;
  lot_type?: string;

  description?: string;
  property_type?: string;
  lot_size?: string;
  titled?: boolean;
  overlooking?: boolean;
  topography?: string;

  images?: string[];

  utilities: {
    water?: boolean;
    electricity?: boolean;
    sim?: boolean;
    internet?: boolean;
  };

  facilities: {
    gated?: boolean;
    security?: boolean;
    clubhouse?: boolean;
    sports?: boolean;
    parks?: boolean;
    pool?: boolean;
    other?: string;
  };

  accessibility: {
    motorcycle?: boolean;
    car?: boolean;
    truck?: boolean;
    access_road?: boolean;
    cemented_road?: boolean;
    rough_road?: boolean;
  };
};

export const fetchProperties = async (): Promise<PublicPropertyListItem[]> => {
  const { data: publishedStatus, error: publishedStatusError } = await supabase
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', 'AVL')
    .single();

  if (publishedStatusError || !publishedStatus) {
    throw publishedStatusError ?? new Error('Published listing status (AVL) not found.');
  }

  const { data, error } = await supabase
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

  let firstPhotoByPropertyId = new Map<number, string>();

  if (propertyIds.length > 0) {
    const { data: photoData, error: photoError } = await supabase
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

export const fetchPropertyDetails = async (propertyId: number): Promise<MappedPropertyDetail> => {
  const [propertyRes, photoRes] = await Promise.all([
    supabase
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
    supabase
      .from('propertyphoto')
      .select('propertyid, photoorder, photomimetype, photodata')
      .eq('propertyid', propertyId)
      .order('photoorder', { ascending: true }),
  ]);

  if (propertyRes.error || !propertyRes.data) throw propertyRes.error;
  if (photoRes.error) throw photoRes.error;

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
    topography: "Flat",

    description: "Full property details available upon consultation.",

    images,

    lot_type: row.urbanpropertydetails?.[0]?.urbanreflottype?.urbanreflottypename,

    utilities: {
      water: row.propertyutilities?.[0]?.propertyhaswater,
      electricity: row.propertyutilities?.[0]?.propertyhaselectricity,
      sim: row.propertyutilities?.[0]?.propertyhasmobilesignal,
      internet: row.propertyutilities?.[0]?.propertyhasinternet
    },

    facilities: {
      gated: row.urbanpropertyamenities?.[0]?.hasgated,
      security: row.urbanpropertyamenities?.[0]?.hassecurity,
      clubhouse: row.urbanpropertyamenities?.[0]?.hasclubhouse,
      sports: row.urbanpropertyamenities?.[0]?.hassportsfitnesscenter,
      parks: row.urbanpropertyamenities?.[0]?.hasparksplaygrounds,
      pool: false,
      other: ""
    },

    accessibility: {
      motorcycle: row.propertyaccessibility?.[0]?.propertybymotorcycle,
      car: row.propertyaccessibility?.[0]?.propertybycar,
      truck: row.propertyaccessibility?.[0]?.propertybytruck,
      access_road: row.propertyaccessibility?.[0]?.propertybyaccessroad,
      cemented_road: row.propertyaccessibility?.[0]?.propertybycementedroad,
      rough_road: row.propertyaccessibility?.[0]?.propertybyroughroad
    }
  };
};