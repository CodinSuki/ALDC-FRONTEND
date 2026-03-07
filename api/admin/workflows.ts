import { requireAdminSession } from '../../lib/admin/utils/auth.js';
import { supabaseAdmin } from '../../lib/admin/utils/supabaseAdmin.js';
import { validateAgentAssignment } from '../../lib/admin/utils/permissions.js';
import { logActivity } from '../../lib/admin/utils/activityLog.js';
import { validateRequiredDocuments } from '../../lib/admin/utils/documentCompliance.js';

/**
 * Consolidated workflows endpoint - handles inquiries, seller submissions, and sales
 * 
 * Route patterns:
 * - GET /api/admin/workflows - Fetch inbox items from all sources
 * - PATCH /api/admin/workflows - Update intake item (consultation, inquiry, or seller submission)
 */

type IntakeSource = 'Consultation' | 'Buyer Inquiry' | 'Seller Submission';
type IntakeStatus =
  | 'New'
  | 'Assigned'
  | 'Scheduled'
  | 'Consulted'
  | 'Not Consulted'
  | 'Contacted'
  | 'Qualified'
  | 'Converted'
  | 'Closed'
  | 'Received'
  | 'Client Linked'
  | 'Property Drafted'
  | 'Pending Review'
  | 'Published';

interface ConsultationRow {
  consultationrequestid: number;
  clientid?: number | null;
  fullname: string | null;
  emailaddress: string | null;
  contactnumber: string | null;
  preferredpropertytypeid: number | null;
  preferredlocation: string | null;
  budgetrange: string | null;
  additionalrequirements: string | null;
  consultationstatus: string | null;
  assignedstaffid?: number | null;
  scheduledat?: string | null;
  createdat: string | null;
}

interface PropertyInquiryRow {
  propertyinquiryid: number;
  propertyid: number | null;
  clientid: number | null;
  inquirystatus: string | null;
  inquirynotes: string | null;
  createdat: string | null;
}

interface PropertyRow {
  propertyid: number;
  propertyname: string | null;
  propertytypeid: number | null;
  propertylistingstatusid: number | null;
  sellerclientid: number | null;
  createdat: string | null;
}

interface PropertyTypeRow {
  propertytypeid: number;
  propertytypename: string | null;
}

interface ClientRow {
  clientid: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  emailaddress: string | null;
  contactnumber: string | null;
}

interface PropertyListingStatusRow {
  propertylistingstatusid: number;
  propertylistingstatusname: string | null;
  propertylistingstatuscode: string | null;
}

interface StaffRow {
  staffid: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
}

interface StaffOption {
  staffId: number;
  name: string;
}

interface IntakeItem {
  id: string;
  source: IntakeSource;
  sourceId: string;
  clientName: string;
  contact: string;
  email: string;
  reference: string;
  details: string;
  status: IntakeStatus;
  createdAt: string;
  notes: string;
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  scheduledAt?: string | null;
}

type UpdateBody = {
  source?: IntakeSource;
  sourceId?: string;
  status?: IntakeStatus;
  assignedStaffId?: number | null;
  scheduledAt?: string | null;
  notes?: string | null;
};

const normalizeStatus = (value: unknown, fallback: IntakeStatus): IntakeStatus => {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('contact')) return 'Contacted';
  if (text.includes('qualif')) return 'Qualified';
  if (text.includes('convert')) return 'Converted';
  if (text.includes('close')) return 'Closed';
  if (text.includes('assign')) return 'Assigned';
  if (text.includes('sched')) return 'Scheduled';
  if (text.includes('consulted')) return 'Consulted';
  if (text.includes('not consulted')) return 'Not Consulted';
  if (text.includes('linked')) return 'Client Linked';
  if (text.includes('draft')) return 'Property Drafted';
  if (text.includes('pending')) return 'Pending Review';
  if (text.includes('new')) return 'New';
  if (text.includes('receive')) return 'Received';
  if (text.includes('publish') || text.includes('available')) return 'Published';
  return fallback;
};

