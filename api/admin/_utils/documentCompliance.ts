import { supabaseAdmin } from './supabaseAdmin.js';

export type DocumentVerificationStatus =
  | 'PendingVerification'
  | 'Approved'
  | 'Rejected'
  | 'NeedsRevision'
  | 'Archived';

export interface PropertyDocumentMeta {
  verificationStatus: DocumentVerificationStatus;
  isArchived: boolean;
  uploadedByStaffId?: number | null;
  uploadedByClientId?: number | null;
  verifiedByStaffId?: number | null;
  verifiedAt?: string | null;
  previousDocumentId?: number | null;
  notes?: string | null;
}

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

const parseDescription = (description: string | null | undefined): PropertyDocumentMeta => {
  if (!description) {
    return { verificationStatus: 'PendingVerification', isArchived: false };
  }

  try {
    const parsed = JSON.parse(description) as Partial<PropertyDocumentMeta>;
    return {
      verificationStatus: parsed.verificationStatus ?? 'PendingVerification',
      isArchived: Boolean(parsed.isArchived),
      uploadedByStaffId: parsed.uploadedByStaffId ?? null,
      uploadedByClientId: parsed.uploadedByClientId ?? null,
      verifiedByStaffId: parsed.verifiedByStaffId ?? null,
      verifiedAt: parsed.verifiedAt ?? null,
      previousDocumentId: parsed.previousDocumentId ?? null,
      notes: parsed.notes ?? null,
    };
  } catch {
    return { verificationStatus: 'PendingVerification', isArchived: false };
  }
};

export const getPropertyDocumentMeta = (rowOrDescription: any): PropertyDocumentMeta => {
  if (typeof rowOrDescription === 'string' || rowOrDescription == null) {
    return parseDescription(rowOrDescription);
  }

  const row = rowOrDescription as Record<string, unknown>;
  const explicitStatus = row.verificationstatus;

  if (explicitStatus) {
    return {
      verificationStatus: String(explicitStatus) as DocumentVerificationStatus,
      isArchived: Boolean(row.isarchived),
      uploadedByStaffId: row.uploadedbystaffid == null ? null : Number(row.uploadedbystaffid),
      uploadedByClientId: row.uploadedbyclientid == null ? null : Number(row.uploadedbyclientid),
      verifiedByStaffId: row.verifiedbystaffid == null ? null : Number(row.verifiedbystaffid),
      verifiedAt: row.verifiedat == null ? null : String(row.verifiedat),
      previousDocumentId: row.previousdocumentid == null ? null : Number(row.previousdocumentid),
      notes: row.documentnotes == null ? null : String(row.documentnotes),
    };
  }

  return parseDescription(row.documentdescription as string | null | undefined);
};

const getRequiredDocumentNames = (propertyTypeName: string): string[] => {
  const type = normalize(propertyTypeName);

  if (type.includes('agricultural')) {
    return ['Land Title', 'Tax Declaration', 'Zoning Clearance'];
  }

  return ['Land Title', 'Tax Declaration'];
};

export const validateRequiredDocuments = async (propertyId: number): Promise<{
  valid: boolean;
  required: string[];
  approved: string[];
  missing: string[];
  pendingOrRejected: string[];
}> => {
  const { data: property, error: propertyError } = await supabaseAdmin
    .from('property')
    .select('propertyid, propertytypeid, propertytype!fk_property_propertytype(propertytypename)')
    .eq('propertyid', propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error('Property not found');
  }

  const propertyTypeName =
    (Array.isArray(property.propertytype)
      ? property.propertytype[0]?.propertytypename
      : property.propertytype?.propertytypename) ?? 'Unknown';

  const required = getRequiredDocumentNames(String(propertyTypeName));

  const { data: typeRows, error: typeError } = await supabaseAdmin
    .from('documenttype')
    .select('documenttypeid, documenttypename');

  if (typeError) {
    throw new Error(`Failed to fetch document types: ${typeError.message}`);
  }

  const typeByName = new Map<string, number>();
  (typeRows ?? []).forEach((row: any) => {
    typeByName.set(normalize(String(row.documenttypename ?? '')), Number(row.documenttypeid));
  });

  const requiredTypeIds = required
    .map((name) => ({ name, id: typeByName.get(normalize(name)) }))
    .filter((item): item is { name: string; id: number } => Number.isInteger(item.id));

  const requiredIds = requiredTypeIds.map((item) => item.id);

  const { data: documents, error: documentsError } = await supabaseAdmin
    .from('propertydocument')
    .select(
      'propertydocumentid, documenttypeid, verificationstatus, isarchived, uploadedbystaffid, uploadedbyclientid, verifiedbystaffid, verifiedat, previousdocumentid, documentnotes, documentdescription, createdat'
    )
    .eq('propertyid', propertyId)
    .in('documenttypeid', requiredIds.length > 0 ? requiredIds : [-1]);

  if (documentsError) {
    throw new Error(`Failed to fetch property documents: ${documentsError.message}`);
  }

  const latestByType = new Map<number, any>();
  (documents ?? []).forEach((row: any) => {
    const existing = latestByType.get(Number(row.documenttypeid));
    if (!existing || new Date(row.createdat).getTime() > new Date(existing.createdat).getTime()) {
      latestByType.set(Number(row.documenttypeid), row);
    }
  });

  const approved: string[] = [];
  const missing: string[] = [];
  const pendingOrRejected: string[] = [];

  requiredTypeIds.forEach((requiredType) => {
    const row = latestByType.get(requiredType.id);
    if (!row) {
      missing.push(requiredType.name);
      return;
    }

    const meta = getPropertyDocumentMeta(row);
    if (meta.isArchived) {
      missing.push(requiredType.name);
      return;
    }

    if (meta.verificationStatus === 'Approved') {
      approved.push(requiredType.name);
      return;
    }

    pendingOrRejected.push(requiredType.name);
  });

  return {
    valid: missing.length === 0 && pendingOrRejected.length === 0,
    required,
    approved,
    missing,
    pendingOrRejected,
  };
};

