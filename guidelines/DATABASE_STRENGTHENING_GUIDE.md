# Database Schema Additions & Strengthening Checklist

## Overview

The transaction and commission workflow implementation relies on proper database schema. This document outlines what needs to be in place and potential gaps to address.

## Critical Components Checklist

### 1. ✅ Required Tables

- [ ] **transaction** - Sales transactions
  - Columns: transactionid (PK), propertyid (FK, UNIQUE), buyerclientid (FK), negotiatedprice, transactionstatus, createdat, updatedat, completiondate
  - Constraints: CHECK negotiatedprice > 0, CHECK transactionstatus IN (Draft, Ongoing, Completed, Cancelled)
  - Unique Index: One active transaction per property (Draft/Ongoing)

- [ ] **paymentschedule** - Payment plans
  - Columns: paymentscheduleid (PK), transactionid (FK, UNIQUE), totalamount, installmentfrequency, installmentcount, startdate, createdat
  - Constraints: CHECK totalamount > 0, CHECK installmentcount >= 1
  - Purpose: Enforces one-per-transaction rule

- [ ] **payment** - Individual payments
  - Columns: paymentid (PK), paymentscheduleid (FK), paymentdate, amountpaid, paymentmethod, paymentstatus, transactionnotes, createdat
  - Constraints: CHECK amountpaid > 0, CHECK paymentstatus IN (Pending, Confirmed, Failed, Refunded)
  - Indexes: paymentscheduleid, (paymentscheduleid + paymentstatus) for confirmed payments

- [ ] **commission** - Commission records
  - Columns: commissionid (PK), transactionid (FK, UNIQUE), staffid (FK), commissionamount, commissionrate, commissionstatus, generatedat, releasedat
  - Constraints: CHECK commissionrate 0-1, CHECK commissionstatus IN (Pending, Released)
  - Purpose: Enforces one-per-transaction rule

- [ ] **commissionpayout** - Commission payouts
  - Columns: commissionpayoutid (PK), commissionid (FK), payoutamount, payoutdate, payoutmethod, payoutnotes, createdat
  - Constraints: CHECK payoutamount > 0

### 2. ⚠️ Missing Unique Constraints (Would Prevent Bugs)

```sql
-- One payment schedule per transaction
ALTER TABLE paymentschedule 
ADD CONSTRAINT unique_transaction_schedule UNIQUE(transactionid);

-- One commission per transaction
ALTER TABLE commission 
ADD CONSTRAINT unique_transaction_commission UNIQUE(transactionid);
```

**Why Important**: Prevents application logic bugs from creating duplicates

### 3. ⚠️ Missing Indexes (Would Improve Performance)

```sql
-- Fast lookups for active transactions
CREATE UNIQUE INDEX idx_active_transaction_per_property 
    ON transaction(propertyid) 
    WHERE transactionstatus IN ('Draft', 'Ongoing');

-- Fast lookups for confirmed payments (used in totals calculation)
CREATE INDEX idx_confirmed_payments 
    ON payment(paymentscheduleid, paymentstatus) 
    WHERE paymentstatus = 'Confirmed';

-- Fast lookups by status
CREATE INDEX idx_transaction_status ON transaction(transactionstatus);
CREATE INDEX idx_commission_status ON commission(commissionstatus);

-- Foreign key lookups
CREATE INDEX idx_commission_staffid ON commission(staffid);
CREATE INDEX idx_transaction_clientid ON transaction(buyerclientid);
```

**Performance Impact**: 
- Without indexes: O(n) scan for each validation/calculation
- With indexes: O(log n) lookup time

### 4. ⚠️ Missing Business Logic Constraints

These constraints ensure data consistency at the database level:

```sql
-- Payment schedule total must be sensible
ALTER TABLE paymentschedule 
ADD CONSTRAINT chk_installment_math 
CHECK ((totalamount / installmentcount) >= 0);

-- 2-way constraint: Completion date only set when Completed
ALTER TABLE transaction 
ADD CONSTRAINT chk_completion_only_when_completed 
CHECK ((transactionstatus = 'Completed' AND completiondate IS NOT NULL) 
    OR (transactionstatus != 'Completed' AND completiondate IS NULL));

-- Released date only set when Released
ALTER TABLE commission 
ADD CONSTRAINT chk_released_only_when_released 
CHECK ((commissionstatus = 'Released' AND releasedat IS NOT NULL) 
    OR (commissionstatus = 'Pending' AND releasedat IS NULL));

-- Payout validation
ALTER TABLE commission 
ADD CONSTRAINT chk_commission_rate 
CHECK (commissionrate >= 0 AND commissionrate <= 1);
```

**Why Important**: Database enforces business rules even if app has bugs

### 5. ⚠️ Missing Foreign Keys (Data Integrity)

```sql
-- Ensure references exist
ALTER TABLE transaction 
ADD CONSTRAINT fk_transaction_property 
FOREIGN KEY (propertyid) REFERENCES property(propertyid) ON DELETE RESTRICT;

ALTER TABLE transaction 
ADD CONSTRAINT fk_transaction_buyerclient 
FOREIGN KEY (buyerclientid) REFERENCES client(clientid) ON DELETE RESTRICT;

ALTER TABLE paymentschedule 
ADD CONSTRAINT fk_paymentschedule_transaction 
FOREIGN KEY (transactionid) REFERENCES transaction(transactionid) ON DELETE CASCADE;

ALTER TABLE payment 
ADD CONSTRAINT fk_payment_schedule 
FOREIGN KEY (paymentscheduleid) REFERENCES paymentschedule(paymentscheduleid) ON DELETE CASCADE;

ALTER TABLE commission 
ADD CONSTRAINT fk_commission_transaction 
FOREIGN KEY (transactionid) REFERENCES transaction(transactionid) ON DELETE CASCADE;

ALTER TABLE commission 
ADD CONSTRAINT fk_commission_staff 
FOREIGN KEY (staffid) REFERENCES staff(staffid) ON DELETE RESTRICT;

ALTER TABLE commissionpayout 
ADD CONSTRAINT fk_commissionpayout_commission 
FOREIGN KEY (commissionid) REFERENCES commission(commissionid) ON DELETE CASCADE;
```

