import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from './_utils/auth.js';
import { supabaseAdmin } from './_utils/supabaseAdmin.js';

type ClientRow = {
  clientid: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  emailaddress: string;
  contactnumber: string;
  additionalemailaddress: string | null;
  additionalcontactnumber: string | null;
  created_at: string;
};

type SellerProfileRow = {
  clientid: number;
};

type ConsultationRow = {
  consultationrequestid: number;
  clientid: number | null;
  createdat: string | null;
};

type PropertyInquiryRow = {
  propertyinquiryid: number;
  clientid: number | null;
  createdat: string | null;
};

type PropertyRow = {
  propertyid: number;
  sellerclientid: number | null;
  createdat: string | null;
};

const pick = (...values: unknown[]): string => {
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
  return found == null ? '' : String(found);
};

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdminSession(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [clientsRes, sellerRes, consultationRes, inquiryRes, propertyRes] = await Promise.all([
      supabaseAdmin
        .from('client')
        .select(
          'clientid, firstname, middlename, lastname, emailaddress, contactnumber, additionalemailaddress, additionalcontactnumber, created_at'
        )
        .order('clientid', { ascending: false }),
      supabaseAdmin.from('sellerprofile').select('clientid'),
      supabaseAdmin.from('consultationrequest').select('consultationrequestid, clientid, createdat'),
      supabaseAdmin.from('propertyinquiry').select('propertyinquiryid, clientid, createdat'),
      supabaseAdmin.from('property').select('propertyid, sellerclientid, createdat'),
    ]);

    const errors: string[] = [];
    if (clientsRes.error) errors.push(`Clients: ${clientsRes.error.message}`);
    if (sellerRes.error) errors.push(`Seller Profile: ${sellerRes.error.message}`);
    if (consultationRes.error) errors.push(`Consultation: ${consultationRes.error.message}`);
    if (inquiryRes.error) errors.push(`Property Inquiry: ${inquiryRes.error.message}`);
    if (propertyRes.error) errors.push(`Property: ${propertyRes.error.message}`);
    if (errors.length > 0) {
      throw new Error(errors.join(' | '));
    }

    const sellerSet = new Set<number>(
      ((sellerRes.data ?? []) as SellerProfileRow[])
        .map((row) => Number(row.clientid))
        .filter((value) => Number.isFinite(value))
    );

    const consultationByClient = new Map<number, ConsultationRow[]>();
    ((consultationRes.data ?? []) as ConsultationRow[]).forEach((row) => {
      if (row.clientid == null) return;
      const clientId = Number(row.clientid);
      const list = consultationByClient.get(clientId) ?? [];
      list.push(row);
      consultationByClient.set(clientId, list);
    });

    const inquiryByClient = new Map<number, PropertyInquiryRow[]>();
    ((inquiryRes.data ?? []) as PropertyInquiryRow[]).forEach((row) => {
      if (row.clientid == null) return;
      const clientId = Number(row.clientid);
      const list = inquiryByClient.get(clientId) ?? [];
      list.push(row);
      inquiryByClient.set(clientId, list);
    });

    const propertyBySeller = new Map<number, PropertyRow[]>();
    ((propertyRes.data ?? []) as PropertyRow[]).forEach((row) => {
      if (row.sellerclientid == null) return;
      const clientId = Number(row.sellerclientid);
      const list = propertyBySeller.get(clientId) ?? [];
      list.push(row);
      propertyBySeller.set(clientId, list);
    });

    const items = ((clientsRes.data ?? []) as ClientRow[]).map((row) => {
      const clientId = Number(row.clientid);
      const consultations = consultationByClient.get(clientId) ?? [];
      const inquiries = inquiryByClient.get(clientId) ?? [];
      const properties = propertyBySeller.get(clientId) ?? [];

      const activityTimes = [
        ...consultations.map((entry) => toTimestamp(entry.createdat)),
        ...inquiries.map((entry) => toTimestamp(entry.createdat)),
        ...properties.map((entry) => toTimestamp(entry.createdat)),
      ].filter((time) => time > 0);

      const lastActivity = activityTimes.length > 0 ? new Date(Math.max(...activityTimes)).toISOString() : null;

      return {
        id: String(clientId),
        clientId,
        fullName: [row.firstname, row.middlename, row.lastname].filter(Boolean).join(' ').trim() || `Client #${clientId}`,
        contact: pick(row.contactnumber) || 'N/A',
        additionalContact: pick(row.additionalcontactnumber) || 'N/A',
        email: pick(row.emailaddress) || 'N/A',
        additionalEmail: pick(row.additionalemailaddress) || 'N/A',
        isSeller: sellerSet.has(clientId),
        consultationCount: consultations.length,
        inquiryCount: inquiries.length,
        propertyCount: properties.length,
        totalActivity: consultations.length + inquiries.length + properties.length,
        createdAt: row.created_at,
        lastActivityAt: lastActivity,
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load clients',
    });
  }
}
