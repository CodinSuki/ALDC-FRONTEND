# ALDC Real Estate Brokerage - Implementation Guide

## Business Context

This is a **real estate brokerage platform**, not a public marketplace. The system enforces structured workflows based on **three operational roles**:

- **Broker** - Oversees operations, approves listings, supervises transactions
- **Agent** - Handles client inquiries, consultations, transactions
- **Administrative Staff** - Verifies documents, reviews submissions, assigns agents

---

## Role-Based Permissions

### **BROKER**
- ✅ Approve property listings (PendingReview → Available)
- ✅ Reject property listings with reason
- ✅ Supervise transactions
- ✅ View all commissions
- ✅ Manage staff members
- ✅ Manage agents

### **AGENT**  
- ✅ Handle property inquiries
- ✅ Schedule consultations
- ✅ Create transactions
- ✅ View own commissions
- ✅ Respond to property inquiries

### **ADMINISTRATIVE STAFF**
- ✅ Verify property documents
- ✅ Manage listing review process
- ✅ Assign agents to inquiries
- ✅ Manage seller submissions

### **ADMIN** (System Administrator)
- ✅ Full access to all operations

---

## Business Workflows

### **1. Property Listing Workflow**

```
Seller Upload Property
    ↓
[Staff] Verifies Documents
    ↓
Property Status: PendingReview
    ↓
[Broker] Reviews & Approves
    ↓
Property Status: Available
    ↓
Publicly Visible
```

**Implementation:**
- `properties.ts`: Manages property listings and status transitions
- `permissions.ts`: Enforces broker-only approval
- `activityLog.ts`: Tracks who approved and when

**Key Validations:**
- Only BROKER role can approve listings
- Broker must be active (isactive = true)
- Property must be in PendingReview status before approval

### **2. Property Inquiry Management**

```
Buyer Submits Inquiry
    ↓
[System] Creates propertyinquiry record
    ↓
[Staff] Assigns Agent to Inquiry
    ↓
Inquiry Status: Assigned
    ↓
[Agent] Responds to Buyer
    ↓
[Agent] Schedules Consultation
    ↓
Consultation Status: Scheduled
```

**Implementation:**
- `inquiries.ts`: Manages inquiries, consultations, and assignments
- `permissions.ts`: Validates agent assignment (must be AGENT role)
- `activityLog.ts`: Logs who was assigned and when

**Key Validations:**
- Only staff member can assign agents (handled by auth)
- Assigned staff must have AGENT role
- Agent must be active (isactive = true)
- Cannot assign to brokers or non-agent staff

### **3. Consultation & Site Visit Workflow**

```
[Agent] Schedules Consultation
    ↓
Consultation Status: Pending
    ↓
[Agent] Confirms with Client
    ↓
Consultation Status: Confirmed
    ↓
[Agent] Completes Site Visit
    ↓
Consultation Status: Completed
    ↓
[Agent] Creates Transaction
```

**Database Relations:**
- `consultationrequest` - tracks appointments
  - `assignedstaffid` → references `staff.staffid`
  - `clientid` → references `client.clientid`
  - `propertyid` → references `property.propertyid`
  - `consultationstatus` - Pending, Confirmed, Completed, Cancelled
  - `scheduledat` - appointment date/time

**Key Validations:**
- Only assigned agent can update consultation status
- Agent must be active
- Cannot complete consultation multiple times

### **4. Transaction & Commission Workflow**

```
[Agent] Creates Transaction
    ↓
Transaction Status: Pending
    ↓
[Agent] Negotiates Terms
    ↓
Transaction Status: Negotiation
    ↓
[Broker] Supervises
    ↓
Transaction Status: Completed
    ↓
[System] Generates Commission
    ↓
Commission Status: Generated
    ↓
[Agent/Broker] Receives Commission
    ↓
Commission Status: Released
```

