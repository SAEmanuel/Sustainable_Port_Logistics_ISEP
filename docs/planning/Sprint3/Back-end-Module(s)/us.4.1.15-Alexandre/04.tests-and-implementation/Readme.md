## 4. Tests

### 4.1. Test Strategy

* **Unit Tests (Service/Domain):** validate invariants and orchestration without hitting the DB (mock repos/checkers).
* **Integration Tests (API + DB):** validate REST contract, persistence, audit logging, filtering, and conflict detection end-to-end.
* **E2E Tests (SPA):** validate create/update/fix-category workflow, filtering/listing, highlighting of ongoing tasks, required reason, warnings/conflicts display, and successful save.

### 4.2. Unit Test Cases (suggested)

**ComplementaryTask (domain/aggregate)**

* **UT01:** `create()` fails when `code` or `category` is empty.
* **UT02:** `create()` fails when `staff` or `vve` is null/undefined.
* **UT03:** updating category fails if new category is inactive.
* **UT04:** updating a task fails if `timeEnd < timeStart`.
* **UT05:** applying updates records audit entry correctly.
* **UT06:** applying patch supports partial updates (e.g., status change only).
* **UT07:** filtering logic correctly returns tasks by vessel, date range, or status.
* **UT08:** highlighting logic correctly marks ongoing tasks affecting operations.

**ComplementaryTaskService (application/service)**

* **UT09:** returns 404 when task not found for given code.
* **UT10:** returns 400 when `reason` is missing/empty.
* **UT11:** returns 409 when `Scheduler` returns blocking conflicts (e.g., overlapping maintenance tasks).
* **UT12:** returns 200 with warnings when conflicts are non-blocking.
* **UT13:** persists task + writes audit entry on success (save called once + append audit called once).

### 4.3. Integration Test Cases (API)

* **IT01:** `GET /api/complementary-tasks` returns 200 with task DTO list.
* **IT02:** supports filtering by vessel, date range, or status; returns correct subset.
* **IT03:** `POST /api/complementary-tasks` returns 400 on invalid payload (missing required fields).
* **IT04:** `POST` returns 409 when scheduling conflicts occur (blocking).
* **IT05:** `POST` returns 200 and includes `warnings[]` when non-blocking inconsistencies exist.
* **IT06:** `PATCH /api/complementary-tasks/{code}/fix-category` validates category and returns 200 on success.
* **IT07:** audit endpoint returns entries after a create/update/fix-category, containing `changedAt`, `author`, `reason`.

### 4.4. SPA Tests (E2E)

* **E2E01:** user creates a task and is blocked until “reason” is filled.
* **E2E02:** user updates a task; UI shows success and displays warnings if returned.
* **E2E03:** user fixes category; UI shows updated category and reflects audit entry.
* **E2E04:** when API returns 409, UI shows conflict panel with details and does not apply changes silently.
* **E2E05:** filtering tasks by vessel, date range, or status returns correct tasks.
* **E2E06:** ongoing tasks are visually highlighted in the list when they impact operations.

---

## 5. Construction (Implementation)

### 5.1. Backend (API + Service + Domain)

**Endpoints (suggested)**

* `GET /api/complementary-tasks` (supports query params for vessel, date range, status)
* `POST /api/complementary-tasks`
* `PATCH /api/complementary-tasks/{code}/fix-category`
* `GET /api/complementary-tasks/{code}/audit`

**DTOs (suggested)**

* `ComplementaryTaskDTO`:

    * `id: string` (unique generated)
    * `code: string`
    * `category: string`
    * `staff: string`
    * `vve: string`
    * `status: string` (e.g., ongoing, completed)
    * `timeStart: Date`
    * `timeEnd?: Date`
    * `reason: string` (mandatory for create/update/fix-category)

**Validation & Invariants**

* Controller validates required fields, types, and non-empty reason.
* Service/domain validates:

    * `timeStart < timeEnd` (if timeEnd is present)
    * `category` is active when changing or fixing
    * Conflicts with other complementary tasks via `ComplementaryTaskScheduler`

**Conflict Checking**

* `ComplementaryTaskScheduler`:

    * Detect tasks overlapping in time for the same VVE, staff, or dock if relevant
    * Return blocking conflicts (409) or warnings (non-blocking)

**Audit Logging**

* Append-only log entry on successful create/update/fix:

    * `taskId/code`, `changedAt`, `author`, `reasonForChange`, `diffSummary`
* Store audit entries in dedicated collection/table for immutability.

### 5.2. Frontend (SPA)

* Task page supports:

    * load tasks by vessel, date range, or status
    * create/update tasks
    * fix category with reason
* Form validation:

    * reason mandatory
    * invalid category selection blocked
* Task listing:

    * shows unique task ID, category reference, responsible staff/team, time window, completion status, associated VVE
    * highlights ongoing tasks currently impacting operations
* Conflict UX:

    * blocking conflicts show modal/panel listing collisions
    * warnings appear as non-blocking alerts on successful save
* Audit UX:

    * user can view change log for each task

---

## 6. Integration and Demo

### 6.1. Demo Script (suggested)

1. Open **Complementary Task list** screen.
2. Apply **filters** by vessel, date range, and status; observe correct task subset.
3. Create a new task with staff, VVE, category, start/end times.
4. Submit without reason → validation error.
5. Submit valid task → success, audit entry recorded, ongoing tasks highlighted.
6. Update an existing task (change status or times) with reason.
7. Show warnings if scheduler detects non-blocking conflicts.
8. Attempt a fix-category action:

    * with inactive category → blocked
    * with valid category → success, audit entry recorded
9. Trigger a blocking conflict → API returns 409, UI shows conflict panel.
10. View **audit trail** for the task and show entries with `changedAt`, `author`, `reason`, `diffSummary`.

### 6.2. Evidence

* Screenshots:

    * task list with filtering applied
    * ongoing tasks highlighted
    * create/update form + reason required validation
    * success response with warnings
    * conflict panel (409)
    * fix-category modal and updated task
    * audit log list

* Optional: API logs / Postman collection demonstrating requests/responses

---

## 7. Observations

* Prefer immutable audit logs to support traceability.
* Use optimistic concurrency if multiple operators may edit the same task.
* Clearly define which conflicts are blocking (409) vs warnings (200 + warnings).
* Ensure scheduler handles both task overlaps and category validity.
* Partial updates (status change, time update, category fix) should work without requiring full DTO.
* SPA must provide filtering, listing, and visual highlighting for ongoing tasks.
* Each task should always include: ID, category, staff, time window, status, and VVE reference.
