export type Agent = {
  agent_id: number;
  name: string;
  email: string;
  contact_number: string;
  license_number: string;
  status: 'Active' | 'Inactive';
};

export type Broker = {
  broker_id: number;
  name: string;
  email: string;
  contact_number: string;
  prc_license: string;
  status: 'Active' | 'Inactive';
};

export const fetchAgents = async (): Promise<Agent[]> => {
  const response = await fetch('/api/admin/management?resource=agents', {
    method: 'GET',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    items?: Agent[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load agents');
  }

  return payload.items ?? [];
};

export const fetchBrokers = async (): Promise<Broker[]> => {
  const response = await fetch('/api/admin/management?resource=brokers', {
    method: 'GET',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    items?: Broker[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load brokers');
  }

  return payload.items ?? [];
};

export const createAgent = async (agentData: Omit<Agent, 'agent_id'>): Promise<Agent> => {
  const response = await fetch('/api/admin/management?resource=agents', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...agentData, type: 'agent' }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    item?: Agent;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to create agent');
  }

  if (!payload.item) {
    throw new Error('No data returned from create agent');
  }

  return payload.item;
};

export const createBroker = async (brokerData: Omit<Broker, 'broker_id'>): Promise<Broker> => {
  const response = await fetch('/api/admin/management?resource=brokers', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...brokerData, type: 'broker' }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    item?: Broker;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to create broker');
  }

  if (!payload.item) {
    throw new Error('No data returned from create broker');
  }

  return payload.item;
};

export const updateAgent = async (agentId: number, agentData: Partial<Agent>): Promise<Agent> => {
  const response = await fetch(`/api/admin/management?resource=agents&id=${agentId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    item?: Agent;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to update agent');
  }

  if (!payload.item) {
    throw new Error('No data returned from update agent');
  }

  return payload.item;
};

export const updateBroker = async (brokerId: number, brokerData: Partial<Broker>): Promise<Broker> => {
  const response = await fetch(`/api/admin/management?resource=brokers&id=${brokerId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(brokerData),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    item?: Broker;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to update broker');
  }

  if (!payload.item) {
   throw new Error('No data returned from update broker');
  }

  return payload.item;
};

export const deleteAgent = async (agentId: number): Promise<void> => {
  const response = await fetch(`/api/admin/management?resource=agents&id=${agentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to delete agent');
  }
};

export const deleteBroker = async (brokerId: number): Promise<void> => {
  const response = await fetch(`/api/admin/management?resource=brokers&id=${brokerId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to delete broker');
  }
};