**Database Relations:**
- `transaction`
  - `assignedagentid` → references `staff.staffid` (AGENT role)
  - `transactionstatus` - Pending, Negotiation, Completed, Failed
  - `negotiatedprice` - final agreed price

- `commission`
  - `transactionid` → references `transaction.transactionid`
  - `staffid` → references `staff.staffid` (the agent who closed the sale)
  - `commissionamount` - calculated from negotiatedprice * rate
  - `commissionstatus` - Generated, Released

- `commissionpayout`
  - `commissionid` → references `commission.commissionid`
  - `payoutamount` - portion of commission paid
  - `payoutmethod` - Bank Transfer, Check, etc.
  - `payoutdate` - when payout was sent

**Commission Rules (from commissions.ts):**
- Commission only generated when transaction status = "Completed"
- Commission tied to agent (staffid) who handled the transaction
- No duplicate commissions per transaction
- Commission released when total payouts ≥ commission amount
- Broker may receive percentage override (optional)

**Key Validations:**
- Transaction must reference an AGENT
- Only one commission per transaction
- Commission cannot be generated for incomplete transactions
- Agent must still be active when transaction completes

### **5. Staff Management**

**Agent Creation/Update:**
- ✅ Name, Email, Contact Number (required)
- ✅ License Number (required)
- ✅ Status (Active/Inactive)

**Broker Creation/Update:**
- ✅ Name, Email, Contact Number (required)
- ✅ PRC License (required)
- ✅ Status (Active/Inactive)

**Administrative Staff:**
- ✅ Name, Email, Contact Number (required)
- ✅ Position (from staffrole.rolename)

**Implementation:**
- `personnel.ts`: Handles CRUD for all role types
- Validates required fields per role
- Stores license info in separate tables (if available)
- Soft deletes via `isactive = false` flag
- Activity logging on create/update/delete

---

## Database Schema Requirements

