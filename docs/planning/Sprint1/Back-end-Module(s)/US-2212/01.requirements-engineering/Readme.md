# US 2.2.12 – Register and Manage Physical Resources

## 1. Requirements Engineering

### 1.1. User Story Description

As a **Logistics Operator**, I want to **register and manage physical resources** (create, update, deactivate, and reactivate) so that they can be **accurately tracked and utilized** during port **planning and scheduling operations**.

---

### 1.2. Customer Specifications and Clarifications

**From the specifications document and client meetings:**

> Physical resources include **cranes, trucks, forklifts, and other operational equipment** used in port and yard operations.  
> Each resource must have a **unique alphanumeric code** (`CODE`), a **description**, and an associated **type** (e.g., Truck, Crane).  
> Resources must also store:
> - **Operational capacity** (depending on the type, e.g., tons/hour for cranes);
> - **Setup time** (if applicable);
> - **Current status** (`Available`, `Unavailable`, `UnderMaintenance`);
> - An optional **qualification requirement**, ensuring that only certified staff can operate specific equipment.

> **Deactivation** and **reactivation** must preserve all data and ensure auditability for operational traceability.

**From forum (clarifications):**

> **Question:** Can two resources share the same code?  
> **Answer:** No. Each physical resource must have a **unique code** for identification.

> **Question:** Is setup time required for all resources?  
> **Answer:** No. It is **optional** and only relevant to resources that require preparation before use (e.g., cranes).

> **Question:** What happens when a qualification is removed from the database?  
> **Answer:** The system should **prevent orphan references** — qualifications linked to resources must exist and remain valid.

---

### 1.3. Acceptance Criteria

* **AC01 – Create:** System allows creation of a `PhysicalResource` with `Code`, `Description`, `Type`, `OperationalCapacity`, optional `SetupTime`, and optional `QualificationId`.
* **AC02 – Retrieve:** System supports retrieval of physical resources by `ID`, `Code`, `Description`, `Type`, `Status`, or `QualificationId`.
* **AC03 – Update:** System allows updating fields such as `Description`, `OperationalCapacity`, `SetupTime`, and `QualificationId`.
* **AC04 – Deactivate:** System allows deactivating a resource, changing its status to `Unavailable`.
* **AC05 – Reactivate:** System allows reactivating a previously deactivated resource, restoring its status to `Available`.
* **AC06 – Uniqueness:** Resource `Code` must be unique across the system.
* **AC07 – Validation:** System must reject invalid input (negative capacity, null description, non-existent qualification).
* **AC08 – Logging:** All actions (Create, Update, Deactivate, Reactivate) must be logged with timestamps and relevant identifiers.

---

### 1.4. Found Out Dependencies

* **Depends on:**
    * US 2.2.13 – *Register and Manage Qualifications*, since `QualificationId` is a foreign reference.
    * Authentication and authorization modules (to ensure only logistics operators manage resources).

* **Provides data to:**
    * Planning and Scheduling modules that allocate physical resources to operations.

---

### 1.5. Input and Output Data

#### **Input Data (API Request Examples)**

| Field | Type | Required | Description |
|-------|------|-----------|--------------|
| `description` | string | ✅ Yes | Resource description (max 80 chars). |
| `physicalResourceType` | enum | ✅ Yes | Type of resource (e.g., `Truck`, `Crane`, `Forklift`). |
| `operationalCapacity` | double | ✅ Yes | Operational capacity; must be > 0. |
| `setupTime` | double | ❌ No | Time required to prepare the resource. |
| `qualificationCode` | string | ❌ No | Optional qualification reference. |
| `status` | enum | ✅ Yes | `Available`, `Unavailable`, or `UnderMaintenance`. |

#### **Output Data**

| Field | Type | Description |
|-------|------|--------------|
| `id` | Guid | Unique identifier of the physical resource. |
| `code` | string | Generated unique alphanumeric code. |
| `description` | string | Description of the resource. |
| `type` | string | Resource category (Truck, Crane, etc.). |
| `status` | string | Current status of the resource. |
| `operationalCapacity` | double | Operational performance metric. |
| `setupTime` | double | Setup time before operation. |
| `qualificationId` | Guid (nullable) | Qualification required for operation. |

---

### 1.6. System Sequence Diagram (SSD)

![System Sequence Diagram - Register and Manage Physical Resources](./svg/us2.2.12-sequence-diagram.svg)

---

### 1.7. Other Relevant Remarks

- None