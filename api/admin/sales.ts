import { requireAdminSession } from '../../lib/admin/utils/auth.js';
import { supabaseAdmin } from '../../lib/admin/utils/supabaseAdmin.js';
import { logActivity } from '../../lib/admin/utils/activityLog.js';

/**
 * Sales endpoint - handles transactions, payments, and payment schedules
 * 
 * Route patterns:
 * - GET /api/admin/sales?resource=transaction - Fetch all transactions
 * - GET /api/admin/sales?resource=transaction&id=X - Fetch transaction by ID
 * - POST /api/admin/sales?resource=transaction - Create transaction
 * - PATCH /api/admin/sales?resource=transaction - Update transaction
 * - GET /api/admin/sales?resource=schedule&transactionId=X - Fetch payment schedules
 * - POST /api/admin/sales?resource=schedule - Create payment schedule
 * - GET /api/admin/sales?resource=payment&paymentScheduleId=X - Fetch payments
 * - POST /api/admin/sales?resource=payment - Record payment
 * - GET /api/admin/sales?resource=payment&action=summary&paymentScheduleId=X - Payment summary
 */

export default async function handler(req: any, res: any) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  try {
    const resource = String(req.query?.resource ?? '').trim().toLowerCase();
    const action = String(req.query?.action ?? '').trim().toLowerCase();

    // === TRANSACTION ENDPOINTS ===
    if (resource === 'transaction') {
      if (req.method === 'GET') {
        const id = req.query?.id ? Number(req.query.id) : null;

        if (id) {
          // Fetch single transaction with details
          const { data, error } = await supabaseAdmin
            .from('transaction')
            .select(
              `
              *,
              property!fk_transaction_property(propertyid, propertyname),
              client!fk_transaction_buyer(clientid, firstname, middlename, lastname, emailaddress, contactnumber)
            `
            )
            .eq('transactionid', id)
            .single();

          if (error || !data) {
            return res.status(404).json({ error: 'Transaction not found' });
          }

          return res.status(200).json({ transaction: data });
        }

        // Fetch all transactions
        const { data, error } = await supabaseAdmin
          .from('transaction')
          .select(
            `
            *,
            property!fk_transaction_property(propertyid, propertyname),
            client!fk_transaction_buyer(clientid, firstname, middlename, lastname, emailaddress, contactnumber)
          `
          )
          .order('createdat', { ascending: false });

        if (error) {
          throw new Error(`Failed to fetch transactions: ${error.message}`);
        }

        return res.status(200).json({ transactions: data ?? [] });
      }

      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { propertyId, buyerClientId, negotiatedPrice, transactionStatus } = body;

        if (!propertyId || !buyerClientId || !negotiatedPrice) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for existing active transaction on this property
        const { data: existing } = await supabaseAdmin
          .from('transaction')
          .select('transactionid')
          .eq('propertyid', propertyId)
          .in('transactionstatus', ['Draft', 'Ongoing'])
          .limit(1);

        if (existing && existing.length > 0) {
          return res.status(400).json({
            error: 'An active transaction already exists for this property',
          });
        }

        const { data, error } = await supabaseAdmin
          .from('transaction')
          .insert({
            propertyid: propertyId,
            buyerclientid: buyerClientId,
            negotiatedprice: negotiatedPrice,
            transactionstatus: transactionStatus || 'Draft',
            createdat: new Date().toISOString(),
          })
          .select()
          .single();

        if (error || !data) {
          throw new Error(`Failed to create transaction: ${error?.message}`);
        }

        await logActivity({
          staffid: session.staffId,
          activitytype: 'transaction_created',
          entitytype: 'transaction',
          entityid: data.transactionid,
          description: `Created transaction for property ${propertyId}`,
        });

        return res.status(201).json({ transaction: data });
      }

      if (req.method === 'PATCH') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { transactionId, transactionStatus, negotiatedPrice } = body;

        if (!transactionId) {
          return res.status(400).json({ error: 'Transaction ID is required' });
        }

        const updates: any = { updatedat: new Date().toISOString() };
        if (transactionStatus) updates.transactionstatus = transactionStatus;
        if (negotiatedPrice !== undefined) updates.negotiatedprice = negotiatedPrice;

        const { data, error } = await supabaseAdmin
          .from('transaction')
          .update(updates)
          .eq('transactionid', transactionId)
          .select()
          .single();

        if (error || !data) {
          throw new Error(`Failed to update transaction: ${error?.message}`);
        }

        await logActivity({
          staffid: session.staffId,
          activitytype: 'transaction_created',
          entitytype: 'transaction',
          entityid: transactionId,
          description: `Updated transaction status to ${transactionStatus || 'unchanged'}`,
        });

        return res.status(200).json({ transaction: data });
      }
    }

    // === PAYMENT SCHEDULE ENDPOINTS ===
    if (resource === 'schedule') {
      if (req.method === 'GET') {
        const transactionId = req.query?.transactionId ? Number(req.query.transactionId) : null;

        if (!transactionId) {
          return res.status(400).json({ error: 'Transaction ID is required' });
        }

        const { data, error } = await supabaseAdmin
          .from('paymentschedule')
          .select('*')
          .eq('transactionid', transactionId)
          .limit(1);

        if (error) {
          throw new Error(`Failed to fetch payment schedules: ${error.message}`);
        }

        const schedules = data ?? [];
        return res.status(200).json({ paymentSchedule: schedules[0] ?? null });
      }

      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const {
          transactionId,
          paymentAmount,
          paymentDueDate,
          totalAmount,
          installmentFrequency,
          installmentCount,
          startDate,
        } = body;

        const resolvedTotalAmount = Number(totalAmount ?? paymentAmount);
        const resolvedInstallmentFrequency = String(installmentFrequency ?? 'One-Time').trim();
        const resolvedInstallmentCount = Number(installmentCount ?? 1);
        const resolvedStartDate = String(startDate ?? paymentDueDate ?? '').trim();

        if (!transactionId || !resolvedTotalAmount || !resolvedStartDate) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabaseAdmin
          .from('paymentschedule')
          .insert({
            transactionid: transactionId,
            totalamount: resolvedTotalAmount,
            installmentfrequency: resolvedInstallmentFrequency,
            installmentcount: resolvedInstallmentCount,
            startdate: resolvedStartDate,
            createdat: new Date().toISOString(),
          })
          .select()
          .single();

        if (error || !data) {
          throw new Error(`Failed to create payment schedule: ${error?.message}`);
        }

        return res.status(201).json({ paymentSchedule: data });
      }
    }

    // === PAYMENT ENDPOINTS ===
    if (resource === 'payment') {
      if (req.method === 'GET' && action === 'summary') {
        const paymentScheduleId = req.query?.paymentScheduleId ? Number(req.query.paymentScheduleId) : null;

        if (!paymentScheduleId) {
          return res.status(400).json({ error: 'Payment Schedule ID is required' });
        }

        const { data: schedule, error: schedError } = await supabaseAdmin
          .from('paymentschedule')
          .select('totalamount')
          .eq('paymentscheduleid', paymentScheduleId)
          .single();

        if (schedError || !schedule) {
          return res.status(404).json({ error: 'Payment schedule not found' });
        }

        const { data: payments, error: payError } = await supabaseAdmin
          .from('payment')
          .select('amountpaid')
          .eq('paymentscheduleid', paymentScheduleId);

        if (payError) {
          throw new Error(`Failed to fetch payments: ${payError.message}`);
        }

        const totalPaid = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amountpaid ?? 0), 0);
        const amountDue = Number(schedule.totalamount);
        const balance = amountDue - totalPaid;

        return res.status(200).json({
          summary: {
            totalAmount: amountDue,
            totalPaid,
            totalConfirmed: totalPaid,
            remainingAmount: balance,
            paymentCount: (payments ?? []).length,
          },
        });
      }

      if (req.method === 'GET') {
        const paymentScheduleId = req.query?.paymentScheduleId ? Number(req.query.paymentScheduleId) : null;

        if (!paymentScheduleId) {
          return res.status(400).json({ error: 'Payment Schedule ID is required' });
        }

        const { data, error } = await supabaseAdmin
          .from('payment')
          .select('*')
          .eq('paymentscheduleid', paymentScheduleId)
          .order('paymentdate', { ascending: false });

        if (error) {
          throw new Error(`Failed to fetch payments: ${error.message}`);
        }

        return res.status(200).json({ payments: data ?? [] });
      }

      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const {
          paymentScheduleId,
          paymentAmount,
          paymentDate,
          paymentMethod,
          amountPaid,
          paymentStatus,
        } = body;

        const resolvedAmountPaid = Number(amountPaid ?? paymentAmount);
        const resolvedPaymentStatus = String(paymentStatus ?? 'Confirmed').trim();

        if (!paymentScheduleId || !resolvedAmountPaid || !paymentDate || !paymentMethod) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Guard against FK violations by validating schedule existence up front.
        const { data: schedule, error: scheduleError } = await supabaseAdmin
          .from('paymentschedule')
          .select('paymentscheduleid')
          .eq('paymentscheduleid', paymentScheduleId)
          .single();

        if (scheduleError || !schedule) {
          return res.status(400).json({ error: 'Invalid payment schedule ID' });
        }

        const { data: scheduleTotals, error: scheduleTotalsError } = await supabaseAdmin
          .from('paymentschedule')
          .select('totalamount')
          .eq('paymentscheduleid', paymentScheduleId)
          .single();

        if (scheduleTotalsError || !scheduleTotals) {
          return res.status(404).json({ error: 'Payment schedule not found' });
        }

        const { data: existingPayments, error: existingPaymentsError } = await supabaseAdmin
          .from('payment')
          .select('amountpaid, paymentstatus')
          .eq('paymentscheduleid', paymentScheduleId);

        if (existingPaymentsError) {
          throw new Error(`Failed to validate payment balance: ${existingPaymentsError.message}`);
        }

        const confirmedPaid = (existingPayments ?? [])
          .filter((p: any) => String(p.paymentstatus ?? '') === 'Confirmed')
          .reduce((sum: number, p: any) => sum + Number(p.amountpaid ?? 0), 0);

        const totalAmount = Number(scheduleTotals.totalamount ?? 0);
        const remainingBalance = totalAmount - confirmedPaid;

        if (remainingBalance <= 0) {
          return res.status(400).json({ error: 'This schedule is fully paid. No additional payments can be recorded.' });
        }

        if (resolvedAmountPaid > remainingBalance) {
          return res.status(400).json({
            error: `Payment amount exceeds remaining balance (${remainingBalance.toFixed(2)})`,
          });
        }

        const { data, error } = await supabaseAdmin
          .from('payment')
          .insert({
            paymentscheduleid: paymentScheduleId,
            amountpaid: resolvedAmountPaid,
            paymentdate: paymentDate,
            paymentmethod: paymentMethod,
            paymentstatus: resolvedPaymentStatus,
            createdat: new Date().toISOString(),
          })
          .select()
          .single();

        if (error || !data) {
          throw new Error(`Failed to record payment: ${error?.message}`);
        }

        await logActivity({
          staffid: session.staffId,
          activitytype: 'payout_recorded',
          entitytype: 'payment',
          entityid: data.paymentid,
          description: `Recorded payment of ${resolvedAmountPaid}`,
        });

        return res.status(201).json({ payment: data });
      }
    }

    return res.status(400).json({ error: 'Invalid resource or action' });
  } catch (error: any) {
    console.error('Sales API error:', error);
    return res.status(500).json({
      error: error?.message ?? 'Internal server error',
    });
  }
}
