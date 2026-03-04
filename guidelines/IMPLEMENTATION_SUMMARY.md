# Implementation Summary: Role-Based Brokerage Workflow

## Completed Implementations

### ✅ 1. **Permission System** (`_utils/permissions.ts`)
- Defined role-based permission matrix (BROKER, AGENT, STAFF, ADMIN)
- Created permission validation functions:
  - `validateStaffPermission()` - Check if staff has specific permission
  - `validateAgentAssignment()` - Ensure only AGENT role can be assigned
  - `validateBrokerRole()` - Ensure BROKER role for approval operations
  - `validateStaffRole()` - Flexible role validation
  - `fetchStaffWithRole()` - Get staff with role information

### ✅ 2. **Activity Logging** (`_utils/activityLog.ts`)
- Audit trail system for tracking all operations
- Supports activity types:
  - property_approved, property_rejected
  - agent_assigned, inquiry_assigned
  - consultation_scheduled
  - transaction_created
  - commission_generated, payout_recorded
  - document_verified
  - staff_created, staff_updated, staff_deleted
- Functions:
  - `logActivity()` - Record operation with entity info
  - `getActivityLog()` - Get all actions on specific entity
  - `getStaffActivityLog()` - Get all actions by specific staff

### ✅ 3. **Personnel Management Enhanced** (`personnel.ts`)
**Added:**
- License number validation for agents (required field)
- PRC license validation for brokers (required field)
- Support for storing licenses in separate tables (agent_license, broker_license)
- Graceful fallback if license tables don't exist yet
- Activity logging for staff creation
- Status field (Active/Inactive) on creation
- Async license retrieval when fetching personnel

**Key Changes:**
```typescript
// Now requires:
- Agents: license_number field
- Brokers: prc_license field
- All: status field (defaults to Active)

// Returns license info in responses:
- Agent API includes license_number
- Broker API includes prc_license
```

### ✅ 4. **Inquiry Management Enhanced** (`inquiries.ts`)
**Added:**
- Agent assignment validation
  - Validates assigned staff has AGENT role
  - Checks staff member is active
  - Throws error if validation fails
- Activity logging for:
  - Agent assignments to inquiries
  - Inquiry status updates
  - Property listing status changes
- Error messages that clearly state what's wrong

**Key Changes:**
```typescript
// Agent assignment now validates:
- Staff member exists
- Staff member is active (isactive = true)
- Staff member has AGENT role
- If any check fails, operation rejected with reason

// All operations logged with:
- Who assigned the person (staffid = 0 placeholder, update with session)
- What was assigned (consultation, inquiry, property)
- Which entity (sourceId)
- When (createddat timestamp)
```

---

## What Was Already Implemented

✅ Commission generation and payout (commissions.ts)  
✅ Property management (properties.ts)  
✅ Basic consultation/inquiry tracking (inquiries.ts)  
✅ Admin session authentication (auth.ts)  
✅ Supabase database integration  
✅ Staff/Agent/Broker CRUD (frontend implementation in Agents.tsx)

---

## What Still Needs Implementation

⚠️ **Database Schema Updates:**
- [ ] Create `activitylog` table (or modify existing audit table)
- [ ] Create `agent_license` table (optional, for licensing tracking)
- [ ] Create `broker_license` table (optional, for PRC license tracking)
- [ ] Ensure `staffrole` table has AGENT, BROKER, STAFF roles

⚠️ **API Enhancements:**
- [ ] Extract sessionUserStaffId from session in APIs (currently hardcoded as 0)
- [ ] Add property approval endpoint with broker-only validation
- [ ] Add transaction creation endpoint with agent validation
- [ ] Add document verification endpoint with staff validation
- [ ] Add project-staff assignment validation

⚠️ **Frontend Updates:**
- [ ] Update Agents.tsx to handle license_number/prc_license in forms
- [ ] Add activity log viewer component
- [ ] Display staff position from staffrole instead of hard-coded
- [ ] Add validation messages when agent assignment fails

⚠️ **Commission Workflow:**
- [ ] Ensure commission generation uses correct agent from transaction
- [ ] Implement broker commission override logic (optional)
- [ ] Add commission payout tracking UI

⚠️ **Permission Checks in APIs:**
- [ ] Wrap property approval with broker validation
- [ ] Wrap transaction creation with agent validation
- [ ] Wrap document verification with staff validation
- [ ] Wrap inquiry assignment with permission check

---

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `api/admin/_utils/permissions.ts` | NEW | Permission system |
| `api/admin/_utils/activityLog.ts` | NEW | Audit logging |
| `api/admin/personnel.ts` | UPDATED | Added license validation, activity logs |
| `api/admin/inquiries.ts` | UPDATED | Added agent assignment validation |
| `guidelines/ROLE_WORKFLOW_IMPLEMENTATION.md` | NEW | Complete documentation |

---

## How to Deploy & Test

### 1. **Verify Database Tables Exist**
```sql
-- Check if staffrole table has required roles
SELECT * FROM staffrole WHERE rolecode IN ('AGENT', 'BROKER', 'STAFF');

-- If missing, seedroles:
INSERT INTO staffrole (rolecode, rolename, roledescription)
VALUES 
  ('AGENT', 'Agent', 'Real estate agent'),
  ('BROKER', 'Broker', 'Real estate broker'),
  ('STAFF', 'Staff', 'Administrative staff')
ON CONFLICT (rolecode) DO NOTHING;
```

### 2. **Create Activity Log Table (Optional)**
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

### 3. **Create License Tables (Optional)**
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

### 4. **Test Agent Assignment Validation**
```typescript
// Try assigning a non-agent staff member to inquiry:
// Should fail with: "Staff member must be an AGENT, but has role: STAFF"

// Try assigning inactive agent:
// Should fail with: "Staff member is inactive"

// Try assigning valid agent:
// Should succeed and log activity
```

### 5. **Commit & Push**
```bash
git add -A
git commit -m "feat: implement role-based permission system and activity logging

- Add permissions.ts with role-based permission checks
- Add activityLog.ts for audit trail tracking
- Enhance personnel.ts with license field validation
- Add agent assignment validation in inquiries.ts
- Create comprehensive role workflow documentation
- Implement soft deletion and status tracking"
git push
```

---

## API Changes for Frontend

### Personnel.ts - Create Agent/Broker
**Old:**
```typescript
POST /api/admin/personnel?type=agent
{ name, email, contact_number }
```

**New:**
```typescript
POST /api/admin/personnel?type=agent
{ name, email, contact_number, license_number, status }

POST /api/admin/personnel?type=broker
{ name, email, contact_number, prc_license, status }
```

### Inquiries.ts - Assign Agent
**Now Validated:**
- Staff must have AGENT role
- Staff must be active (isactive = true)
- Returns error if validation fails

---

## Notes for Future Work

1. **Session User Integration**: Replace hardcoded `staffid: 0` in activity logs with actual session user ID
2. **Broker Oversight**: Add logic to track broker supervision of transactions
3. **Project Staff Assignments**: Validate agents assigned to inquiries are assigned to projects
4. **Commission Calculations**: Ensure commission rate aligns with role and broker override rules
5. **Audit Dashboard**: Create UI to view activity logs per entity or staff member

