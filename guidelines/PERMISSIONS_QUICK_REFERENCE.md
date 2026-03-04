# Quick Reference: Role-Based Permission System

## Role Definitions

| Role | Permissions | Key Operations |
|------|-------------|-----------------|
| **BROKER** | approve_property_listing, reject_property_listing, supervise_transaction, view_all_commissions, manage_staff, manage_agents | Approve listings, oversee transactions, manage commissions |
| **AGENT** | handle_inquiry, schedule_consultation, create_transaction, view_own_commissions, respond_to_inquiry | Handle buyer inquiries, schedule site visits, close sales |
| **STAFF** | verify_documents, manage_listing_review_process, assign_agent_to_inquiry, manage_seller_submissions | Verify documents, manage listings, assign agents |
| **ADMIN** | All permissions | Full system access |

---

## Common Validation Patterns

### 1. **Validate Agent Assignment to Inquiry**
```typescript
import { validateAgentAssignment } from './_utils/permissions.js';

// In your API handler:
const staffId = req.body.assignedStaffId;
const validation = await validateAgentAssignment(staffId);

if (!validation.valid) {
  return res.status(400).json({ error: validation.reason });
}

// Now safe to assign this staff to inquiry
```

**Expected Outcomes:**
- ✅ Valid: Staff exists, is active, has AGENT role
- ❌ Invalid: Staff not found / Staff is inactive / Staff is not an AGENT

---

### 2. **Validate Broker Role for Approval**
```typescript
import { validateBrokerRole } from './_utils/permissions.js';

// In your property approval endpoint:
const brokerId = req.body.brokerApproving;
const validation = await validateBrokerRole(brokerId);

if (!validation.valid) {
  return res.status(403).json({ error: validation.reason });
}

// Now safe to approve property
```

**Expected Outcomes:**
- ✅ Valid: Staff exists and has BROKER role
- ❌ Invalid: Staff not found / Staff is not a BROKER

---

### 3. **Validate Permission for Operation**
```typescript
import { validateStaffPermission } from './_utils/permissions.js';

// In any operation requiring specific permission:
const staffId = req.session.staffId;
const permission = 'approve_property_listing';
const validation = await validateStaffPermission(staffId, permission);

if (!validation.valid) {
  return res.status(403).json({ error: validation.reason });
}

// Proceed with operation
```

**Example Permissions to Check:**
- `approve_property_listing` - Only brokers
- `handle_inquiry` - Only agents
- `verify_documents` - Only staff
- `manage_staff` - Only brokers/admins

---

### 4. **Log Activity for Audit Trail**
```typescript
import { logActivity } from './_utils/activityLog.js';

// After any operation:
await logActivity({
  staffid: sessionUser.staffId,
  activitytype: 'agent_assigned',
  entitytype: 'propertyinquiry',
  entityid: inquiryId,
  description: `Assigned agent ${agentName} to inquiry`,
});
```

**Entity Types & Activity Types:**
| Entity Type | Activity Types |
|-------------|----------------|
| `property` | property_approved, property_rejected |
| `propertyinquiry` | inquiry_created, inquiry_assigned |
| `consultation` | consultation_scheduled |
| `transaction` | transaction_created |
| `commission` | commission_generated, payout_recorded |
| `staff` | staff_created, staff_updated, staff_deleted |

---

## Real-World Examples

### **Example 1: Assign Agent to Inquiry**

User: Admin Staff  
Action: Click "Assign Agent" on inquiry  
Backend: `PATCH /api/admin/inquiries`

```typescript
// Incoming request
{
  source: "Buyer Inquiry",
  sourceId: "123",
  assignedStaffId: 5,  // Staff member with AGENT role
  status: "Assigned"
}

// Backend validation
const validation = await validateAgentAssignment(5);
// Returns: { valid: true }

// Log activity
await logActivity({
  staffid: currentUser.staffId,  // The staff member doing the assigning
  activitytype: 'agent_assigned',
  entitytype: 'propertyinquiry',
  entityid: 123,
  description: 'Assigned agent Jane Smith to inquiry'
});

// Response
{ success: true, assignedAgent: "Jane Smith" }
```

---

### **Example 2: Try to Assign Non-Agent (FAILS)**

