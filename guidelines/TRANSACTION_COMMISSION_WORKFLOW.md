# Transaction and Commission Workflow Documentation

## Overview

This document describes the complete transaction and commission business workflow for ALDC real estate brokerage system. The implementation enforces real brokerage business logic with proper validation, status flows, and security controls.

## Architecture

### Service Layer (Frontend)
- `src/app/services/transactionService.ts` - Transaction management
- `src/app/services/paymentService.ts` - Payment schedules and payments
- `src/app/services/commissionService.ts` - Commission generation and payouts

### API Layer (Backend)
- `api/admin/sales.ts` - Transaction and payment management (consolidated)
- `api/admin/commissions.ts` - Commission generation and payout management

## Database Tables

- `transaction` - Sales transactions
- `paymentschedule` - Payment plans for transactions
- `payment` - Individual payment records
- `commission` - Commission records for completed transactions
- `commissionpayout` - Commission payout records to staff
- `property` - Property listings
- `client` - Buyer/seller clients
- `staff` - Staff members

## Business Workflows

### 1. Transaction Creation

**Trigger**: Client expresses interest → Negotiation successful → Admin confirms sale

**Process**:
```typescript
// Service layer call
const transaction = await createTransaction({
  propertyId: 123,
  buyerClientId: 456,
  negotiatedPrice: 5000000,
  transactionStatus: 'Draft' // Optional, defaults to 'Draft'
});
```

**Validations**:
- ✅ PropertyId and BuyerClientId must exist
- ✅ NegotiatedPrice must be > 0
- ✅ Only ONE active transaction (Draft/Ongoing) per property
- ❌ Prevents duplicate transactions for same property

**API Endpoint**: `POST /api/admin/transactions`

**Status**: Created with `Draft` status

---

### 2. Payment Schedule Creation

**Trigger**: Transaction exists → Admin sets up payment plan

**Process**:
```typescript
// Create payment schedule
const schedule = await createPaymentSchedule({
  transactionId: 789,
  totalAmount: 5000000,
  installmentFrequency: 'Monthly',
  installmentCount: 24,
  startDate: '2026-04-01'
});
```

**Validations**:
- ✅ Transaction must exist
- ✅ Only ONE payment schedule per transaction
- ✅ TotalAmount must be > 0
- ✅ InstallmentCount must be ≥ 1

**API Endpoint**: `POST /api/admin/payments?resource=schedule`

**Business Rule**: Each transaction has exactly one payment schedule (enforced by unique constraint on TransactionId)

---

### 3. Payment Recording

**Trigger**: Buyer makes payment → Admin records it

**Process**:
```typescript
// Record a payment
const payment = await recordPayment({
  paymentScheduleId: 101,
  paymentDate: '2026-03-04',
  amountPaid: 208333.33,
  paymentMethod: 'Bank Transfer',
  paymentStatus: 'Confirmed', // Optional, defaults to 'Confirmed'
  transactionNotes: 'First installment'
});
```

**Validations**:
- ✅ PaymentScheduleId must exist
- ✅ AmountPaid must be > 0
- ✅ PaymentDate is required

**Automatic Actions**:
- ✅ Calculates total confirmed payments
- ✅ If total confirmed payments ≥ TotalAmount:
  - Updates transaction status to `Completed`
  - Sets completion date
  - Updates property listing status to `Sold` (SLD)

**API Endpoint**: `POST /api/admin/payments`

**Payment Status Flow**: `Pending` → `Confirmed` | `Failed` | `Refunded`

---

### 4. Commission Generation

**Trigger**: Transaction status becomes `Completed`

**Process**:
```typescript
// Generate commission (manual or triggered)
const commission = await generateCommission({
  transactionId: 789,
  staffId: 12,
  commissionRate: 0.03 // 3%
});
```

**Validations**:
- ✅ Transaction must be `Completed`
- ✅ Only ONE commission per transaction
- ✅ CommissionRate must be 0-1 (e.g., 0.03 = 3%)
- ✅ Staff member must exist

**Calculations**:
- `CommissionAmount = NegotiatedPrice × CommissionRate`

**API Endpoint**: `POST /api/admin/commissions`

**Status**: Created with `Pending` status

---

### 5. Commission Payout

**Trigger**: Admin releases commission to staff

**Process**:
```typescript
// Record payout (can be partial)
const payout = await recordCommissionPayout({
  commissionId: 201,
  payoutAmount: 75000,
  payoutDate: '2026-03-15',
  payoutMethod: 'Bank Transfer',
  payoutNotes: 'Partial payout - 50%'
});
```