**Cascade Delete Strategy**:
- DELETE RESTRICT: Prevent deletion of parent (property, client, staff) if child records exist
- DELETE CASCADE: Delete child records when parent is deleted (transaction → payment, commission → payout)

### 6. ⚠️ Row Level Security (RLS) Setup

If using Supabase RLS, add policies:

```sql
-- Enable RLS
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymentschedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissionpayout ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY admin_all ON transaction
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Staff can see their own commissions
CREATE POLICY staff_own_commissions ON commission
    FOR SELECT USING (
        staffid = (SELECT staffid FROM staff WHERE userid = auth.uid())
    );

-- Clients can see their own transactions (if needed)
CREATE POLICY client_own_transactions ON transaction
    FOR SELECT USING (
        buyerclientid = (SELECT clientid FROM client WHERE userid = auth.uid())
    );
```

**Note**: Server-side code (api/admin/sales.ts) uses supabaseAdmin with service_role key which bypasses RLS.

### 7. ⚠️ Missing Audit Triggers

Auto-update timestamps:

```sql
-- Function to update 'updatedat' column
CREATE OR REPLACE FUNCTION update_transaction_updatedat()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on transaction updates
CREATE TRIGGER transaction_update_timestamp
    BEFORE UPDATE ON transaction
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_updatedat();
```

**Why Important**: Automatically track when records were last modified

### 8. ⚠️ Column Defaults (Data Quality)

All tables should have sensible defaults:

```sql
-- Transaction
ALTER TABLE transaction 
ALTER COLUMN transactionstatus SET DEFAULT 'Draft';
ALTER TABLE transaction 
ALTER COLUMN createdat SET DEFAULT NOW();

-- Payment
ALTER TABLE payment 
ALTER COLUMN paymentstatus SET DEFAULT 'Confirmed';
ALTER TABLE payment 
ALTER COLUMN createdat SET DEFAULT NOW();

-- Commission
ALTER TABLE commission 
ALTER COLUMN commissionstatus SET DEFAULT 'Pending';
ALTER TABLE commission 
ALTER COLUMN generatedat SET DEFAULT NOW();

-- All tables need createdat
ALTER TABLE paymentschedule ALTER COLUMN createdat SET DEFAULT NOW();
ALTER TABLE commissionpayout ALTER COLUMN createdat SET DEFAULT NOW();
```

## Potential Runtime Issues Without These Additions

### ❌ Without Unique Constraints on Schedules/Commissions
- Bug in app could create 2+ schedules/commissions per transaction
- Payment calculations would sum from multiple schedules (wrong totals)
- Commission generation would create duplicates

### ❌ Without Indexes
- Each transaction lookup scans entire table
- Confirmation logic (sum payments) becomes slow with many records
- Active transaction validation (Draft/Ongoing) becomes O(n)
- Admin dashboard queries time out with thousands of records

### ❌ Without Foreign Keys
- Orphaned payment records if transaction is deleted elsewhere
- Commission for non-existent transaction
- Data becomes inconsistent

### ❌ Without Business Logic Constraints
- Application could insert invalid data (rate > 1.0, negative prices)
- Completion date set when status != Completed (data inconsistency)
- Malformed data bypasses app validation

### ❌ Without RLS
- Public exposure of sales data on Supabase dashboard
- Staff could query other staff's commissions
- Clients could see other clients' transactions

## Verification Steps

Run diagnostic queries from [DATABASE_DIAGNOSTIC_QUERIES.sql](DATABASE_DIAGNOSTIC_QUERIES.sql):

1. **Check table existence**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('transaction', 'paymentschedule', 'payment', 'commission', 'commissionpayout');
   ```

2. **Check constraints**
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE table_name IN ('transaction', 'paymentschedule', 'payment', 'commission', 'commissionpayout');
   ```

3. **Check indexes**
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename IN ('transaction', 'paymentschedule', 'payment', 'commission', 'commissionpayout');
   ```

4. **Check RLS enabled**
   ```sql
   SELECT * FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('transaction', 'paymentschedule', 'payment', 'commission', 'commissionpayout')
   AND rowsecurity = true;
   ```

## Recommended Implementation Order

1. ✅ **Verify tables exist** with correct columns (critical)
2. ✅ **Add missing foreign keys** (critical for data integrity)
3. ✅ **Add unique constraints** on paymentscheduleid and commissionid (high priority)
4. ✅ **Add CHECK constraints** for business rules (high priority)
5. ✅ **Add indexes** for performance (medium priority)
6. ✅ **Enable RLS and policies** for security (medium priority)
7. ✅ **Add triggers** for audit trails (low priority)

## Files Provided

1. **[DATABASE_DIAGNOSTIC_QUERIES.sql](DATABASE_DIAGNOSTIC_QUERIES.sql)** - Run these first to check current state
2. **[DATABASE_SCHEMA_SETUP.sql](DATABASE_SCHEMA_SETUP.sql)** - Full schema with all additions

## Next Steps

1. Run diagnostic queries to see what's missing
2. Run setup script to add missing components
3. Test with sample data flow:
   - Create transaction → Create schedule → Record 2-3 payments → Verify auto-completion
   - Create commission → Record payouts → Verify auto-release
4. Check logs in api/admin/sales.ts and api/admin/commissions.ts for validation errors
5. Monitor dashboard to ensure property status updates to "Sold"
