# US 2.2.11 - Register and manage operating staff members

## 2. Analysis

### 2.1. Relevant Domain Model Excerpt

The domain model for US 2.2.7 covers the core entities and relationships essential for managing vessel visit notifications in a port logistics context:

- **VesselVisitNotification**: Captures fields for ID, unique code, status (e.g., InProgress, Submitted, Accepted, Rejected), ETA/ETD, cargo volume, documents, manifests, and candidate docks. Each notification is created and maintained by the Shipping Agent Representative and processed (approved/rejected) by the Port Authority Officer.
- **Dock**: Every notification, when approved, has a dock assigned by the Officer, based on dock availability, vessel type, and operational constraints. Intelligent algorithms may assist in optimizing dock allocation.
- **PortAuthorityOfficer**: Actor responsible for reviewing pending notifications, approving them (with dock assignment) or rejecting them (providing a rejection reason).
- **ShippingAgentRepresentative**: Actor that submits and updates notifications. If rejected, can edit and resubmit for consideration.
- **NotificationStatus**: Enumerates the possible lifecycle states for a notification (InProgress, Submitted, Accepted, PendingInformation, Withdrawn, Rejected).

Relationships:
- Each **VesselVisitNotification** is associated with a single vessel and can be updated until submission.
- Only authorized representatives can submit or edit notifications.
- Each approval or rejection directly affects notification status and triggers audit logging and possible messaging to agents.


![Domain Model](docs/planning/domain-model/LAPR5_project.svg)
---

### 2.2. Other Remarks

- "Submitted" status is mandatory for approval/rejection actions by the Officer.
- Data integrity and domain rules ensure notifications cannot be approved without dock assignment, nor rejected without a complete reason.
- Auditability and traceability are core; each decision is recorded for compliance and oversight.
- All interactions between agents and officers are strictly mediated by REST API endpoints, supporting operational transparency.
- Dock assignment logic must accommodate physical constraints (vessel type, length, draft, dock facilities) and scheduling conditions (availability, pending visits).
- Rejected notifications remain editable for agents to correct and resubmit, supporting flexible exception management and iterative operational workflows.
- The model supports future extensions, including automated scheduling optimization and notification messaging.

