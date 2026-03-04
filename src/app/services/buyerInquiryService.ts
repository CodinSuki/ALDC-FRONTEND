
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

export async function submitBuyerInquiry(
  payload: BuyerInquiryPayload
): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/public?resource=buyer-inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

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
