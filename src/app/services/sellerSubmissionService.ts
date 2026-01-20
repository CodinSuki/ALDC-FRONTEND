/**
 * Seller Submission Service
 * Handles submission of seller property forms to the backend
 * SEPARATE from buyer inquiry logic
 */

interface SellerClientData {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  contact_email: string;
  contact_number: string;
  role: 'seller';
  source: 'seller_form';
}

interface SellerPropertyData {
  // Property Background
  owner_name: string;
  owner_alive: string;
  authority_to_sell: string;
  exclusive_broker: string;
  broker_extension: string;
  tax_responsibility: string;
  documents: string[];
  commission_type: string;
  selling_reason: string;

  // Contact (secondary - already in client)
  title: string;
  phone2: string;
  email2: string;
  social: string;

  // Property Basic
  property_name: string;
  description: string;
  location_island: string;
  location_region: string;
  location_province: string;
  location_city: string;
  location_barangay: string;
  location_street: string;
  lot_size: string;
  property_type: string;

  // Agricultural
  agri_lot_types: string[];
  agri_amenities: string[];

  // Other Lot Types
  lot_type: string;
  amenities: string[];
  titled: string;
  overlooking: string;
  topography: string;

  // Pricing
  price: string;
  pricing_type: string;

  // Utilities
  utilities_water: string;
  utilities_electricity: string;
  utilities_sim: string;
  utilities_internet: string;

  // Facilities & Amenities
  facilities_gated: string;
  facilities_security: string;
  facilities_clubhouse: string;
  facilities_sports: string;
  facilities_parks: string;
  facilities_pool: string;
  facilities_other: string;

  // Accessibility & Vicinity
  access_motorcycle: string;
  access_car: string;
  access_truck: string;
  access_road: string;
  access_cemented_road: string;
  access_rough_road: string;
}

interface SellerSubmissionPayload {
  client: SellerClientData;
  property: SellerPropertyData;
}

const API_BASE = 'http://localhost/aldc-system/api';

/**
 * Submit seller property submission
 * Creates a seller client record and submits property details
 */
export async function submitSellerProperty(
  payload: SellerSubmissionPayload
): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE}/public/seller/submit_seller_property.php`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to submit property',
        error: data.error || 'Unknown error',
      };
    }

    return {
      success: data.success || false,
      message: data.message || 'Property submitted',
      data: data.data,
    };
  } catch (error) {
    console.error('Seller property submission error:', error);
    return {
      success: false,
      message: 'Network error',
      error: String(error),
    };
  }
}