const formatName = (first?: string | null, middle?: string | null, last?: string | null): string =>
  [first, middle, last].filter(Boolean).join(' ').trim();

const pick = (...values: unknown[]): string => {
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
  return found == null ? '' : String(found);
};

const fetchInboxItems = async (): Promise<{ items: IntakeItem[]; staffOptions: StaffOption[] }> => {
  const [consultationRes, inquiryRes, propertyRes, propertyTypeRes, clientRes, listingStatusRes, staffRes] = await Promise.all([
    supabaseAdmin.from('consultationrequest').select('*').order('consultationrequestid', { ascending: false }),
    supabaseAdmin
      .from('propertyinquiry')
      .select('propertyinquiryid, propertyid, clientid, inquirystatus, inquirynotes, createdat')
      .order('propertyinquiryid', { ascending: false }),
    supabaseAdmin
      .from('property')
      .select('propertyid, propertyname, propertytypeid, propertylistingstatusid, sellerclientid, createdat')
      .order('propertyid', { ascending: false }),
    supabaseAdmin.from('propertytype').select('propertytypeid, propertytypename'),
    supabaseAdmin.from('client').select('clientid, firstname, middlename, lastname, emailaddress, contactnumber'),
    supabaseAdmin
      .from('propertylistingstatus')
      .select('propertylistingstatusid, propertylistingstatusname, propertylistingstatuscode'),
    supabaseAdmin
      .from('staff')
      .select('staffid, firstname, middlename, lastname')
      .order('staffid', { ascending: true }),
  ]);

  const errors: string[] = [];
  if (consultationRes.error) errors.push(`Consultation: ${consultationRes.error.message}`);
  if (inquiryRes.error) errors.push(`Buyer Inquiry: ${inquiryRes.error.message}`);
  if (propertyRes.error) errors.push(`Seller: ${propertyRes.error.message}`);
  if (staffRes.error) errors.push(`Staff: ${staffRes.error.message}`);
  
  if (errors.length > 0) {
    throw new Error(errors.join(' | '));
  }

  const staffOptions: StaffOption[] = ((staffRes.data ?? []) as StaffRow[]).map((row) => ({
    staffId: Number(row.staffid),
    name: formatName(row.firstname, row.middlename, row.lastname) || `Staff #${row.staffid}`,
  }));

  const staffById = new Map<number, StaffOption>(staffOptions.map((staff) => [staff.staffId, staff]));
  const propertyTypeById = new Map<number, string>(
    ((propertyTypeRes.data ?? []) as PropertyTypeRow[]).map((row) => [row.propertytypeid, pick(row.propertytypename)])
  );
  const clientById = new Map<number, ClientRow>(
    ((clientRes.data ?? []) as ClientRow[]).map((row) => [row.clientid, row])
  );
  const propertyById = new Map<number, PropertyRow>(
    ((propertyRes.data ?? []) as PropertyRow[]).map((row) => [row.propertyid, row])
  );
  const listingStatusById = new Map<number, PropertyListingStatusRow>(
    ((listingStatusRes.data ?? []) as PropertyListingStatusRow[]).map((row) => [row.propertylistingstatusid, row])
  );

  // Consultation items
  const consultationItems: IntakeItem[] = ((consultationRes.data ?? []) as ConsultationRow[]).map((row) => ({
    id: `consultation-${row.consultationrequestid}`,
    source: 'Consultation',
    sourceId: String(row.consultationrequestid),
    clientName: pick(row.fullname) || 'Unknown Client',
    contact: pick(row.contactnumber) || 'N/A',
    email: pick(row.emailaddress) || 'N/A',
    reference: propertyTypeById.get(Number(row.preferredpropertytypeid)) || `Property Type #${row.preferredpropertytypeid ?? 'N/A'}`,
    details: [row.preferredlocation, row.budgetrange].filter(Boolean).join(' • ') || 'No preferences provided',
    status: normalizeStatus(row.consultationstatus, 'New'),
    createdAt: row.createdat || new Date().toISOString(),
    notes: pick(row.additionalrequirements) || 'No additional requirements',
    assignedStaffId: row.assignedstaffid ? Number(row.assignedstaffid) : null,
    assignedStaffName: row.assignedstaffid ? staffById.get(Number(row.assignedstaffid))?.name : null,
    scheduledAt: null,
  }));

  // Buyer inquiry items
  const buyerItems: IntakeItem[] = ((inquiryRes.data ?? []) as PropertyInquiryRow[]).map((row) => {
    const client = row.clientid ? clientById.get(Number(row.clientid)) : undefined;
    const property = row.propertyid ? propertyById.get(Number(row.propertyid)) : undefined;

    return {
      id: `buyer-${row.propertyinquiryid}`,
      source: 'Buyer Inquiry',
      sourceId: String(row.propertyinquiryid),
      clientName: formatName(client?.firstname, client?.middlename, client?.lastname) || `Client #${row.clientid ?? 'N/A'}`,
      contact: pick(client?.contactnumber) || 'N/A',
      email: pick(client?.emailaddress) || 'N/A',
      reference:
        pick(property?.propertyname) ||
        (property?.propertytypeid ? propertyTypeById.get(Number(property.propertytypeid)) : '') ||
        `Property #${row.propertyid ?? 'N/A'}`,
      details: 'Buyer inquiry submitted',
      status: normalizeStatus(row.inquirystatus, 'New'),
      createdAt: row.createdat || new Date().toISOString(),
      notes: pick(row.inquirynotes) || 'No notes',
    };
  });

  // Seller submission items
  const toSellerStatus = (propertylistingstatusid: unknown): IntakeStatus => {
    const status = listingStatusById.get(Number(propertylistingstatusid));
    const name = status?.propertylistingstatusname?.toLowerCase() ?? '';
    const code = status?.propertylistingstatuscode?.toLowerCase() ?? '';

    if (name.includes('draft')) return 'Property Drafted';
    if (name.includes('pending') || code === 'pnd') return 'Pending Review';
    if (name.includes('available') || name.includes('publish') || code === 'avl' || code === 'acc') return 'Published';
    return 'Received';
  };

  const sellerItems: IntakeItem[] = ((propertyRes.data ?? []) as PropertyRow[])
    .filter((row) => row.sellerclientid != null)
    .map((row) => {
      const seller = row.sellerclientid ? clientById.get(Number(row.sellerclientid)) : undefined;

      return {
        id: `seller-${row.propertyid}`,
        source: 'Seller Submission',
        sourceId: String(row.propertyid),
        clientName: formatName(seller?.firstname, seller?.middlename, seller?.lastname) || `Seller #${row.sellerclientid ?? 'N/A'}`,
        contact: pick(seller?.contactnumber) || 'N/A',
        email: pick(seller?.emailaddress) || 'N/A',
        reference: pick(row.propertyname) || `Property #${row.propertyid}`,
        details: 'Property submitted for internal review',
        status: toSellerStatus(row.propertylistingstatusid),
        createdAt: row.createdat || new Date().toISOString(),
        notes: 'Seller onboarding item.',
      };
    });

  const items = [...consultationItems, ...buyerItems, ...sellerItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  return { items, staffOptions };
};

const mapSellerStatusToCode = (status: IntakeStatus): string => {
  if (status === 'Published') return 'AVL';
  if (status === 'Pending Review') return 'PND';
  return 'REV';
};

const resolveListingStatusIdByCode = async (code: string): Promise<number> => {
  const { data, error } = await supabaseAdmin
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', code)
    .single();

  if (error || !data) {
    throw error ?? new Error(`Status code not found: ${code}`);
  }

  return Number(data.propertylistingstatusid);
};

const updateIntakeItem = async (payload: UpdateBody, session: any): Promise<void> => {
  const source = payload.source;
  const sourceId = Number(payload.sourceId);

  if (!source || !Number.isInteger(sourceId) || sourceId <= 0) {
    throw new Error('Invalid source or sourceId');
  }

  if (payload.assignedStaffId) {
    const validation = await validateAgentAssignment(payload.assignedStaffId);
    if (!validation.valid) {
      throw new Error(`Cannot assign staff: ${validation.reason}`);
    }
  }

  if (source === 'Consultation') {
    const consultationPayload: Record<string, unknown> = {
      consultationstatus: payload.status ?? 'New',
      assignedstaffid: payload.assignedStaffId ?? null,
    };

    const { error } = await supabaseAdmin
      .from('consultationrequest')
      .update(consultationPayload)
      .eq('consultationrequestid', sourceId);

    if (error) throw error;

    if (payload.assignedStaffId) {
      await logActivity({
        staffid: session?.staffId ?? 0,
        activitytype: 'agent_assigned',
        entitytype: 'consultation',
        entityid: sourceId,
        description: `Assigned agent #${payload.assignedStaffId} to consultation`,
      }).catch(() => {});
    }
    return;
  }

  if (source === 'Buyer Inquiry') {
    const inquiryPayload: Record<string, unknown> = {
      inquirystatus: payload.status ?? 'New',
      inquirynotes: payload.notes ?? null,
    };

    const { error } = await supabaseAdmin
      .from('propertyinquiry')
      .update(inquiryPayload)
      .eq('propertyinquiryid', sourceId);

    if (error) throw error;

    if (payload.status) {
      await logActivity({
        staffid: session?.staffId ?? 0,
        activitytype: 'inquiry_assigned',
        entitytype: 'propertyinquiry',
        entityid: sourceId,
        description: `Updated inquiry status to ${payload.status}`,
      }).catch(() => {});
    }
    return;
  }

  // Seller Submission
  if (payload.status === 'Published') {
    const requiredValidation = await validateRequiredDocuments(sourceId);
    if (!requiredValidation.valid) {
      throw new Error(
        `Cannot publish listing. Missing: ${requiredValidation.missing.join(', ') || 'none'}; Pending/Rejected: ${requiredValidation.pendingOrRejected.join(', ') || 'none'}`
      );
    }
  }

  const listingCode = mapSellerStatusToCode(payload.status ?? 'Received');
  const listingStatusId = await resolveListingStatusIdByCode(listingCode);

  const { error } = await supabaseAdmin
    .from('property')
    .update({ propertylistingstatusid: listingStatusId })
    .eq('propertyid', sourceId);

  if (error) throw error;

  await logActivity({
    staffid: session?.staffId ?? 0,
    activitytype: 'property_approved',
    entitytype: 'property',
    entityid: sourceId,
    description: `Updated property status to ${payload.status}`,
  }).catch(() => {});
};

export default async function handler(req: any, res: any) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  try {
    if (req.method === 'GET') {
      const result = await fetchInboxItems();
      res.status(200).json(result);
      return;
    }

    if (req.method === 'PATCH') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as UpdateBody;
      await updateIntakeItem(body, session);
      const result = await fetchInboxItems();
      const updatedItem = result.items.find(
        (item) => item.source === body.source && item.sourceId === String(body.sourceId)
      );

      res.status(200).json({ success: true, item: updatedItem ?? null, staffOptions: result.staffOptions });
      return;
    }

    if (req.method === 'POST') {
      const action = req.query.action as string | undefined;
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

      if (action === 'searchClients') {
        const searchTerm = String(body.searchTerm ?? '').toLowerCase().trim();
        if (!searchTerm) {
          return res.status(200).json({ clients: [] });
        }

        const { data, error } = await supabaseAdmin
          .from('client')
          .select('clientid, firstname, middlename, lastname, emailaddress, contactnumber')
          .or(
            `firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%,emailaddress.ilike.%${searchTerm}%,contactnumber.ilike.%${searchTerm}%`
          )
          .limit(20);

        if (error) throw error;

        const clients = (data ?? []).map((row: any) => ({
          clientId: Number(row.clientid),
          fullName: formatName(row.firstname, row.middlename, row.lastname),
          email: asText(row.emailaddress, 'N/A'),
          contact: asText(row.contactnumber, 'N/A'),
        }));

        return res.status(200).json({ clients });
      }

      if (action === 'linkClient') {
        const { source, sourceId, clientId } = body;
        if (!source || !sourceId || !clientId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (source === 'Consultation') {
          const { error } = await supabaseAdmin
            .from('consultationrequest')
            .update({ clientid: Number(clientId) })
            .eq('consultationrequestid', Number(sourceId));

          if (error) throw error;
        } else if (source === 'Buyer Inquiry') {
          const { error } = await supabaseAdmin
            .from('propertyinquiry')
            .update({ clientid: Number(clientId) })
            .eq('propertyinquiryid', Number(sourceId));

          if (error) throw error;
        } else if (source === 'Seller Submission') {
          const { error } = await supabaseAdmin
            .from('property')
            .update({ sellerclientid: Number(clientId) })
            .eq('propertyid', Number(sourceId));

          if (error) throw error;
        }

        await logActivity({
          staffid: session.staffId,
          activitytype: 'inquiry_assigned' as any,
          entitytype: source.toLowerCase().replace(' ', '_'),
          entityid: Number(sourceId),
          description: `Linked client #${clientId} to ${source} #${sourceId}`,
        }).catch(() => {});

        return res.status(200).json({ success: true });
      }

      if (action === 'createClient') {
        const { source, sourceId, fullname, email, contact } = body;
        if (!source || !sourceId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for existing client with same email or contact
        if (email || contact) {
          const { data: existing } = await supabaseAdmin
            .from('client')
            .select('clientid')
            .or(
              email && contact
                ? `emailaddress.eq.${email},contactnumber.eq.${contact}`
                : email
                ? `emailaddress.eq.${email}`
                : `contactnumber.eq.${contact}`
            )
            .limit(1);

          if (existing && existing.length > 0) {
            return res.status(409).json({
              error: 'Client with this email or contact already exists',
              existingClientId: existing[0].clientid,
            });
          }
        }

        // Parse name into parts
        const nameParts = String(fullname ?? '').trim().split(' ');
        const firstname = nameParts[0] || '';
        const lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middlename = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

        // Create new client
        const { data: newClient, error: createError } = await supabaseAdmin
          .from('client')
          .insert({
            firstname,
            middlename,
            lastname,
            emailaddress: email || null,
            contactnumber: contact || null,
          })
          .select('clientid')
          .single();

        if (createError) throw createError;

        const newClientId = Number(newClient.clientid);

        // Link to intake item
        if (source === 'Consultation') {
          await supabaseAdmin
            .from('consultationrequest')
            .update({ clientid: newClientId })
            .eq('consultationrequestid', Number(sourceId));
        } else if (source === 'Buyer Inquiry') {
          await supabaseAdmin
            .from('propertyinquiry')
            .update({ clientid: newClientId })
            .eq('propertyinquiryid', Number(sourceId));
        } else if (source === 'Seller Submission') {
          await supabaseAdmin
            .from('property')
            .update({ sellerclientid: newClientId })
            .eq('propertyid', Number(sourceId));
        }

        await logActivity({
          staffid: session.staffId,
          activitytype: 'inquiry_created' as any,
          entitytype: 'client',
          entityid: newClientId,
          description: `Created client from ${source} #${sourceId}`,
        }).catch(() => {});

        return res.status(200).json({ success: true, clientId: newClientId });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'Failed to process workflows request' });
  }
}
