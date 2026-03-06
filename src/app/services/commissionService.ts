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
  createdat: string;
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
  const response = await fetch('/api/admin/commissions?resource=payout', {
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
 * Get all payouts for a commission
 */
export const fetchCommissionPayouts = async (commissionId: number): Promise<CommissionPayout[]> => {
  const response = await fetch(`/api/admin/commissions?resource=payout&commissionId=${commissionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch commission payouts');
  }

  return data.payouts ?? [];
};

