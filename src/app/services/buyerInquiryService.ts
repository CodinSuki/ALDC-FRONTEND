/**
 * Buyer Inquiry Service
 * Handles submission of buyer interest forms to the backend
 * 
 * Flow:
 * 1. Submit client data (buyer) to create/retrieve client record
 * 2. Submit buyer_inquiry with the client_id and property_id
 */

interface BuyerData {
  first_name: string;
  middle_name: string;
  last_name: string;
  contact_email: string;
  contact_number: string;
  role: 'buyer';
  source: 'buyer_form';
}

interface InquiryData {
  property_id: string;
  message: string;
  status: 'new';
}

interface BuyerInquiryPayload {
  client: BuyerData;
  inquiry: InquiryData;
}

const API_BASE = 'http://localhost/aldc-system/api';

/**
 * Submit buyer interest inquiry
 * Creates a client record (or retrieves if exists) and creates a buyer_inquiry
 */
export async function submitBuyerInquiry(
  payload: BuyerInquiryPayload
): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE}/public/buyer-inquiry/submit_buyer_inquiry.php`,
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
        message: 'Failed to submit inquiry',
        error: data.error || 'Unknown error',
      };
    }

    return {
      success: data.success || false,
      message: data.message || 'Inquiry submitted',
      data: data.data,
    };
  } catch (error) {
    console.error('Buyer inquiry submission error:', error);
    return {
      success: false,
      message: 'Network error',
      error: String(error),
    };
  }
}
