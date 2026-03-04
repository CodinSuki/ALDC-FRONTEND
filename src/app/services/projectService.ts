export interface Project {
  project_id: number;
  project_code: string;
  project_name: string;
  project_description?: string | null;
  project_status: string;
  location_display?: string;
  property_count: number;
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

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/admin/projects', {
    method: 'GET',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    items?: Project[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load projects');
  }

  return payload.items ?? [];
};

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const response = await fetch('/api/admin/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    item?: Project;
    error?: string;
  };

  if (!response.ok || !data.item) {
    throw new Error(data.error ?? 'Failed to create project');
  }

  return data.item;
};

export const updateProject = async (
  projectId: number,
  payload: UpdateProjectPayload
): Promise<Project> => {
  const response = await fetch(`/api/admin/projects?id=${encodeURIComponent(String(projectId))}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    item?: Project;
    error?: string;
  };

  if (!response.ok || !data.item) {
    throw new Error(data.error ?? 'Failed to update project');
  }

  return data.item;
};

export const deleteProject = async (projectId: number): Promise<void> => {
  const response = await fetch(`/api/admin/projects?id=${encodeURIComponent(String(projectId))}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to delete project');
  }
};