export const validateTransactionDocuments = async (transactionId: number): Promise<{
  valid: boolean;
  required: string[];
  approved: string[];
  missingOrUnapproved: string[];
}> => {
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transaction')
    .select('transactionid')
    .eq('transactionid', transactionId)
    .single();

  if (transactionError || !transaction) {
    throw new Error('Transaction not found');
  }

  const LARGE_PAYMENT_THRESHOLD = 100000;
  const required = ['Contract to Sell', 'Deed of Absolute Sale', 'Official Receipt'];

  const { data: schedules, error: schedulesError } = await supabaseAdmin
    .from('paymentschedule')
    .select('paymentscheduleid')
    .eq('transactionid', transactionId);

  if (schedulesError) {
    throw new Error(`Failed to fetch payment schedules: ${schedulesError.message}`);
  }

  const scheduleIds = (schedules ?? []).map((row: any) => Number(row.paymentscheduleid));
  let payments: any[] = [];

  if (scheduleIds.length > 0) {
    const paymentsRes = await supabaseAdmin
      .from('payment')
      .select('amountpaid')
      .in('paymentscheduleid', scheduleIds);

    if (paymentsRes.error) {
      throw new Error(`Failed to fetch payments: ${paymentsRes.error.message}`);
    }

    payments = paymentsRes.data ?? [];
  }

  const hasLargePayment = (payments ?? []).some((row: any) => Number(row.amountpaid) >= LARGE_PAYMENT_THRESHOLD);
  if (hasLargePayment) {
    required.push('Payment Proof');
  }

  const { data: typeRows, error: typeError } = await supabaseAdmin
    .from('documenttype')
    .select('documenttypeid, documenttypename');

  if (typeError) {
    throw new Error(`Failed to fetch document types: ${typeError.message}`);
  }

  const typeByName = new Map<string, number>();
  (typeRows ?? []).forEach((row: any) => {
    typeByName.set(normalize(String(row.documenttypename ?? '')), Number(row.documenttypeid));
  });

  const requiredTypeIds = required
    .map((name) => ({ name, id: typeByName.get(normalize(name)) }))
    .filter((item): item is { name: string; id: number } => Number.isInteger(item.id));

  const { data: rows, error: rowsError } = await supabaseAdmin
    .from('transactiondocument')
    .select('transactiondocumentid, documenttypeid, verificationstatus, isarchived')
    .eq('transactionid', transactionId);

  if (rowsError) {
    if (rowsError.message?.toLowerCase().includes('does not exist')) {
      throw new Error('transactiondocument table is missing. Run the document compliance migration first.');
    }
    throw new Error(`Failed to fetch transaction documents: ${rowsError.message}`);
  }

  const approved: string[] = [];
  const missingOrUnapproved: string[] = [];

  requiredTypeIds.forEach((requiredType) => {
    const candidate = (rows ?? []).find(
      (row: any) => Number(row.documenttypeid) === requiredType.id && !Boolean(row.isarchived)
    );

    if (!candidate) {
      missingOrUnapproved.push(requiredType.name);
      return;
    }

    const verificationStatus = String(candidate.verificationstatus ?? 'PendingVerification');
    if (verificationStatus === 'Approved') {
      approved.push(requiredType.name);
      return;
    }

    missingOrUnapproved.push(requiredType.name);
  });

  return {
    valid: missingOrUnapproved.length === 0,
    required,
    approved,
    missingOrUnapproved,
  };
};
