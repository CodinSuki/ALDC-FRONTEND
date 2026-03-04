import { supabaseAdmin } from './_utils/supabaseAdmin';
import { requireAdminSession } from './_utils/auth';

type GenerateCommissionPayload = {
  transactionId: number;
  staffId: number;
  commissionRate: number;
};

type RecordCommissionPayoutPayload = {
  commissionId: number;
  payoutAmount: number;
  payoutDate: string;
  payoutMethod: string;
  payoutNotes?: string;
};

/**
 * Validate commission doesn't already exist for transaction
 */
const validateNoExistingCommission = async (transactionId: number): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('commission')
    .select('commissionid')
    .eq('transactionid', transactionId)
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    throw new Error('A commission already exists for this transaction. Only one commission per transaction is allowed.');
  }
};

/**
 * Validate transaction is completed before generating commission
 */
const validateTransactionCompleted = async (transactionId: number): Promise<number> => {
  const { data: transaction, error } = await supabaseAdmin
    .from('transaction')
    .select('transactionid, transactionstatus, negotiatedprice')
    .eq('transactionid', transactionId)
    .single();

  if (error || !transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.transactionstatus !== 'Completed') {
    throw new Error('Commission can only be generated for Completed transactions');
  }

  return Number(transaction.negotiatedprice);
};

/**
 * Check if total payouts meet or exceed commission amount
 * If so, update commission status to "Released"
 */
const checkAndReleaseCommission = async (commissionId: number): Promise<void> => {
  // Get commission info
  const { data: commission, error: commissionError } = await supabaseAdmin
    .from('commission')
    .select('commissionid, commissionamount, commissionstatus')
    .eq('commissionid', commissionId)
    .single();

  if (commissionError || !commission) {
    throw commissionError ?? new Error('Commission not found');
  }

  // Already released, no need to check
  if (commission.commissionstatus === 'Released') {
    return;
  }

  // Calculate total payouts
  const { data: payouts, error: payoutsError } = await supabaseAdmin
    .from('commissionpayout')
    .select('payoutamount')
    .eq('commissionid', commissionId);

  if (payoutsError) throw payoutsError;

  const totalPaidOut = (payouts ?? []).reduce((sum: number, p: any) => sum + Number(p.payoutamount ?? 0), 0);

  // If total paid out >= commission amount, mark as released
  if (totalPaidOut >= Number(commission.commissionamount)) {
    const { error: updateError } = await supabaseAdmin
      .from('commission')
      .update({
        commissionstatus: 'Released',
        releasedat: new Date().toISOString(),
      })
      .eq('commissionid', commissionId);

    if (updateError) throw updateError;
  }
};

/**
 * Generate commission for a completed transaction
 */