**Validations**:
- ✅ CommissionId must exist
- ✅ PayoutAmount must be > 0
- ✅ PayoutAmount cannot exceed remaining commission
- ✅ Multiple payouts allowed per commission

**Automatic Actions**:
- ✅ Calculates total payouts
- ✅ If total payouts ≥ CommissionAmount:
  - Updates commission status to `Released`
  - Sets released date

**API Endpoint**: `POST /api/admin/commissions?resource=payout`

**Commission Status Flow**: `Pending` → `Released`

---

## Status Flows

### Transaction Lifecycle
```
Draft → Ongoing → Completed
  ↓
Cancelled
```

### Commission Lifecycle
```
Pending → Released
```

### Property Listing Lifecycle
```
Available → Reserved → Sold
```

## Validation Rules Summary

| Rule | Enforcement |
|------|-------------|
| One active transaction per property | ✅ API validates before insert |
| One payment schedule per transaction | ✅ API validates before insert |
| One commission per transaction | ✅ API validates before insert |
| Commission only for Completed transactions | ✅ API validates transaction status |
| Payouts cannot exceed commission amount | ✅ API validates sum of payouts |
| Auto-complete transaction when fully paid | ✅ Triggered after payment insert |
| Auto-release commission when fully paid out | ✅ Triggered after payout insert |
| Auto-update property to Sold when completed | ✅ Triggered on transaction completion |

## API Endpoints Reference

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/sales?resource=transaction` | Create transaction |
| PATCH | `/api/admin/sales?resource=transaction` | Update transaction (status, price) |
| GET | `/api/admin/sales?resource=transaction&id={id}` | Get transaction by ID |
| GET | `/api/admin/sales?resource=transaction&propertyId={id}` | Get transactions for property |
| GET | `/api/admin/sales?resource=transaction&buyerClientId={id}` | Get transactions for buyer |
| GET | `/api/admin/sales?resource=transaction&status={status}` | Get transactions by status |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/sales?resource=schedule` | Create payment schedule |
| GET | `/api/admin/sales?resource=schedule&transactionId={id}` | Get payment schedule |
| POST | `/api/admin/sales?resource=payment` | Record payment |
| PATCH | `/api/admin/sales?resource=payment` | Update payment status |
| GET | `/api/admin/sales?resource=payment&paymentScheduleId={id}` | Get payments for schedule |
| GET | `/api/admin/sales?resource=payment&action=summary&paymentScheduleId={id}` | Get payment summary |

### Commissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/commissions` | Generate commission |
| GET | `/api/admin/commissions?id={id}` | Get commission by ID |
| GET | `/api/admin/commissions?transactionId={id}` | Get commission for transaction |
| GET | `/api/admin/commissions?staffId={id}` | Get commissions for staff |
| GET | `/api/admin/commissions?status={status}` | Get commissions by status |
| POST | `/api/admin/commissions?resource=payout` | Record commission payout |
| GET | `/api/admin/commissions?resource=payout&commissionId={id}` | Get payouts for commission |
| GET | `/api/admin/commissions?resource=summary&commissionId={id}` | Get commission summary |
| GET | `/api/admin/commissions?resource=report&staffId={id}` | Get staff commission report |

## Security

All endpoints require admin session authentication via:
```typescript
await requireAdminSession(req, res);
```

Only authenticated admin users can:
- Create transactions
- Record payments
- Generate commissions
- Record commission payouts

## Error Handling

All endpoints return consistent error responses:

```typescript
// Success (201 Created)
{ transaction: {...} }

// Error (400 Bad Request)
{ error: "PropertyId, BuyerClientId, and NegotiatedPrice are required" }

// Error (404 Not Found)
{ error: "Transaction not found" }

// Error (500 Internal Server Error)
{ error: "Transaction operation failed" }
```

## Usage Examples

### Complete Workflow Example

