import { supabaseAdmin } from '../admin/_utils/supabaseAdmin';

type ConsultationBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredPropertyTypeId?: number;
  preferredLocation?: string;
  budgetRange?: string;
  additionalRequirements?: string | null;
};

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const resolveClientId = async (fullName: string, email: string, phone: string): Promise<number> => {
  const normalizedEmail = email.trim();
  const normalizedPhone = phone.trim();

  const { data: existingByEmail, error: emailError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('emailaddress', normalizedEmail)
    .limit(1);

  if (emailError) throw emailError;

  if (existingByEmail?.[0]?.clientid) {
    return Number(existingByEmail[0].clientid);
  }

  const { data: existingByPhone, error: phoneError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('contactnumber', normalizedPhone)
    .limit(1);

  if (phoneError) throw phoneError;

  if (existingByPhone?.[0]?.clientid) {
    return Number(existingByPhone[0].clientid);
  }

  const { firstName, middleName, lastName } = splitFullName(fullName);

  const { data: createdClient, error: createError } = await supabaseAdmin
    .from('client')
    .insert([
      {
        firstname: firstName,
        middlename: middleName || null,
        lastname: lastName,
        emailaddress: normalizedEmail,
        contactnumber: normalizedPhone,
        clientsource: 'consultation_form',
      },
    ])
    .select('clientid')
    .single();

  if (createError || !createdClient) {
    throw createError ?? new Error('Failed to create client record');
  }

  return Number(createdClient.clientid);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as ConsultationBody;

    const fullName = String(body.fullName ?? '').trim();
    const email = String(body.email ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const preferredPropertyTypeId = Number(body.preferredPropertyTypeId);
    const preferredLocation = String(body.preferredLocation ?? '').trim();
    const budgetRange = String(body.budgetRange ?? '').trim();
    const additionalRequirements =
      body.additionalRequirements == null || String(body.additionalRequirements).trim() === ''
        ? null
        : String(body.additionalRequirements).trim();

    if (!fullName || !email || !phone || !preferredLocation || !budgetRange || !Number.isFinite(preferredPropertyTypeId) || preferredPropertyTypeId <= 0) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const clientId = await resolveClientId(fullName, email, phone);

    const { data: consultationRow, error: consultationError } = await supabaseAdmin
      .from('consultationrequest')
      .insert([
        {
          clientid: clientId,
          fullname: fullName,
          emailaddress: email,
          contactnumber: phone,
          preferredpropertytypeid: preferredPropertyTypeId,
          preferredlocation: preferredLocation,
          budgetrange: budgetRange,
          additionalrequirements: additionalRequirements,
          consultationstatus: 'New',
          assignedstaffid: null,
          scheduledat: null,
        },
      ])
      .select('consultationrequestid')
      .single();

    if (consultationError || !consultationRow) {
      throw consultationError ?? new Error('Failed to create consultation request');
    }

    res.status(201).json({
      success: true,
      consultationRequestId: Number(consultationRow.consultationrequestid),
      clientId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to submit consultation request' });
  }
}
