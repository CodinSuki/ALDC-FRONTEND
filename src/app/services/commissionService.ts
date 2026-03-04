/**
 * Commission Service
 * Handles commission generation and payout management
 */

export type CommissionStatus = 'Pending' | 'Released';

export type Commission = {
  commissionid: number;
  transactionid: number;
  staffid: number;
  commissionamount: number;
  commissionrate: number;
  commissionstatus: CommissionStatus;
  generatedat: string;
  releasedat?: string;
};

export type CommissionPayout = {
  commissionpayoutid: number;
  commissionid: number;
  payoutamount: number;
  payoutdate: string;
  payoutmethod: string;
  payoutnotes?: string;
  createdat?: string;
};

export type GenerateCommissionPayload = {
  transactionId: number;
  staffId: number;
  commissionRate: number;
};

export type RecordCommissionPayoutPayload = {
  commissionId: number;
  payoutAmount: number;
  payoutDate: string;
  payoutMethod: string;
  payoutNotes?: string;
};

/**
 * Generate commission for a completed transaction
 * Validates:
 * - Transaction status is "Completed"
 * - No existing commission for the transaction
 * - Commission rate is valid (0-1)
 */
export const generateCommission = async (payload: GenerateCommissionPayload): Promise<Commission> => {
  const response = await fetch('/api/admin/commissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to generate commission');
  }

  return data.commission;
};

/**
 * Record a commission payout
 * After recording, checks if total payouts >= commission amount
 * If so, marks commission as "Released"
 */
export const recordCommissionPayout = async (payload: RecordCommissionPayoutPayload): Promise<CommissionPayout> => {
  const response = await fetch('/api/admin/commissions/payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to record commission payout');
  }

  return data.payout;
};

/**
 * Get all commissions with filters
 */
export const fetchCommissions = async (filters?: {
  transactionId?: number;
  staffId?: number;
  status?: CommissionStatus;
}): Promise<Commission[]> => {
  const params = new URLSearchParams();
  if (filters?.transactionId) params.append('transactionId', String(filters.transactionId));
  if (filters?.staffId) params.append('staffId', String(filters.staffId));
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`/api/admin/commissions?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch commissions');
  }

  return data.commissions ?? [];
};

/**
 * Get commission by ID
 */
export const fetchCommissionById = async (commissionId: number): Promise<Commission> => {
  const response = await fetch(`/api/admin/commissions?id=${commissionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch commission');
  }

  return data.commission;
};

/**
 * Get all payouts for a commission
 */
export const fetchCommissionPayouts = async (commissionId: number): Promise<CommissionPayout[]> => {
  const response = await fetch(`/api/admin/commissions/payout?commissionId=${commissionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch commission payouts');
  }

  return data.payouts ?? [];
};

/**
 * Get commission summary
 */
export const fetchCommissionSummary = async (commissionId: number): Promise<{
  commissionAmount: number;
  totalPaidOut: number;
  remainingAmount: number;
  payoutCount: number;
  status: CommissionStatus;
}> => {
  const response = await fetch(`/api/admin/commissions/summary?commissionId=${commissionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch commission summary');
  }

  return data.summary;
};

/**
 * Get staff commission report
 */
export const fetchStaffCommissionReport = async (staffId: number, filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalCommissions: number;
  totalReleased: number;
  totalPending: number;
  commissionCount: number;
  commissions: Commission[];
}> => {
  const params = new URLSearchParams({ staffId: String(staffId) });
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`/api/admin/commissions/report?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch staff commission report');
  }

  return data.report;
};