```typescript
// 1. Create transaction
const transaction = await createTransaction({
  propertyId: 100,
  buyerClientId: 200,
  negotiatedPrice: 3000000
});
// Result: Transaction in "Draft" status

// 2. Create payment schedule
const schedule = await createPaymentSchedule({
  transactionId: transaction.transactionid,
  totalAmount: 3000000,
  installmentFrequency: 'Monthly',
  installmentCount: 12,
  startDate: '2026-04-01'
});

// 3. Update transaction to Ongoing
await updateTransactionStatus({
  transactionId: transaction.transactionid,
  transactionStatus: 'Ongoing'
});

// 4. Record payments (repeat as buyer pays)
await recordPayment({
  paymentScheduleId: schedule.paymentscheduleid,
  paymentDate: '2026-04-01',
  amountPaid: 250000,
  paymentMethod: 'Bank Transfer'
});

// ... more payments ...

// When total payments reach 3,000,000:
// - Transaction automatically becomes "Completed"
// - Property automatically becomes "Sold"

// 5. Generate commission
const commission = await generateCommission({
  transactionId: transaction.transactionid,
  staffId: 15,
  commissionRate: 0.03 // 3% = 90,000
});

// 6. Record commission payout
await recordCommissionPayout({
  commissionId: commission.commissionid,
  payoutAmount: 90000,
  payoutDate: '2026-03-20',
  payoutMethod: 'Bank Transfer'
});

// Commission automatically becomes "Released"
```

### Query Current State

```typescript
// Get payment summary
const summary = await fetchPaymentSummary(schedule.paymentscheduleid);
// Returns: { totalAmount, totalPaid, totalConfirmed, remainingAmount, paymentCount }

// Get commission summary
const commSummary = await fetchCommissionSummary(commission.commissionid);
// Returns: { commissionAmount, totalPaidOut, remainingAmount, payoutCount, status }

// Get staff commission report
const report = await fetchStaffCommissionReport(15, {
  startDate: '2026-01-01',
  endDate: '2026-12-31'
});
// Returns: { totalCommissions, totalReleased, totalPending, commissionCount, commissions[] }
```

## Database Constraints Recommendations

For additional data integrity, consider adding these database constraints:

```sql
-- Ensure one active transaction per property
CREATE UNIQUE INDEX idx_unique_active_transaction 
ON transaction(propertyid) 
WHERE transactionstatus IN ('Draft', 'Ongoing');

-- Ensure one payment schedule per transaction
ALTER TABLE paymentschedule 
ADD CONSTRAINT unique_transaction_schedule 
UNIQUE(transactionid);

-- Ensure one commission per transaction
ALTER TABLE commission 
ADD CONSTRAINT unique_transaction_commission 
UNIQUE(transactionid);

-- Ensure commission rate is between 0 and 1
ALTER TABLE commission 
ADD CONSTRAINT check_commission_rate 
CHECK (commissionrate >= 0 AND commissionrate <= 1);

-- Ensure amounts are positive
ALTER TABLE transaction 
ADD CONSTRAINT check_negotiated_price 
CHECK (negotiatedprice > 0);

ALTER TABLE paymentschedule 
ADD CONSTRAINT check_total_amount 
CHECK (totalamount > 0);

ALTER TABLE payment 
ADD CONSTRAINT check_amount_paid 
CHECK (amountpaid > 0);

ALTER TABLE commissionpayout 
ADD CONSTRAINT check_payout_amount 
CHECK (payoutamount > 0);
```

## Migration Checklist

- [x] Service layer functions created
- [x] API endpoints implemented (consolidated under `/api/admin/sales` and `/api/admin/commissions`)
- [x] Business logic validation
- [x] Status flow automation
- [x] Error handling
- [x] Security authentication
- [x] Vercel function limit optimization (12 of 12 functions)
- [ ] Database constraints applied (optional)
- [ ] Admin UI components created
- [ ] Testing completed
- [ ] Documentation reviewed

## Implementation Notes

### Vercel Function Limit Optimization

To stay within the Vercel Hobby plan limit of 12 functions, the transaction and payment functionality has been consolidated into a single endpoint at `/api/admin/sales`. This endpoint handles:

- **Transactions** (`?resource=transaction`) - Create, update, fetch transactions
- **Payment Schedules** (`?resource=schedule`) - Create and fetch payment schedules  
- **Payments** (`?resource=payment`) - Record payments, update status, fetch payment history

The commission functionality remains separate at `/api/admin/commissions` due to its distinct business logic.

**Current function count**: 12 of 12
1. api/public.ts
2. api/chat.ts
3. api/admin/auth.ts
4. api/admin/clients.ts
5. api/admin/commissions.ts
6. api/admin/dashboard.ts
7. api/admin/inquiries.ts
8. api/admin/projects.ts
9. api/admin/properties.ts
10. api/admin/sales.ts (consolidated transactions + payments)
11. api/admin/seller-submissions.ts
12. api/admin/staff.ts

## Support

For questions or issues, refer to:
- Service layer: `src/app/services/`
- API endpoints: `api/admin/`
- Business rules: This documentation
