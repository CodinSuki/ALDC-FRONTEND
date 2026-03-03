import { supabase } from '../../lib/SupabaseClient';

type PropertyRow = {
  propertyid: number;
  propertyname: string;
  propertytype: { propertytypename: string } | { propertytypename: string }[];
  propertylistingstatus: { propertylistingstatusname: string } | { propertylistingstatusname: string }[];
  propertylocation: { propertycity: string; propertysize: number } | { propertycity: string; propertysize: number }[];
};

export type PublicPropertyListItem = {
  propertyid: number;
  propertyname: string;
  propertytype: { propertytypename: string };
  propertylistingstatus: { propertylistingstatusname: string };
  propertylocation: { propertycity: string; propertysize: number };
};

const getSingleRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
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
    .eq('propertylistingstatusid', Number(publishedStatus.propertylistingstatusid));

  if (error) throw error;

  const rows = (data ?? []) as unknown as PropertyRow[];

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
    };
  });
};

export const fetchPropertyDetails = async (propertyId: number): Promise<MappedPropertyDetail> => {
  const { data, error } = await supabase
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
    .single();

    if (error) throw error;

const row = data as unknown as PropertyDetailRow;

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

    images: [
      "https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?w=800"
    ],

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