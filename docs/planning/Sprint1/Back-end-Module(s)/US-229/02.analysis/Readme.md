# **US2.2.9 – Update or Complete Vessel Visit Notification**

## **2. Analysis**

### **2.1. Relevant Domain Model Excerpt**

![Domain Model – Vessel Visit Notification](./puml/us2.2.9-domain-model.svg)

**Description of the Domain Model Excerpt:**

The **VesselVisitNotification (VVN)** aggregate root encapsulates the entire lifecycle and data of a vessel’s visit to the port.
It serves as the central entity that governs validation, update permissions, and status transitions.

#### **Main Entities and Value Objects**

* **VesselVisitNotification (Aggregate Root)**
  Represents the vessel visit record that can be modified by the Shipping Agent Representative while *In Progress*.
  It controls transitions between states such as *InProgress*, *PendingInformation*, *Withdrawn*, and *Submitted*.

* **VvnCode (Value Object)**
  A unique business identifier for each VVN, following the format `{YEAR}-{PORT_CODE}-{SEQUENCE}`
  (e.g., `2025-THPA-000001`).

* **ClockTime (Value Object)**
  Encapsulates and validates all timestamps, such as ETA, ETD, and acceptance date, ensuring logical consistency.

* **EntityDock (Entity Reference)**
  Represents the docks associated with the vessel during arrival, loading, and unloading operations.

* **CrewManifest / CargoManifest (Aggregates)**
  Represent detailed data regarding the ship’s crew and cargo manifests, which may be updated while the VVN is still *In Progress*.

* **VvnStatus (Enumeration)**
  Defines the lifecycle of the VVN:
  `InProgress`, `PendingInformation`, `Withdrawn`, `Submitted`, `Accepted`.

---

#### **Relationships**

| Relationship                                | Description                                                          |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `VesselVisitNotification` → `Vessel`        | Links the VVN to the corresponding vessel by IMO number.             |
| `VesselVisitNotification` → `EntityDock`    | Associates the visit with one or more docks for berthing operations. |
| `VesselVisitNotification` → `CrewManifest`  | Optional link to the crew manifest entity.                           |
| `VesselVisitNotification` → `CargoManifest` | Optional links to cargo manifests for loading and unloading.         |
| `VesselVisitNotification` → `EntityTask`    | Associates operational tasks generated during creation or update.    |

---

### **2.2. Business Rule Summary**

| **Rule ID**   | **Description**                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-VVN-01** | While the VVN status is *InProgress*, all data (ETA, ETD, Volume, Documents, Docks, CrewManifest, CargoManifests) can be modified or added by the representative. |
| **BR-VVN-02** | After submission (*Submitted*), the VVN becomes **read-only** and cannot be edited by the Shipping Agent Representative.                                          |
| **BR-VVN-03** | The representative can withdraw a VVN only if it is *InProgress* or *PendingInformation*.                                                                         |
| **BR-VVN-04** | A withdrawn VVN can be resumed (status → *InProgress*) and then resubmitted for approval.                                                                         |
| **BR-VVN-05** | Updates and submissions must follow the same validation logic as creation (valid ETA/ETD, non-negative volume, valid docks and IMO).                              |
| **BR-VVN-06** | Transitions are handled only via domain methods (`Submit()`, `Withdraw()`, `Resume()`, `MarkPending()`), ensuring data consistency.                               |

---

### **2.3. Other Remarks**

* The **VesselVisitNotificationService** acts as the **application layer coordinator**, ensuring that domain rules are respected.
  It validates status before allowing updates or submissions.

* The **domain aggregate root (`VesselVisitNotification`)** enforces invariants:

    * Disallows direct property modifications after submission.
    * Throws `BusinessRuleValidationException` for invalid transitions.
    * Ensures timestamps and numerical data are valid at all times.

* The **controller** only exposes actions allowed by the current VVN state:

    * **PUT /api/vvn/{id}** → to update while *InProgress*
    * **PUT /api/vvn/{id}/submit** → to finalize and lock
    * **PUT /api/vvn/{id}/withdraw** → to cancel
    * **GET /api/vvn/{id}** → to verify status or re-open if *PendingInformation*

* The **VvnStatus** enumeration ensures state integrity, avoiding invalid transitions such as skipping directly from *InProgress* to *Accepted*.

* This US consolidates the full **edit–submit–lock** cycle of the Vessel Visit Notification,
  complementing **US2.2.8 (creation)** and ensuring that domain consistency is maintained across all updates.
