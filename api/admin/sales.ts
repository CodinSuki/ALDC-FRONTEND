import { supabaseAdmin } from './_utils/supabaseAdmin';
import { requireAdminSession } from './_utils/auth';

// ============================================
// TRANSACTION HANDLERS
// ============================================

const validateNoActiveTransaction = async (propertyId: number): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('transaction')
    .select('transactionid, transactionstatus')
    .eq('propertyid', propertyId)
    .in('transactionstatus', ['Draft', 'Ongoing'])
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    throw new Error(
      `An active transaction already exists for this property (Status: ${data[0].transactionstatus}). Only one active transaction per property is allowed.`
    );
  }
};

const updatePropertyListingStatus = async (propertyId: number, statusCode: string): Promise<void> => {
  const { data: statusData, error: statusError } = await supabaseAdmin
    .from('propertylistingstatus')
    .select('propertylistingstatusid')
    .eq('propertylistingstatuscode', statusCode)
    .single();

  if (statusError || !statusData) {
    throw statusError ?? new Error(`Property listing status '${statusCode}' not found`);
  }

  const { error: updateError } = await supabaseAdmin
    .from('property')
    .update({ propertylistingstatusid: statusData.propertylistingstatusid })
    .eq('propertyid', propertyId);

  if (updateError) throw updateError;
};

const handleCreateTransaction = async (payload: any) => {
  if (!payload.propertyId || !payload.buyerClientId || !payload.negotiatedPrice) {
    throw new Error('PropertyId, BuyerClientId, and NegotiatedPrice are required');
  }

  if (payload.negotiatedPrice <= 0) {
    throw new Error('NegotiatedPrice must be greater than zero');
  }

  await validateNoActiveTransaction(payload.propertyId);

  const { data: property, error: propertyError } = await supabaseAdmin
    .from('property')
    .select('propertyid')
    .eq('propertyid', payload.propertyId)
    .single();

  if (propertyError || !property) {
    throw new Error('Property not found');
  }

  const { data: client, error: clientError } = await supabaseAdmin
    .from('client')
    .select('clientid')
    .eq('clientid', payload.buyerClientId)
    .single();

  if (clientError || !client) {
    throw new Error('Buyer client not found');
  }

  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transaction')
    .insert([
      {
        propertyid: payload.propertyId,
        buyerclientid: payload.buyerClientId,
        negotiatedprice: payload.negotiatedPrice,
        transactionstatus: payload.transactionStatus ?? 'Draft',
      },
    ])
    .select()
    .single();

  if (transactionError || !transaction) {
    throw transactionError ?? new Error('Failed to create transaction');
  }

  return transaction;
};

const handleUpdateTransaction = async (payload: any) => {
  if (!payload.transactionId) {
    throw new Error('TransactionId is required');
  }

  const { data: existingTransaction, error: fetchError } = await supabaseAdmin
    .from('transaction')
    .select('*')
    .eq('transactionid', payload.transactionId)
    .single();

  if (fetchError || !existingTransaction) {
    throw new Error('Transaction not found');
  }

  const updates: any = {};
  if (payload.transactionStatus) {
    updates.transactionstatus = payload.transactionStatus;
  }
  if (payload.negotiatedPrice !== undefined) {
    if (payload.negotiatedPrice <= 0) {
      throw new Error('NegotiatedPrice must be greater than zero');
    }
    updates.negotiatedprice = payload.negotiatedPrice;
  }

  const wasCompleted = existingTransaction.transactionstatus === 'Completed';
  const willBeCompleted = payload.transactionStatus === 'Completed';

  if (willBeCompleted && !wasCompleted) {
    updates.completiondate = new Date().toISOString();
    await updatePropertyListingStatus(existingTransaction.propertyid, 'SLD');
  }

  const { data: transaction, error: updateError } = await supabaseAdmin
    .from('transaction')
    .update(updates)
    .eq('transactionid', payload.transactionId)
    .select()
    .single();

  if (updateError || !transaction) {
    throw updateError ?? new Error('Failed to update transaction');
  }

  return transaction;
};

const handleFetchTransactions = async (query: any) => {
  const { id, propertyId, buyerClientId, status } = query;

  if (id) {
    const { data: transaction, error } = await supabaseAdmin
      .from('transaction')
      .select('*')
      .eq('transactionid', Number(id))
      .single();

    if (error || !transaction) {
      throw new Error('Transaction not found');
    }

    return { transaction };
  }

  let queryBuilder = supabaseAdmin.from('transaction').select('*');

  if (propertyId) queryBuilder = queryBuilder.eq('propertyid', Number(propertyId));
  if (buyerClientId) queryBuilder = queryBuilder.eq('buyerclientid', Number(buyerClientId));
  if (status) queryBuilder = queryBuilder.eq('transactionstatus', status);

  queryBuilder = queryBuilder.order('createdat', { ascending: false });

  const { data: transactions, error } = await queryBuilder;

  if (error) throw error;

  return { transactions: transactions ?? [] };
};

