# US4.1.11 – Mark a Vessel Visit Execution (VVE) as Completed

## 1. Requirements Engineering

### 1.1. User Story Description

As a **Logistics Operator**, I want to **mark a VVE as completed** by recording the vessel’s **unberth time** and **port departure time**, so that **the visit lifecycle is correctly closed** and **operational statistics** can be derived.

---

### 1.2. Customer Specifications and Clarifications

**From the specifications document and client discussions:**

* The SPA must provide a **“Mark as Completed”** option for VVEs.  
* Completing a VVE requires recording:

    * `actualUnBerthTime` — when the vessel leaves the dock  
    * `actualLeavePortTime` — when the vessel exits port limits  

* Completion is **only allowed if all cargo operations** associated with the VVE are finished.  
* Once completed, the VVE becomes **read-only**, except for authorized corrections by **admin users**.  
* The action must be **logged** (timestamp, user, any changes made) for **audit purposes**.  

**Clarifications to be assumed in implementation:**

1. **Scope of Completion**

    * Only VVEs in **“In Progress”** status can be completed.  
    * Completion updates the VVE’s `status` to `"Completed"`.  

2. **Audit Logging**

    * Each completion action must create an **append-only audit entry** with:

        * `at` (timestamp)  
        * `by` (user who completed)  
        * `action` (`"SET_COMPLETED"`)  
        * `changes` (from previous to new values)  

3. **Authorization**

    * Only the **creator or admin users** can modify completed VVEs.  

4. **Cargo Operation Check**

    * Controller must verify **all associated cargo operations** for the VVE are finished before marking as completed.  

---

### 1.3. Acceptance Criteria

**AC01 — SPA Completion Option**

* SPA provides a “Mark as Completed” button for VVEs with status `"In Progress"`.  

**AC02 — Required Information**

* Completing a VVE records:

    * `actualUnBerthTime`  
    * `actualLeavePortTime`  

**AC03 — Cargo Operation Completion Check**

* Completion is **blocked** if any associated cargo operation is unfinished.  
* Server returns **400 Bad Request** with an informative message in this case.  

**AC04 — Status Update**

* Upon completion, VVE `status` is set to `"Completed"`.  

**AC05 — Read-Only After Completion**

* Completed VVEs are **read-only** except for admin corrections.  

**AC06 — Audit Logging**

* Every completion action is logged with:

    * `at` — timestamp  
    * `by` — user email  
    * `action` — `"SET_COMPLETED"`  
    * `changes` — snapshot of `actualUnBerthTime`, `actualLeavePortTime`, and `status`  

---

### 1.4. Dependencies

* **OperationPlanService** — to check cargo operations are completed.  
* **Authentication/Authorization Service** — to identify the current user and enforce admin privileges.  
* **VesselVisitExecutionRepo** — to fetch and persist VVEs.  

---

### 1.5. Input and Output Data

**Input Data (API request)**

```json
{
    "actualUnBerthTime": "2025-12-31T15:00:00Z",
    "actualLeavePortTime": "2025-12-31T16:00:00Z",
    "updaterEmail": "operator@example.com"
}
