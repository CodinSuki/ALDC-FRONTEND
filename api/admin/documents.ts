import { requireAdminSession } from '../../lib/admin/utils/auth.js';
import { logActivity } from '../../lib/admin/utils/activityLog.js';
import {
  getPropertyDocumentMeta,
  validateRequiredDocuments,
  validateTransactionDocuments,
  type DocumentVerificationStatus,
} from '../../lib/admin/utils/documentCompliance.js';
import { validateStaffPermission, validateStaffRole } from '../../lib/admin/utils/permissions.js';
import { supabaseAdmin } from '../../lib/admin/utils/supabaseAdmin.js';

type BodyPayload = Record<string, unknown>;

const parseBody = (req: any): BodyPayload => {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
};

const toNumber = (value: unknown): number => Number(value ?? 0);

const getAction = (req: any): string => String(req.query?.action ?? '').trim().toLowerCase();

const VALID_VERIFY_STATUSES: DocumentVerificationStatus[] = [
  'PendingVerification',
  'Approved',
  'Rejected',
  'NeedsRevision',
  'Archived',
];

export default async function handler(req: any, res: any) {
  try {
    const session = requireAdminSession(req, res);
    if (!session) return;

    const action = getAction(req);

    if (req.method === 'GET' && action === 'document-types') {
      const { data, error } = await supabaseAdmin
        .from('documenttype')
        .select('documenttypeid, documenttypename')
        .order('documenttypename', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch document types: ${error.message}`);
      }

      return res.status(200).json({
        items: (data ?? []).map((row: any) => ({
          documentTypeId: row.documenttypeid,
          documentTypeName: row.documenttypename,
          description: null,
        })),
      });
    }

    if (req.method === 'GET' && action === 'properties-for-upload') {
      const { data, error } = await supabaseAdmin
        .from('property')
        .select(
          `
          propertyid,
          propertyname,
          sellerclientid,
          client!fk_property_seller(firstname, middlename, lastname, emailaddress)
        `
        )
        .eq('is_archived', false)
        .order('propertyid', { ascending: false })
        .limit(200);

      if (error) {
        throw new Error(`Failed to fetch properties: ${error.message}`);
      }

      return res.status(200).json({
        items: (data ?? []).map((row: any) => {
          const client = Array.isArray(row.client) ? row.client[0] : row.client;
          const sellerName = client
            ? [client.firstname, client.middlename, client.lastname].filter(Boolean).join(' ')
            : 'Unknown';

          return {
            propertyId: row.propertyid,
            propertyName: row.propertyname,
            sellerClientId: row.sellerclientid,
            sellerName,
            sellerEmail: client?.emailaddress ?? null,
          };
        }),
      });
    }

    if (req.method === 'GET' && action === 'pending-property') {
      const { data, error } = await supabaseAdmin
        .from('propertydocument')
        .select(
          `
          propertydocumentid,
          propertyid,
          documenttypeid,
          documentname,
          documentfilename,
          documentmimetype,
          documentsize,
          verificationstatus,
          isarchived,
          uploadedbystaffid,
          uploadedbyclientid,
          verifiedbystaffid,
          verifiedat,
          previousdocumentid,
          documentnotes,
          documentdescription,
          createdat,
          property!fk_propertydocument_property(propertyname),
          documenttype!fk_propertydocument_type(documenttypename)
        `
        )
        .order('createdat', { ascending: false })
        .limit(200);

      if (error) {
        throw new Error(`Failed to fetch property documents: ${error.message}`);
      }

      // Get unique client and staff IDs
      const clientIds = new Set<number>();
      const staffIds = new Set<number>();
      
      (data ?? []).forEach((row: any) => {
        if (row.uploadedbyclientid) clientIds.add(row.uploadedbyclientid);
        if (row.uploadedbystaffid) staffIds.add(row.uploadedbystaffid);
      });

      // Fetch client and staff data
      const clientsMap = new Map<number, any>();
      const staffMap = new Map<number, any>();

      if (clientIds.size > 0) {
        const { data: clientsData } = await supabaseAdmin
          .from('client')
          .select('clientid, firstname, middlename, lastname, emailaddress')
          .in('clientid', Array.from(clientIds));
        
        (clientsData ?? []).forEach((client: any) => {
          clientsMap.set(client.clientid, client);
        });
      }

      if (staffIds.size > 0) {
        const { data: staffData } = await supabaseAdmin
          .from('staff')
          .select('staffid, firstname, lastname')
          .in('staffid', Array.from(staffIds));
        
        (staffData ?? []).forEach((staff: any) => {
          staffMap.set(staff.staffid, staff);
        });
      }

      const items = (data ?? [])
        .map((row: any) => {
          const meta = getPropertyDocumentMeta(row);
          
          // Get uploader info
          let uploaderName = 'Unknown';
          let uploaderType = null;
          let uploaderEmail = null;
          
          if (row.uploadedbyclientid) {
            const client = clientsMap.get(row.uploadedbyclientid);
            if (client) {
              uploaderName = [client.firstname, client.middlename, client.lastname]
                .filter(Boolean)
                .join(' ') || 'Client';
              uploaderType = 'client';
              uploaderEmail = client.emailaddress;
            }
          } else if (row.uploadedbystaffid) {
            const staff = staffMap.get(row.uploadedbystaffid);
            if (staff) {
              uploaderName = [staff.firstname, staff.lastname]
                .filter(Boolean)
                .join(' ') || 'Staff';
              uploaderType = 'staff';
            }
          }
          
          return {
            propertyDocumentId: row.propertydocumentid,
            propertyId: row.propertyid,
            propertyName: Array.isArray(row.property) ? row.property[0]?.propertyname : row.property?.propertyname,
            documentTypeId: row.documenttypeid,
            documentTypeName: Array.isArray(row.documenttype)
              ? row.documenttype[0]?.documenttypename
              : row.documenttype?.documenttypename,
            documentName: row.documentname,
            fileName: row.documentfilename,
            mimeType: row.documentmimetype,
            fileSize: row.documentsize,
            verificationStatus: meta.verificationStatus,
            isArchived: meta.isArchived,
            uploadedByStaffId: meta.uploadedByStaffId ?? null,
            uploadedByClientId: meta.uploadedByClientId ?? null,
            uploaderName,
            uploaderType,
            uploaderEmail,
            verifiedByStaffId: meta.verifiedByStaffId ?? null,
            verifiedAt: meta.verifiedAt ?? null,
            notes: meta.notes ?? null,
            createdAt: row.createdat,
          };
        })
        .filter((item: any) => !item.isArchived && item.verificationStatus !== 'Archived');

      return res.status(200).json({ items });
    }

    if (req.method === 'GET' && action === 'download-document') {
      const propertyDocumentId = toNumber(req.query?.propertyDocumentId);
      
      if (!propertyDocumentId) {
        return res.status(400).json({ error: 'propertyDocumentId is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('propertydocument')
        .select('documentdata, documentfilename, documentmimetype, documentname')
        .eq('propertydocumentid', propertyDocumentId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (!data.documentdata) {
        return res.status(404).json({ error: 'Document file data not found' });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', data.documentmimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${data.documentfilename || data.documentname || 'document'}"`);
      
      // Send the binary data
      return res.status(200).send(Buffer.from(data.documentdata));
    }

    if (req.method === 'GET' && action === 'validate-property') {
      const propertyId = toNumber(req.query?.propertyId);
      if (!propertyId) {
        return res.status(400).json({ error: 'propertyId is required' });
      }

      const result = await validateRequiredDocuments(propertyId);
      return res.status(200).json(result);
    }

    if (req.method === 'GET' && action === 'validate-transaction') {
      const transactionId = toNumber(req.query?.transactionId);
      if (!transactionId) {
        return res.status(400).json({ error: 'transactionId is required' });
      }

      const result = await validateTransactionDocuments(transactionId);
      return res.status(200).json(result);
    }

    if (req.method === 'POST' && action === 'upload-property') {
      const body = parseBody(req);
      const propertyId = toNumber(body.propertyId);
      const documentTypeId = toNumber(body.documentTypeId);
      const documentName = String(body.documentName ?? '').trim();
      const fileName = String(body.fileName ?? '').trim();
      const mimeType = String(body.mimeType ?? 'application/octet-stream').trim();
      const fileBase64 = String(body.fileBase64 ?? '').trim();
      const uploadedByClientId = body.uploadedByClientId == null ? null : toNumber(body.uploadedByClientId);

      if (!propertyId || !documentTypeId || !documentName || !fileBase64) {
        return res.status(400).json({
          error: 'propertyId, documentTypeId, documentName, and fileBase64 are required',
        });
      }

      const ownerRes = await supabaseAdmin
        .from('property')
        .select('propertyid, sellerclientid')
        .eq('propertyid', propertyId)
        .single();

      if (ownerRes.error || !ownerRes.data) {
        return res.status(404).json({ error: 'Property not found' });
      }

      if (uploadedByClientId && Number(ownerRes.data.sellerclientid) !== uploadedByClientId) {
        return res.status(403).json({ error: 'Ownership validation failed for this seller upload' });
      }

      const typeCheck = await supabaseAdmin
        .from('documenttype')
        .select('documenttypeid')
        .eq('documenttypeid', documentTypeId)
        .single();

      if (typeCheck.error || !typeCheck.data) {
        return res.status(400).json({ error: 'Invalid document type' });
      }

      const existingRes = await supabaseAdmin
        .from('propertydocument')
        .select(
          'propertydocumentid, verificationstatus, isarchived, uploadedbystaffid, uploadedbyclientid, verifiedbystaffid, verifiedat, previousdocumentid, documentnotes, documentdescription, createdat'
        )
        .eq('propertyid', propertyId)
        .eq('documenttypeid', documentTypeId)
        .order('createdat', { ascending: false });

      if (existingRes.error) {
        throw new Error(`Failed to inspect existing document versions: ${existingRes.error.message}`);
      }

      const activeExisting = (existingRes.data ?? []).find((row: any) => {
        const meta = getPropertyDocumentMeta(row);
        return !meta.isArchived;
      });

      if (activeExisting) {
        const previousMeta = getPropertyDocumentMeta(activeExisting);

        await supabaseAdmin
          .from('propertydocument')
          .update({
            isarchived: true,
            verificationstatus: 'Archived',
            documentnotes: previousMeta.notes ?? 'Automatically archived due to new upload',
            updatedat: new Date().toISOString(),
          })
          .eq('propertydocumentid', activeExisting.propertydocumentid);
      }

      const buffer = Buffer.from(fileBase64, 'base64');

      const insertRes = await supabaseAdmin
        .from('propertydocument')
        .insert({
          propertyid: propertyId,
          documenttypeid: documentTypeId,
          documentname: documentName,
          documentdata: buffer,
          documentfilename: fileName || documentName,
          documentmimetype: mimeType,
          documentsize: buffer.length,
          verificationstatus: 'PendingVerification',
          isarchived: false,
          uploadedbystaffid: session.staffId,
          uploadedbyclientid: uploadedByClientId,
          verifiedbystaffid: null,
          verifiedat: null,
          previousdocumentid: activeExisting?.propertydocumentid ?? null,
          documentnotes: null,
          createdat: new Date().toISOString(),
        })
        .select('propertydocumentid')
        .single();

      if (insertRes.error || !insertRes.data) {
        throw new Error(`Failed to upload property document: ${insertRes.error?.message}`);
      }

      await logActivity({
        staffid: session.staffId,
        activitytype: 'document_verified',
        entitytype: 'property',
        entityid: propertyId,
        description:
          'Document uploaded. Business impact: strengthens trust, legal protection, audit trail, and listing integrity.',
      });

      return res.status(201).json({
        success: true,
        propertyDocumentId: insertRes.data.propertydocumentid,
      });
    }

    if (req.method === 'PATCH' && action === 'verify-property') {
      const permission = await validateStaffPermission(session.staffId, 'verify_documents');
      if (!permission.valid) {
        const roleOverride = await validateStaffRole(session.staffId, ['ADMIN', 'BROKER']);
        if (!roleOverride.valid) {
          return res.status(403).json({ error: permission.reason ?? 'Unauthorized to verify documents' });
        }
      }

      const body = parseBody(req);
      const propertyDocumentId = toNumber(body.propertyDocumentId);
      const verificationStatus = String(body.verificationStatus ?? '').trim() as DocumentVerificationStatus;
      const notes = body.notes == null ? null : String(body.notes);

      if (!propertyDocumentId || !verificationStatus) {
        return res.status(400).json({ error: 'propertyDocumentId and verificationStatus are required' });
      }

      if (!VALID_VERIFY_STATUSES.includes(verificationStatus)) {
        return res.status(400).json({ error: 'Invalid verificationStatus value' });
      }

      const rowRes = await supabaseAdmin
        .from('propertydocument')
        .select(
          'propertydocumentid, propertyid, verificationstatus, isarchived, uploadedbystaffid, uploadedbyclientid, verifiedbystaffid, verifiedat, previousdocumentid, documentnotes, documentdescription'
        )
        .eq('propertydocumentid', propertyDocumentId)
        .single();

      if (rowRes.error || !rowRes.data) {
        return res.status(404).json({ error: 'Property document not found' });
      }

      const updateRes = await supabaseAdmin
        .from('propertydocument')
        .update({
          verificationstatus: verificationStatus,
          isarchived: verificationStatus === 'Archived',
          verifiedbystaffid: session.staffId,
          verifiedat: new Date().toISOString(),
          documentnotes: notes,
          updatedat: new Date().toISOString(),
        })
        .eq('propertydocumentid', propertyDocumentId)
        .select('propertydocumentid, propertyid')
        .single();

      if (updateRes.error || !updateRes.data) {
        throw new Error(`Failed to verify document: ${updateRes.error?.message}`);
      }

      await logActivity({
        staffid: session.staffId,
        activitytype: 'document_verified',
        entitytype: 'property',
        entityid: Number(updateRes.data.propertyid),
        description:
          `Document verification set to ${verificationStatus}. Business impact: legal protection, audit trail, and listing integrity enforcement.`,
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed or action not supported' });
  } catch (error) {
    console.error('Documents API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