const handleGenerateCommission = async (req: any, res: any) => {
  const payload = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as GenerateCommissionPayload;

  // Validate required fields
  if (!payload.transactionId || !payload.staffId || payload.commissionRate === undefined) {
    res.status(400).json({ error: 'TransactionId, StaffId, and CommissionRate are required' });
    return;
  }

  if (payload.commissionRate < 0 || payload.commissionRate > 1) {
    res.status(400).json({ error: 'Commission rate must be between 0 and 1 (e.g., 0.03 for 3%)' });
    return;
  }

  // Verify staff exists
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('staffid')
    .eq('staffid', payload.staffId)
    .single();

  if (staffError || !staff) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  // Validate transaction is completed
  const negotiatedPrice = await validateTransactionCompleted(payload.transactionId);

  // Validate no existing commission
  await validateNoExistingCommission(payload.transactionId);

  // Calculate commission amount
  const commissionAmount = negotiatedPrice * payload.commissionRate;

  // Create commission
  const { data: commission, error: commissionError } = await supabaseAdmin
    .from('commission')
    .insert([
      {
        transactionid: payload.transactionId,
        staffid: payload.staffId,
        commissionamount: commissionAmount,
        commissionrate: payload.commissionRate,
        commissionstatus: 'Pending',
        createdat: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (commissionError || !commission) {
    throw commissionError ?? new Error('Failed to generate commission');
  }

  res.status(201).json({ commission });
};

/**
 * Record a commission payout
 */
const handleRecordCommissionPayout = async (req: any, res: any) => {
  const payload = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as RecordCommissionPayoutPayload;

  const session = requireAdminSession(req, res);
  if (!session) return;

  // Validate required fields
  if (!payload.commissionId || !payload.payoutAmount || !payload.payoutDate || !payload.payoutMethod) {
    res.status(400).json({ error: 'CommissionId, PayoutAmount, PayoutDate, and PayoutMethod are required' });
    return;
  }

  if (payload.payoutAmount <= 0) {
    res.status(400).json({ error: 'Payout amount must be greater than zero' });
    return;
  }

  // Verify commission exists
  const { data: commission, error: commissionError } = await supabaseAdmin
    .from('commission')
    .select('commissionid, commissionamount')
    .eq('commissionid', payload.commissionId)
    .single();

  if (commissionError || !commission) {
    res.status(404).json({ error: 'Commission not found' });
    return;
  }

  // Check that payout doesn't exceed remaining commission amount
  const { data: existingPayouts, error: payoutsError } = await supabaseAdmin
    .from('commissionpayout')
    .select('payoutamount')
    .eq('commissionid', payload.commissionId);

  if (payoutsError) throw payoutsError;

  const totalPaidOut = (existingPayouts ?? []).reduce((sum: number, p: any) => sum + Number(p.payoutamount ?? 0), 0);
  const remainingAmount = Number(commission.commissionamount) - totalPaidOut;

  if (payload.payoutAmount > remainingAmount + 0.01) {
    // Allow small floating point tolerance
    res.status(400).json({
      error: `Payout amount ($${payload.payoutAmount}) exceeds remaining commission amount ($${remainingAmount.toFixed(2)})`,
    });
    return;
  }

  const { data: recorder, error: recorderError } = await supabaseAdmin
    .from('staff')
    .select('staffid')
    .eq('emailaddress', session.email)
    .single();

  if (recorderError || !recorder) {
    res.status(400).json({ error: 'No staff record found for current admin session email' });
    return;
  }

  // Create payout
  const { data: payout, error: payoutError } = await supabaseAdmin
    .from('commissionpayout')
    .insert([
      {
        commissionid: payload.commissionId,
        payoutamount: payload.payoutAmount,
        payoutdate: payload.payoutDate,
        paymentmethod: payload.payoutMethod,
        referenceno: payload.payoutNotes ?? null,
        recordedby: recorder.staffid,
      },
    ])
    .select()
    .single();

  if (payoutError || !payout) {
    throw payoutError ?? new Error('Failed to record commission payout');
  }

  // Check if commission should be marked as released
  await checkAndReleaseCommission(payload.commissionId);

  res.status(201).json({ payout });
};

/**
 * Fetch commissions with filters
 */
const handleFetchCommissions = async (req: any, res: any) => {
  const { id, transactionId, staffId, status } = req.query ?? {};

  // Fetch single commission by ID
  if (id) {
    const { data: commission, error } = await supabaseAdmin
      .from('commission')
      .select('*')
      .eq('commissionid', Number(id))
      .single();

    if (error || !commission) {
      res.status(404).json({ error: 'Commission not found' });
      return;
    }

    res.status(200).json({ commission });
    return;
  }

  // Fetch with filters
  let query = supabaseAdmin.from('commission').select('*');

  if (transactionId) {
    query = query.eq('transactionid', Number(transactionId));
  }
  if (staffId) {
    query = query.eq('staffid', Number(staffId));
  }
  if (status) {
    query = query.eq('commissionstatus', status);
  }

  query = query.order('createdat', { ascending: false });

  const { data: commissions, error } = await query;

  if (error) throw error;

  res.status(200).json({ commissions: commissions ?? [] });
};

/**
 * Fetch commission payouts
 */
const handleFetchCommissionPayouts = async (req: any, res: any) => {
  const { commissionId } = req.query ?? {};

  if (!commissionId) {
    res.status(400).json({ error: 'CommissionId is required' });
    return;
  }

  const { data: payouts, error } = await supabaseAdmin
    .from('commissionpayout')
    .select('*')
    .eq('commissionid', Number(commissionId))
    .order('payoutdate', { ascending: false });

  if (error) throw error;

  const normalizedPayouts = (payouts ?? []).map((p: any) => ({
    ...p,
    payoutmethod: p.paymentmethod,
    payoutnotes: p.referenceno,
  }));

  res.status(200).json({ payouts: normalizedPayouts });
};

/**
 * Fetch commission summary
 */
const handleFetchCommissionSummary = async (req: any, res: any) => {
  const { commissionId } = req.query ?? {};

  if (!commissionId) {
    res.status(400).json({ error: 'CommissionId is required' });
    return;
  }

  // Get commission
  const { data: commission, error: commissionError } = await supabaseAdmin
    .from('commission')
    .select('commissionamount, commissionstatus')
    .eq('commissionid', Number(commissionId))
    .single();

  if (commissionError || !commission) {
    res.status(404).json({ error: 'Commission not found' });
    return;
  }

  // Get all payouts
  const { data: payouts, error: payoutsError } = await supabaseAdmin
    .from('commissionpayout')
    .select('payoutamount')
    .eq('commissionid', Number(commissionId));

  if (payoutsError) throw payoutsError;

  const commissionAmount = Number(commission.commissionamount);
  const totalPaidOut = (payouts ?? []).reduce((sum: number, p: any) => sum + Number(p.payoutamount ?? 0), 0);
  const remainingAmount = Math.max(0, commissionAmount - totalPaidOut);

  const summary = {
    commissionAmount,
    totalPaidOut,
    remainingAmount,
    payoutCount: (payouts ?? []).length,
    status: commission.commissionstatus,
  };

  res.status(200).json({ summary });
};

/**
 * Fetch staff commission report
 */
const handleFetchStaffReport = async (req: any, res: any) => {
  const { staffId, startDate, endDate } = req.query ?? {};

  if (!staffId) {
    res.status(400).json({ error: 'StaffId is required' });
    return;
  }

  // Build query
  let query = supabaseAdmin
    .from('commission')
    .select('*')
    .eq('staffid', Number(staffId));

  if (startDate) {
    query = query.gte('createdat', startDate);
  }
  if (endDate) {
    query = query.lte('createdat', endDate);
  }

  query = query.order('createdat', { ascending: false });

  const { data: commissions, error } = await query;

  if (error) throw error;

  const totalCommissions = (commissions ?? []).reduce((sum: number, c: any) => sum + Number(c.commissionamount ?? 0), 0);
  const totalReleased = (commissions ?? [])
    .filter((c: any) => c.commissionstatus === 'Released')
    .reduce((sum: number, c: any) => sum + Number(c.commissionamount ?? 0), 0);
  const totalPending = (commissions ?? [])
    .filter((c: any) => c.commissionstatus === 'Pending')
    .reduce((sum: number, c: any) => sum + Number(c.commissionamount ?? 0), 0);

  const report = {
    totalCommissions,
    totalReleased,
    totalPending,
    commissionCount: (commissions ?? []).length,
    commissions: commissions ?? [],
  };

  res.status(200).json({ report });
};

/**
 * Route handler for payout endpoints
 */
const handlePayoutRoute = async (req: any, res: any) => {
  if (req.method === 'POST') {
    await handleRecordCommissionPayout(req, res);
    return;
  }

  if (req.method === 'GET') {
    await handleFetchCommissionPayouts(req, res);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

/**
 * Route handler for summary endpoint
 */
const handleSummaryRoute = async (req: any, res: any) => {
  if (req.method === 'GET') {
    await handleFetchCommissionSummary(req, res);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

/**
 * Route handler for report endpoint
 */
const handleReportRoute = async (req: any, res: any) => {
  if (req.method === 'GET') {
    await handleFetchStaffReport(req, res);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

/**
 * Main handler
 */
export default async function handler(req: any, res: any) {
  try {
    // Require admin session for all operations
    await requireAdminSession(req, res);

    // Route based on subpath
    const resource = req.query?.resource;

    if (resource === 'payout') {
      await handlePayoutRoute(req, res);
      return;
    }

    if (resource === 'summary') {
      await handleSummaryRoute(req, res);
      return;
    }

    if (resource === 'report') {
      await handleReportRoute(req, res);
      return;
    }

    // Default: commission operations
    if (req.method === 'POST') {
      await handleGenerateCommission(req, res);
      return;
    }

    if (req.method === 'GET') {
      await handleFetchCommissions(req, res);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Commission API error:', error);
    res.status(500).json({ error: error?.message ?? 'Commission operation failed' });
  }
}
