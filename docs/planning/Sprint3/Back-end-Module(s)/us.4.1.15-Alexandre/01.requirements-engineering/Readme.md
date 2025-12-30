# US4.1.15 – Record and Manage Complementary Tasks

## 1. Requirements Engineering

### 1.1. User Story Description

As a **Logistics Operator**, I want to **record and manage Complementary Tasks** performed during **vessel visits (VVE)**, so that **non-cargo activities** (e.g., inspections, cleaning, maintenance) can be **tracked**, **correlated with operational efficiency**, and **monitored for ongoing impact**.

---

### 1.2. Customer Specifications and Clarifications

**From the specifications document and client meetings:**

* Each **Complementary Task** may either:

    * Run in parallel with ongoing cargo operations (e.g., inspection), or
    * Temporarily suspend execution of ongoing cargo operations until it is concluded (e.g., maintenance, safety procedure).

* CRUD operations for Complementary Tasks must be provided via **REST API**.
* The **SPA** must provide:

    * A **simple form** to log or edit Complementary Tasks.
    * **Filtering and listing** tasks by vessel, date range, or status.
    * **Highlighting** ongoing tasks that currently impact operations.

* Each task record must include:

    * A **unique generated ID**
    * **Category reference**
    * Responsible **staff/team**
    * **Time window** (start and end timestamps)
    * **Completion status** (e.g., ongoing, completed)
    * Associated **VVE** (vessel visit)

**Clarifications for implementation:**

1. **Scope of tasks**

    * The operator can create, update, or fix-category of tasks.
    * Tasks are associated with a single VVE.
2. **Audit and reason**

    * All updates require a **reason** and **append-only audit logging**.
3. **Concurrency**

    * Optimistic concurrency should be enforced for multiple operators editing the same task.
4. **Category validation**

    * Category must be active; fixing category to an inactive one should be blocked.

---

### 1.3. Acceptance Criteria

**AC01 — REST endpoints available**

* `GET /api/complementary-tasks` (with query params: vessel, date range, status)
* `POST /api/complementary-tasks`
* `PATCH /api/complementary-tasks/{code}/fix-category`
* `GET /api/complementary-tasks/{code}/audit`

**AC02 — SPA form and listing**

* Users can create or edit tasks via form.
* Task list supports filtering and highlights ongoing tasks affecting operations.

**AC03 — Validation**

* Required fields: `code`, `category`, `staff`, `vve`, `timeStart`, `reason`.
* `timeEnd >= timeStart` if provided.
* Category must be active when assigning or fixing.

**AC04 — Conflict detection**

* Overlapping tasks for same VVE or impacting cargo operations must be detected.
* Blocking conflicts return **409 Conflict**, non-blocking inconsistencies return **200 OK** with warnings.

**AC05 — Audit logging**

* Every create/update/fix operation generates an **append-only audit log**:

    * `taskId/code`, `changedAt`, `author`, `reason`, `diffSummary`.

---

### 1.4. Found Dependencies

* **VVE catalog** (for associating tasks)
* **Complementary Task Category catalog** (for validation and selection)
* **Staff/Team catalog** (availability and assignment rules)
* **Authentication/Authorization** (to record author)
* **Conflict/impact checker** (to detect tasks affecting cargo operations)

---

### 1.5. Input and Output Data

**Input Data (API request)**

* Identifiers:

    * `taskId` (for updates)
    * `code` (unique for task)
    * `vveId` (associated vessel visit)
* Editable content:

    * `category`, `staff`, `status`, `timeStart`, `timeEnd`
    * `reasonForChange` (mandatory)

**Output Data (API response)**

* Updated `ComplementaryTaskDTO`
* Metadata:

    * `createdAt`, `author`
    * Audit log entries if requested
    * Warnings/conflicts array