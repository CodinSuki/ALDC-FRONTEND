/**
 * Transaction Service
 * Handles transaction creation, updates, and status management
 */

export type TransactionStatus = 'Draft' | 'Ongoing' | 'Completed' | 'Cancelled';

export type Transaction = {
  transactionid: number;
  propertyid: number;
  buyerclientid: number;
  negotiatedprice: number;
  transactionstatus: TransactionStatus;
  createdat?: string;
  updatedat?: string;
  completiondate?: string;
};

export type CreateTransactionPayload = {
  propertyId: number;
  buyerClientId: number;
  negotiatedPrice: number;
  transactionStatus?: TransactionStatus;
};

export type UpdateTransactionPayload = {
  transactionId: number;
  transactionStatus?: TransactionStatus;
  negotiatedPrice?: number;
};

/**
 * Create a new transaction
 * Validates:
 * - No active (Draft/Ongoing) transaction exists for the property
 * - Required fields are present
 */
export const createTransaction = async (payload: CreateTransactionPayload): Promise<Transaction> => {
  const response = await fetch('/api/admin/sales?resource=transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to create transaction');
  }

  return data.transaction;
};

/**
 * Update transaction status
 * When status becomes "Completed":
 * - Updates property listing status to "Sold"
 * - Triggers commission generation
 */
export const updateTransactionStatus = async (payload: UpdateTransactionPayload): Promise<Transaction> => {
  const response = await fetch('/api/admin/sales?resource=transaction', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to update transaction');
  }

  return data.transaction;
};

/**
 * Get all transactions with filters
 */
export const fetchTransactions = async (filters?: {
  propertyId?: number;
  buyerClientId?: number;
  status?: TransactionStatus;
}): Promise<Transaction[]> => {
  const params = new URLSearchParams({ resource: 'transaction' });
  if (filters?.propertyId) params.append('propertyId', String(filters.propertyId));
  if (filters?.buyerClientId) params.append('buyerClientId', String(filters.buyerClientId));
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`/api/admin/sales?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch transactions');
  }

  return data.transactions ?? [];
};

/**
 * Get a single transaction by ID
 */
export const fetchTransactionById = async (transactionId: number): Promise<Transaction> => {
  const response = await fetch(`/api/admin/sales?resource=transaction&id=${transactionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch transaction');
  }

  return data.transaction;
};

/**
 * Cancel a transaction
 */
export const cancelTransaction = async (transactionId: number): Promise<Transaction> => {
  return updateTransactionStatus({
    transactionId,
    transactionStatus: 'Cancelled',
  });
};
