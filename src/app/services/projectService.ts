import { supabase } from '../../lib/SupabaseClient';

export interface Project {
  project_id: number;
  project_code: string;
  project_name: string;
  project_description?: string | null;
  project_status: string;
  location_display?: string;
  property_count: number;
}

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

export interface CreateProjectPayload {
  projectcode: string;
  projectname: string;
  projectdescription: string | null;
}

export interface UpdateProjectPayload {
  projectname: string;
  projectdescription: string | null;
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

const mapProjectRow = (row: ProjectDbRow): Project => {
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

export const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('project')
    .select(PROJECT_SELECT)
    .order('projectid', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapProjectRow(row as ProjectDbRow));
};

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const { data, error } = await supabase
    .from('project')
    .insert([payload])
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create project');
  }

  return mapProjectRow(data as ProjectDbRow);
};

export const updateProject = async (
  projectId: number,
  payload: UpdateProjectPayload
): Promise<Project> => {
  const { data, error } = await supabase
    .from('project')
    .update(payload)
    .eq('projectid', projectId)
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to update project');
  }

  return mapProjectRow(data as ProjectDbRow);
};

export const deleteProject = async (projectId: number): Promise<void> => {
  const { error } = await supabase
    .from('project')
    .delete()
    .eq('projectid', projectId);

  if (error) {
    throw error;
  }
};
