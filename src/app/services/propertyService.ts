export type PublicPropertyListItem = {
  propertyid: number;
  propertyname: string;
  propertytype: { propertytypename: string };
  propertylistingstatus: { propertylistingstatusname: string };
  propertylocation: { propertycity: string; propertysize: number };
  imageUrl?: string;
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
  const response = await fetch('/api/public?resource=properties', {
    method: 'GET',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    items?: PublicPropertyListItem[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load properties');
  }

  return payload.items ?? [];
};

export const fetchPropertyDetails = async (propertyId: number): Promise<MappedPropertyDetail> => {
  const response = await fetch(`/api/public?resource=properties&id=${encodeURIComponent(String(propertyId))}`, {
    method: 'GET',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    item?: MappedPropertyDetail;
    error?: string;
  };

  if (!response.ok || !payload.item) {
    throw new Error(payload.error ?? 'Failed to load property details');
  }

  return payload.item;
};