### **Core Tables**
```sql
-- Staff with role assignment
staff (
  staffid SERIAL PRIMARY KEY,
  firstname VARCHAR,
  middlename VARCHAR,
  lastname VARCHAR,
  emailaddress VARCHAR UNIQUE,
  contactnumber VARCHAR,
  staffroleid INT REFERENCES staffrole(staffroleid),
  isactive BOOLEAN DEFAULT true,
  createdat TIMESTAMP DEFAULT NOW(),
  updatedat TIMESTAMP DEFAULT NOW()
);

-- Available roles
staffrole (
  staffroleid SERIAL PRIMARY KEY,
  rolecode VARCHAR UNIQUE ('AGENT', 'BROKER', 'STAFF', 'ADMIN'),
  rolename VARCHAR,
  roledescription TEXT,
  isactive BOOLEAN DEFAULT true
);

-- License information (optional separate tables)
agent_license (
  agentlicenseid SERIAL PRIMARY KEY,
  staffid INT REFERENCES staff(staffid),
  licensenumber VARCHAR,
  createdat TIMESTAMP DEFAULT NOW()
);

broker_license (
  brokerlicenseid SERIAL PRIMARY KEY,
  staffid INT REFERENCES staff(staffid),
  prclicense VARCHAR,
  createdat TIMESTAMP DEFAULT NOW()
);

-- Activity audit trail (optional but recommended)
activitylog (
  activityid SERIAL PRIMARY KEY,
  staffid INT REFERENCES staff(staffid),
  activitytype VARCHAR,
  entitytype VARCHAR,
  entityid INT,
  description TEXT,
  createddat TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### **Personnel Management**
```
GET    /api/admin/personnel?type=agent|broker|staff     - List by role
POST   /api/admin/personnel?type=agent|broker|staff     - Create (requires license)
PATCH  /api/admin/personnel?id=X                        - Update
DELETE /api/admin/personnel?id=X                        - Soft delete
```

### **Inquiries & Consultations**
```
GET    /api/admin/inquiries                             - List all inquiries
PATCH  /api/admin/inquiries                             - Assign agent (validates AGENT role)
```

### **Properties**
```
GET    /api/admin/properties                            - List all properties
PATCH  /api/admin/properties                            - Update status (brokers only)
```

### **Commissions**
```
POST   /api/admin/commissions/generate                  - Generate commission (validated)
POST   /api/admin/commissions/payout                    - Record payout
```

---

## Error Handling & Validation

### **Invalid Agent Assignment**
```
✗ Cannot assign non-AGENT staff to inquiry
✗ Cannot assign inactive staff
✗ Cannot reassign if agent is inactive at transaction time
```

### **Invalid Commission Generation**
```
✗ Cannot generate commission if transaction not Completed
✗ Cannot generate duplicate commission for same transaction
✗ Cannot payout more than commission total
```

### **Invalid Property Approval**
```
✗ Only BROKER role can approve
✗ Broker must be active
✗ Property must be PendingReview status
```

---

## Frontend Integration (Agents.tsx)

The personnel management UI enforces these rules:

1. **Agent Tab** - Only shows staff with AGENT role
2. **Broker Tab** - Only shows staff with BROKER role  
3. **Staff Tab** - Only shows staff with STAFF role or no special role
4. **Create Agent** - Requires license number
5. **Create Broker** - Requires PRC license
6. **Create Staff** - Requires position (from staffrole)
7. **Status Filter** - Active/Inactive toggle
8. **Soft Deletes** - Sets isactive = false instead of removing

---

## Activity Tracking

All operations logged with:
- **staffid** - Who performed the action
- **activitytype** - What happened (agent_assigned, property_approved, etc.)
- **entitytype** - What was affected (property, inquiry, consultation, etc.)
- **entityid** - ID of affected entity
- **timestamp** - When it happened

Enables:
- Audit trails for compliance
- Agent performance tracking
- Commission verification
- Dispute resolution

---

## Recommended Next Steps

1. **Create Activity Log Table** (if not exists)
   ```sql
   CREATE TABLE IF NOT EXISTS activitylog (
     activityid SERIAL PRIMARY KEY,
     staffid INT REFERENCES staff(staffid),
     activitytype VARCHAR NOT NULL,
     entitytype VARCHAR NOT NULL,
     entityid INT NOT NULL,
     description TEXT,
     createddat TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Create License Tables** (if not exists)
   ```sql
   CREATE TABLE IF NOT EXISTS agent_license (
     agentlicenseid SERIAL PRIMARY KEY,
     staffid INT UNIQUE REFERENCES staff(staffid),
     licensenumber VARCHAR NOT NULL,
     createdat TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE IF NOT EXISTS broker_license (
     brokerlicenseid SERIAL PRIMARY KEY,
     staffid INT UNIQUE REFERENCES staff(staffid),
     prclicense VARCHAR NOT NULL,
     createdat TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Ensure Roles Exist**
   ```sql
   INSERT INTO staffrole (rolecode, rolename, roledescription)
   VALUES 
     ('AGENT', 'Real Estate Agent', 'Handles client inquiries and transactions'),
     ('BROKER', 'Broker', 'Supervises agents and approves operations'),
     ('STAFF', 'Administrative Staff', 'Verifies documents and assigns agents'),
     ('ADMIN', 'Administrator', 'System administrator with full access')
   ON CONFLICT (rolecode) DO NOTHING;
   ```

4. **Update Frontend Types** - Ensure TypeScript types match database schema

5. **Add Activity Log Viewer** (optional) - UI to view audit trails per entity or staff

---

## Testing Checklist

- [ ] Only AGENT role can be assigned to inquiries
- [ ] Only BROKER role can approve property listings
- [ ] Only STAFF role can verify documents
- [ ] Inactive staff cannot perform any operations
- [ ] Commissions only generate for completed transactions
- [ ] License fields required when creating agents/brokers
- [ ] Activity log entries created for all operations
- [ ] Soft deletes work (isactive = false, not removed)
- [ ] Role filtering works correctly (agents/brokers/staff tabs)

