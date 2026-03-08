/**
 * Payment Service
 * Handles payment schedules and payment recording
 */

export type InstallmentFrequency = 'Monthly' | 'BiMonthly' | 'Quarterly' | 'Yearly' | 'LumpSum';
export type PaymentStatus = 'Pending' | 'Confirmed' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Check' | 'Credit Card' | 'Online Payment';

export type PaymentSchedule = {
  paymentscheduleid: number;
  transactionid: number;
  totalamount: number;
  installmentfrequency: InstallmentFrequency;
  installmentcount: number;
  startdate: string;
  createdat?: string;
};

export type Payment = {
  paymentid: number;
  paymentscheduleid: number;
  paymentdate: string;
  amountpaid: number;
  paymentmethod: PaymentMethod;
  paymentstatus: PaymentStatus;
  transactionnotes?: string;
  createdat?: string;
};

export type CreatePaymentSchedulePayload = {
  transactionId: number;
  totalAmount: number;
  installmentFrequency: InstallmentFrequency;
  installmentCount: number;
  startDate: string;
};

export type RecordPaymentPayload = {
  paymentScheduleId: number;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionNotes?: string;
};

/**
 * Create a payment schedule for a transaction
 * Validates:
 * - Transaction exists
 * - No existing payment schedule for the transaction
 * - Installment calculations are valid
 */
export const createPaymentSchedule = async (payload: CreatePaymentSchedulePayload): Promise<PaymentSchedule> => {
  const response = await fetch('/api/admin/sales?resource=schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to create payment schedule');
  }

  return data.paymentSchedule;
};

/**
 * Record a payment against a payment schedule
 * After recording, checks if total confirmed payments >= total amount
 * If so, marks transaction as "Completed"
 */
export const recordPayment = async (payload: RecordPaymentPayload): Promise<Payment> => {
  const response = await fetch('/api/admin/sales?resource=payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to record payment');
  }

  return data.payment;
};

/**
 * Get payment schedule for a transaction
 */
export const fetchPaymentSchedule = async (transactionId: number): Promise<PaymentSchedule | null> => {
  const response = await fetch(`/api/admin/sales?resource=schedule&transactionId=${transactionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch payment schedule');
  }

  return data.paymentSchedule ?? null;
};

/**
 * Get all payments for a payment schedule
 */
export const fetchPayments = async (paymentScheduleId: number): Promise<Payment[]> => {
  const response = await fetch(`/api/admin/sales?resource=payment&paymentScheduleId=${paymentScheduleId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch payments');
  }

  return data.payments ?? [];
};

/**
 * Get payment summary for a payment schedule
 */
export const fetchPaymentSummary = async (paymentScheduleId: number): Promise<{
  totalAmount: number;
  totalPaid: number;
  totalConfirmed: number;
  remainingAmount: number;
  paymentCount: number;
}> => {
  const response = await fetch(`/api/admin/sales?resource=payment&action=summary&paymentScheduleId=${paymentScheduleId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    summary?: {
      totalAmount?: number;
      totalPaid?: number;
      totalConfirmed?: number;
      remainingAmount?: number;
      paymentCount?: number;
    };
  };

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to fetch payment summary');
  }

  return {
    totalAmount: Number(data.summary?.totalAmount ?? 0),
    totalPaid: Number(data.summary?.totalPaid ?? 0),
    totalConfirmed: Number(data.summary?.totalConfirmed ?? 0),
    remainingAmount: Number(data.summary?.remainingAmount ?? 0),
    paymentCount: Number(data.summary?.paymentCount ?? 0),
  };
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId: number, status: PaymentStatus): Promise<Payment> => {
  const response = await fetch('/api/admin/sales?resource=payment', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ paymentId, paymentStatus: status }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Failed to update payment status');
  }

  return data.payment;
};
