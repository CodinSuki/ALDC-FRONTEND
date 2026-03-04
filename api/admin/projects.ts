import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from '../../lib/admin/utils/auth.js';
import { supabaseAdmin } from '../../lib/admin/utils/supabaseAdmin.js';

interface ProjectDbRow {
  projectid: number;
  projectcode: string;
  projectname: string;
  projectdescription: string | null;
  projectstatus: string;
  property?: Array<{
    propertyid: number;
    propertylocation:
      | {
          propertycity: string;
          propertyprovince: string;
        }
      | {
          propertycity: string;
          propertyprovince: string;
        }[]
      | null;
  }>;
}

const PROJECT_SELECT = `
  projectid,
  projectcode,
  projectname,
  projectdescription,
  projectstatus,
  property!fk_property_project(
    propertyid,
    propertylocation!fk_propertylocation_property(propertycity, propertyprovince)
  )
`;

const mapProjectRow = (row: ProjectDbRow) => {
  const locations = (row.property ?? [])
    .flatMap((property) => {
      if (!property.propertylocation) return [];
      return Array.isArray(property.propertylocation)
        ? property.propertylocation
        : [property.propertylocation];
    })
    .map((location) => `${location.propertycity}, ${location.propertyprovince}`)
    .filter(Boolean);

  const uniqueLocations = Array.from(new Set(locations));

  return {
    project_id: Number(row.projectid),
    project_code: row.projectcode,
    project_name: row.projectname,
    project_description: row.projectdescription,
    project_status: row.projectstatus,
    location_display: uniqueLocations[0] ?? 'No linked property location',
    property_count: row.property?.length ?? 0,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAdminSession(req, res);
  if (!session) {
    // requireAdminSession already sends 401 response with error
    return;
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('project')
        .select(PROJECT_SELECT)
        .order('projectid', { ascending: true });

      if (error) throw error;

      const items = (data ?? []).map((row: any) => mapProjectRow(row as ProjectDbRow));
      return res.status(200).json({ items });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

      const { data, error } = await supabaseAdmin
        .from('project')
        .insert([
          {
            projectcode: body.projectcode,
            projectname: body.projectname,
            projectdescription: body.projectdescription ?? null,
          },
        ])
        .select(PROJECT_SELECT)
        .single();

      if (error || !data) {
        throw error ?? new Error('Failed to create project');
      }

      const item = mapProjectRow(data as ProjectDbRow);
      return res.status(201).json({ item });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const projectId = Number(req.query.id);
      if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({ error: 'Invalid project id' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};

      const { data, error } = await supabaseAdmin
        .from('project')
        .update({
          projectname: body.projectname,
          projectdescription: body.projectdescription ?? null,
        })
        .eq('projectid', projectId)
        .select(PROJECT_SELECT)
        .single();

      if (error || !data) {
        throw error ?? new Error('Failed to update project');
      }

      const item = mapProjectRow(data as ProjectDbRow);
      return res.status(200).json({ item });
    }

    if (req.method === 'DELETE') {
      const projectId = Number(req.query.id);
      if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({ error: 'Invalid project id' });
      }

      const { error } = await supabaseAdmin
        .from('project')
        .delete()
        .eq('projectid', projectId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message ?? 'Failed to process project request',
    });
  }
}
