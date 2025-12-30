## 2. Analysis

### 2.1. Relevant Domain Model Excerpt

* **ComplementaryTask (Aggregate Root)**

    * `id`, `code`, `category`, `staff`, `vve`, `status`, `timeStart`, `timeEnd`
    * `auditLog[]` (append-only)
* **ComplementaryTaskCategory**

    * `id`, `code`, `name`, `isActive`
* **StaffMember**

    * `id`, `name`, `isActive`
* **VVE**

    * `id`, `vessel`, `status`

**DDD positioning:** `ComplementaryTask` is the aggregate root; `auditLog` is an owned entity list. Conflicts/impact on operations are handled via a **domain service** (`ComplementaryTaskScheduler`) querying related tasks and VVEs.

---

### 2.2. Other Remarks

* **Auditability:** every change is logged (`changedAt`, `author`, `reason`, `diffSummary`).
* **Task highlighting:** ongoing tasks that affect operations must be marked in the SPA.
* **Filtering/listing:** the SPA allows filtering by vessel, date range, or status.
* **Category fix:** must validate active category.
* **Concurrency control:** optimistic concurrency recommended.

---