// ============================================
// PAYMENT HANDLERS
// ============================================

const validateNoExistingSchedule = async (transactionId: number): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('paymentschedule')
    .select('paymentscheduleid')
    .eq('transactionid', transactionId)
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    throw new Error('A payment schedule already exists for this transaction. Only one schedule per transaction is allowed.');
  }
};

const checkAndCompleteTransaction = async (paymentScheduleId: number): Promise<void> => {
  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from('paymentschedule')
    .select('paymentscheduleid, transactionid, totalamount')
    .eq('paymentscheduleid', paymentScheduleId)
    .single();

  if (scheduleError || !schedule) {
    throw scheduleError ?? new Error('Payment schedule not found');
  }

  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from('payment')
    .select('amountpaid')
    .eq('paymentscheduleid', paymentScheduleId)
    .eq('paymentstatus', 'Confirmed');

  if (paymentsError) throw paymentsError;

  const totalPaid = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amountpaid ?? 0), 0);

  if (totalPaid >= Number(schedule.totalamount)) {
    const { error: updateError } = await supabaseAdmin
      .from('transaction')
      .update({
        transactionstatus: 'Completed',
        completiondate: new Date().toISOString(),
      })
      .eq('transactionid', schedule.transactionid);

    if (updateError) throw updateError;

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transaction')
      .select('propertyid')
      .eq('transactionid', schedule.transactionid)
      .single();

    if (transactionError || !transaction) {
      throw transactionError ?? new Error('Transaction not found');
    }

    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('propertylistingstatus')
      .select('propertylistingstatusid')
      .eq('propertylistingstatuscode', 'SLD')
      .single();

    if (statusError || !statusData) {
      throw statusError ?? new Error('Sold status not found');
    }

    await supabaseAdmin
      .from('property')
      .update({ propertylistingstatusid: statusData.propertylistingstatusid })
      .eq('propertyid', transaction.propertyid);
  }
};

