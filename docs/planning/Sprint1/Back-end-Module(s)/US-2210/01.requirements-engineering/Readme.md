# **US2.2.10 – View Vessel Visit Notification Status**

## **1. Requirements Engineering**

---

### **1.1. User Story Description**

> **As a Shipping Agent Representative**,
> I want to **view the status of all my submitted Vessel Visit Notifications**
> (in progress, pending, approved with dock assignment, or rejected with reason),
> so that I am always informed about the decisions of the Port Authority.

---

### **1.2. Customer Specifications and Clarifications**

**From the specifications document and client meetings:**

> The Port Authority system must allow representatives to consult the status of Vessel Visit Notifications (VVNs) that have been created or submitted by them, as well as those submitted by other representatives belonging to the same shipping agent organization.

> The list must include essential details such as:
>
> * Vessel Name / IMO number
> * Estimated arrival and departure dates
> * Current status (InProgress, PendingInformation, Submitted, Accepted, Rejected)
> * Assigned dock (if accepted)
> * Rejection reason (if applicable)

> The list should support filters and search criteria by:
>
> * Vessel name or IMO number
> * Status
> * Representative
> * Date range (ETA or submission date)

**From forum:**

> **Question:** Should all statuses be visible to the representative, including rejected ones?
> **Answer:** Yes, all VVNs created by the organization should be visible, even if rejected or withdrawn.
>
> **Question:** Is filtering required on the client side or server side?
> **Answer:** Filtering should be implemented on the **server side**, allowing REST queries with query parameters such as `/api/VesselVisitNotification?status=Accepted&vessel=THPA`.

---

### **1.3. Acceptance Criteria**

| **ID**   | **Description**                                                                                                                |
| :------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **AC01** | The Shipping Agent Representative can list all VVNs created by themselves or by other representatives from their organization. |
| **AC02** | The list includes relevant data: VVN Code, Vessel Name/IMO, ETA, ETD, Status, Assigned Dock, and Rejection Reason (if any).    |
| **AC03** | The system allows filtering VVNs by vessel name/IMO number, status, representative, and time range.                            |
| **AC04** | Only users belonging to the same shipping agent organization can view their organization’s VVNs.                               |
| **AC05** | The list must reflect real-time status updates (e.g., Accepted, Rejected, PendingInformation).                                 |
| **AC06** | The endpoint should return a structured JSON array of VesselVisitNotificationDto objects.                                      |

---

### **1.4. Found out Dependencies**

* Depends on the **VesselVisitNotification aggregate** and repository to fetch VVNs.
* Depends on the **ShippingAgentOrganization** aggregate to enforce organizational visibility.
* Related to previous user stories:

    * **US2.2.8** – Create Vessel Visit Notification
    * **US2.2.9** – Update or Complete Vessel Visit Notification

---

### **1.5. Input and Output Data**

**Input Data (from user):**

* Optional query parameters:

    * `?vessel=IMO9876543`
    * `?status=Accepted`
    * `?representative=JohnDoe`
    * `?from=2025-01-01&to=2025-12-31`

**Output Data (to user):**

* A list (JSON array) of `VesselVisitNotificationDto` objects containing:

    * `Code`
    * `VesselImo`
    * `EstimatedTimeArrival`, `EstimatedTimeDeparture`
    * `Status`
    * `AssignedDock` (if any)
    * `RejectionReason` (if any)

---

### **1.6. System Sequence Diagram (SSD)**

![SSD](./puml/us2210-sequence-diagram.svg)

---

### **1.7. Other Relevant Remarks**

* This user story introduces the **query side of the VVN use cases**, complementing the creation and update flows.
* Performance considerations should be made for server-side filtering and pagination.
* Future enhancements may include sorting, pagination (`limit` / `offset`), and export (CSV, PDF).
* The same endpoint can be reused by the Port Authority in the future, but with different access rules.