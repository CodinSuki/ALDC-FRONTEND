import { supabaseAdmin } from '../admin/_utils/supabaseAdmin';

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

const resolveClientId = async (client: NonNullable<BuyerInquiryBody['client']>): Promise<number> => {
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
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

    const clientId = await resolveClientId({
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message ?? 'Failed to submit buyer inquiry' });
  }
}
