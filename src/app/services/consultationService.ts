import { supabase } from '../../lib/SupabaseClient';

export interface ConsultationSubmissionPayload {
  fullName: string;
  email: string;
  phone: string;
  preferredPropertyTypeId: number;
  preferredLocation: string;
  budgetRange: string;
  additionalRequirements?: string | null;
}

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', middleName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: parts[0] };
  }

  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const tryInsertConsultation = async (payloads: Array<Record<string, unknown>>) => {
  let lastError: unknown;

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from('consultationrequest')
      .insert([payload])
      .select('consultationrequestid')
      .single();

    if (!error && data) {
      return data.consultationrequestid as number;
    }

    lastError = error;
  }

  throw lastError;
};

const resolveClientId = async (fullName: string, email: string, phone: string): Promise<number | null> => {
  const findExistingByEmail = await supabase
    .from('client')
    .select('clientid')
    .eq('emailaddress', email)
    .limit(1);

  if (findExistingByEmail.error) {
    throw findExistingByEmail.error;
  }

  const existingEmailClient = findExistingByEmail.data?.[0]?.clientid;
  if (existingEmailClient) {
    return Number(existingEmailClient);
  }

  const findExistingByPhone = await supabase
    .from('client')
    .select('clientid')
    .eq('contactnumber', phone)
    .limit(1);

  if (findExistingByPhone.error) {
    throw findExistingByPhone.error;
  }

  const existingPhoneClient = findExistingByPhone.data?.[0]?.clientid;
  if (existingPhoneClient) {
    return Number(existingPhoneClient);
  }

  const { firstName, middleName, lastName } = splitFullName(fullName);

  const clientPayloads: Array<Record<string, unknown>> = [
    {
      firstname: firstName,
      middlename: middleName || null,
      lastname: lastName,
      emailaddress: email,
      contactnumber: phone,
      clientsource: 'consultation_form',
    },
    {
      firstname: firstName,
      middlename: middleName || null,
      lastname: lastName,
      emailaddress: email,
      contactnumber: phone,
    },
  ];

  let lastError: unknown;
  for (const payload of clientPayloads) {
    const { data, error } = await supabase
      .from('client')
      .insert([payload])
      .select('clientid')
      .single();

    if (!error && data) {
      return Number(data.clientid);
    }

    lastError = error;
  }

  throw lastError;
};

export const submitConsultationRequest = async (
  payload: ConsultationSubmissionPayload
): Promise<{ consultationRequestId: number; clientId: number | null }> => {
  const clientId = await resolveClientId(payload.fullName, payload.email, payload.phone);

  const basePayload = {
    fullname: payload.fullName,
    emailaddress: payload.email,
    contactnumber: payload.phone,
    preferredpropertytypeid: payload.preferredPropertyTypeId,
    preferredlocation: payload.preferredLocation,
    budgetrange: payload.budgetRange,
    additionalrequirements: payload.additionalRequirements ?? null,
    consultationstatus: 'New',
  };

  const consultationRequestId = await tryInsertConsultation([
    {
      ...basePayload,
      clientid: clientId,
      assignedstaffid: null,
      scheduledat: null,
    },
    {
      ...basePayload,
      clientid: clientId,
    },
    basePayload,
  ]);

  return {
    consultationRequestId,
    clientId,
  };
};