const handleCreatePaymentSchedule = async (payload: any) => {
  if (!payload.transactionId || !payload.totalAmount || !payload.installmentFrequency || !payload.installmentCount || !payload.startDate) {
    throw new Error('All payment schedule fields are required');
  }

  if (payload.totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  if (payload.installmentCount < 1) {
    throw new Error('Installment count must be at least 1');
  }

  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transaction')
    .select('transactionid, negotiatedprice')
    .eq('transactionid', payload.transactionId)
    .single();

  if (transactionError || !transaction) {
    throw new Error('Transaction not found');
  }

  await validateNoExistingSchedule(payload.transactionId);

  const { data: paymentSchedule, error: scheduleError } = await supabaseAdmin
    .from('paymentschedule')
    .insert([
      {
        transactionid: payload.transactionId,
        totalamount: payload.totalAmount,
        installmentfrequency: payload.installmentFrequency,
        installmentcount: payload.installmentCount,
        startdate: payload.startDate,
      },
    ])
    .select()
    .single();

  if (scheduleError || !paymentSchedule) {
    throw scheduleError ?? new Error('Failed to create payment schedule');
  }

  return paymentSchedule;
};

const handleRecordPayment = async (payload: any) => {
  if (!payload.paymentScheduleId || !payload.paymentDate || !payload.amountPaid || !payload.paymentMethod) {
    throw new Error('PaymentScheduleId, PaymentDate, AmountPaid, and PaymentMethod are required');
  }

  if (payload.amountPaid <= 0) {
    throw new Error('Amount paid must be greater than zero');
  }

  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from('paymentschedule')
    .select('paymentscheduleid')
    .eq('paymentscheduleid', payload.paymentScheduleId)
    .single();

  if (scheduleError || !schedule) {
    throw new Error('Payment schedule not found');
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payment')
    .insert([
      {
        paymentscheduleid: payload.paymentScheduleId,
        paymentdate: payload.paymentDate,
        amountpaid: payload.amountPaid,
        paymentmethod: payload.paymentMethod,
        paymentstatus: payload.paymentStatus ?? 'Confirmed',
        transactionnotes: payload.transactionNotes ?? null,
      },
    ])
    .select()
    .single();

  if (paymentError || !payment) {
    throw paymentError ?? new Error('Failed to record payment');
  }

  await checkAndCompleteTransaction(payload.paymentScheduleId);

  return payment;
};

const handleUpdatePayment = async (payload: any) => {
  if (!payload.paymentId || !payload.paymentStatus) {
    throw new Error('PaymentId and PaymentStatus are required');
  }

  const { data: payment, error: updateError } = await supabaseAdmin
    .from('payment')
    .update({ paymentstatus: payload.paymentStatus })
    .eq('paymentid', payload.paymentId)
    .select()
    .single();

  if (updateError || !payment) {
    throw new Error('Payment not found');
  }

  await checkAndCompleteTransaction(Number(payment.paymentscheduleid));

  return payment;
};

const handleFetchPaymentSchedule = async (query: any) => {
  const { transactionId } = query;

  if (!transactionId) {
    throw new Error('TransactionId is required');
  }

  const { data: paymentSchedule, error } = await supabaseAdmin
    .from('paymentschedule')
    .select('*')
    .eq('transactionid', Number(transactionId))
    .single();

  return { paymentSchedule: error ? null : paymentSchedule };
};

const handleFetchPayments = async (query: any) => {
  const { paymentScheduleId } = query;

  if (!paymentScheduleId) {
    throw new Error('PaymentScheduleId is required');
  }

  const { data: payments, error } = await supabaseAdmin
    .from('payment')
    .select('*')
    .eq('paymentscheduleid', Number(paymentScheduleId))
    .order('paymentdate', { ascending: false });

  if (error) throw error;

  return { payments: payments ?? [] };
};

const handleFetchPaymentSummary = async (query: any) => {
  const { paymentScheduleId } = query;

  if (!paymentScheduleId) {
    throw new Error('PaymentScheduleId is required');
  }

  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from('paymentschedule')
    .select('totalamount')
    .eq('paymentscheduleid', Number(paymentScheduleId))
    .single();

  if (scheduleError || !schedule) {
    throw new Error('Payment schedule not found');
  }

  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from('payment')
    .select('amountpaid, paymentstatus')
    .eq('paymentscheduleid', Number(paymentScheduleId));

  if (paymentsError) throw paymentsError;

  const totalAmount = Number(schedule.totalamount);
  const totalPaid = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amountpaid ?? 0), 0);
  const totalConfirmed = (payments ?? [])
    .filter((p: any) => p.paymentstatus === 'Confirmed')
    .reduce((sum: number, p: any) => sum + Number(p.amountpaid ?? 0), 0);
  const remainingAmount = Math.max(0, totalAmount - totalConfirmed);

  return {
    summary: {
      totalAmount,
      totalPaid,
      totalConfirmed,
      remainingAmount,
      paymentCount: (payments ?? []).length,
    },
  };
};

// ============================================
// MAIN ROUTER
// ============================================

export default async function handler(req: any, res: any) {
  try {
    await requireAdminSession(req, res);

    const { resource, action } = req.query ?? {};

    // TRANSACTION ROUTES
    if (resource === 'transaction') {
      if (req.method === 'POST') {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const transaction = await handleCreateTransaction(payload);
        res.status(201).json({ transaction });
        return;
      }

      if (req.method === 'PATCH') {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const transaction = await handleUpdateTransaction(payload);
        res.status(200).json({ transaction });
        return;
      }

      if (req.method === 'GET') {
        const result = await handleFetchTransactions(req.query);
        res.status(200).json(result);
        return;
      }
    }

    // PAYMENT SCHEDULE ROUTES
    if (resource === 'schedule') {
      if (req.method === 'POST') {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const paymentSchedule = await handleCreatePaymentSchedule(payload);
        res.status(201).json({ paymentSchedule });
        return;
      }

      if (req.method === 'GET') {
        const result = await handleFetchPaymentSchedule(req.query);
        res.status(200).json(result);
        return;
      }
    }

    // PAYMENT ROUTES
    if (resource === 'payment') {
      if (req.method === 'POST') {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const payment = await handleRecordPayment(payload);
        res.status(201).json({ payment });
        return;
      }

      if (req.method === 'PATCH') {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const payment = await handleUpdatePayment(payload);
        res.status(200).json({ payment });
        return;
      }

      if (req.method === 'GET') {
        if (action === 'summary') {
          const result = await handleFetchPaymentSummary(req.query);
          res.status(200).json(result);
          return;
        }

        const result = await handleFetchPayments(req.query);
        res.status(200).json(result);
        return;
      }
    }

    res.status(400).json({ error: 'Invalid resource. Use: transaction, schedule, or payment' });
  } catch (error: any) {
    console.error('Sales API error:', error);
    res.status(500).json({ error: error?.message ?? 'Sales operation failed' });
  }
}