User: Admin Staff  
Action: Try to assign a receptionist to inquiry  
Backend: `PATCH /api/admin/inquiries`

```typescript
// Incoming request
{
  source: "Buyer Inquiry",
  sourceId: "123",
  assignedStaffId: 8,  // Staff member with STAFF role
  status: "Assigned"
}

// Backend validation
const validation = await validateAgentAssignment(8);
// Returns: { 
//   valid: false, 
//   reason: "Staff member must be an AGENT, but has role: STAFF" 
// }

// Response
{ error: "Cannot assign staff: Staff member must be an AGENT, but has role: STAFF" }
```

---

### **Example 3: Create New Agent**

User: Broker  
Action: Create new agent  
Endpoint: `POST /api/admin/personnel?type=agent`

```typescript
// Frontend sends
{
  name: "John Smith",
  email: "john@company.com",
  contact_number: "555-1234",
  license_number: "RES-123456",  // REQUIRED for agents
  status: "Active"
}

// Backend
- Parses name into firstname, middlename, lastname
- Looks up AGENT role from staffrole table
- Creates staff record with staffroleid pointing to AGENT role
- Stores license_number in agent_license table (if exists)
- Logs: "Created AGENT John Smith" activity
- Returns created staff object

// Response
{
  item: {
    staffid: 42,
    firstname: "John",
    lastname: "Smith",
    emailaddress: "john@company.com",
    contactnumber: "555-1234",
    staffroleid: 2,  // AGENT role
    isactive: true,
    ...
  }
}
```

---

### **Example 4: Approve Property Listing**

User: Broker  
Action: Approve pending property  
Endpoint: `PATCH /api/admin/properties` or custom approval endpoint

```typescript
// Incoming request
{
  propertyid: 99,
  approvingBrokerId: 3,
  status: "Available"
}

// Backend validation
const validation = await validateBrokerRole(3);
// Returns: { valid: true }

// Update property
- Set propertylistingstatusid to "Available"
- Set approvedby = approvedate = timestamp

// Log activity
await logActivity({
  staffid: 3,  // The broker
  activitytype: 'property_approved',
  entitytype: 'property',
  entityid: 99,
  description: 'Approved property listing'
});

// Response
{ success: true, propertyId: 99, status: "Available" }
```

---

## Where to Apply Validations

| API Endpoint | Validation | Function |
|--------------|-----------|----------|
| POST /personnel (agents) | License required | Built-in |
| POST /personnel (brokers) | PRC License required | Built-in |
| PATCH /inquiries (assign) | Must be AGENT | `validateAgentAssignment()` |
| PATCH /properties (approve) | Must be BROKER | `validateBrokerRole()` |
| POST /consultations | Only AGENT can create | `validateStaffPermission()` |
| PATCH /transactions (complete) | Only BROKER can supervise | `validateStaffPermission()` |
| POST /commissions | Transaction must be Completed | See commissions.ts |

---

## Testing Checklist

```bash
# Test 1: Create agent without license
curl -X POST /api/admin/personnel?type=agent \
  -d '{"name":"Test","email":"test@test.com"}'
# Expected: 400 error about license required

# Test 2: Assign inactive agent to inquiry
curl -X PATCH /api/admin/inquiries \
  -d '{"assignedStaffId":5}'
# Expected: 400 error about staff inactive

# Test 3: Assign non-agent to inquiry
curl -X PATCH /api/admin/inquiries \
  -d '{"assignedStaffId":10}'  # Staff with STAFF role
# Expected: 400 error about must be AGENT

# Test 4: Successful agent assignment
curl -X PATCH /api/admin/inquiries \
  -d '{"assignedStaffId":3}'  # Active agent
# Expected: 200 success

# Test 5: Verify activity logged
SELECT * FROM activitylog WHERE entitytype='propertyinquiry' ORDER BY createddat DESC;
# Expected: Latest entry shows agent_assigned activity
```

---

## Future: Multi-Tenancy & Permission Levels

When expanding the system, consider adding:
- **Department-level permissions**: Restrict staff to specific departments
- **Project-level assignments**: Ensure agents assigned to inquiries are assigned to that project
- **Commission rate permissions**: Different rates for different broker tiers
- **Document level access**: Staff can only review documents for assigned projects

