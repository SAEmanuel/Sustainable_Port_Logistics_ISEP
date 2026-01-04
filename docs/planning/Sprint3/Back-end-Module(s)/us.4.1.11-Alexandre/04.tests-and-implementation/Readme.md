## 4. Tests

### 4.1. Test Strategy

* **Unit Tests (Domain & Service):**  
  Validate completion-specific business rules for Vessel Visit Execution (VVE), including lifecycle transition to `Completed`, temporal consistency of unberth and departure times, executed-operation completion checks, immutability after completion, and audit logging. Repositories and external dependencies are mocked.

* **Integration Tests (API):**  
  Validate the REST endpoint responsible for marking a VVE as completed, focusing on request validation, business rule enforcement, HTTP status codes, and correct response payloads.

* **E2E Tests (SPA):**  
  Validate the end-to-end completion workflow in the SPA: opening the completion option, entering unberth and departure times, enforcing blocking rules, and confirming read-only behavior after completion.

---

### 4.2. Unit Test Cases

#### VesselVisitExecution (Domain)

* **UT01:** `setCompleted()` sets status to `Completed` when all rules are satisfied.
* **UT02:** `setCompleted()` throws if VVE status is not `In Progress`.
* **UT03:** throws if not all executed cargo operations are marked as finished.
* **UT04:** throws if `actualUnBerthTime` is after `actualLeavePortTime`.
* **UT05:** throws if `actualUnBerthTime` is before actual arrival time.
* **UT06:** sets `actualUnBerthTime`, `actualLeavePortTime`, and `updatedAt` correctly.
* **UT07:** appends an immutable audit log entry with timestamp, user, and action.
* **UT08:** prevents further state-changing operations once status is `Completed`.
* **UT09:** allows read-only access to all VVE data after completion.

---

#### VesselVisitExecutionService

* **UT10:** `setCompletedAsync()` returns failure `Result` when VVE does not exist.
* **UT11:** returns failure `Result` when domain throws a business rule violation.
* **UT12:** successfully completes VVE, saves it, and returns success `Result`.
* **UT13:** passes updater user/email correctly to the domain for audit logging.
* **UT14:** propagates repository save errors as failure `Result`.

---

### 4.3. Integration Test Cases (API)

#### POST /api/vve/{code}/complete

* **IT01:** returns 200 when VVE is successfully completed.
* **IT02:** returns 400 when required fields are missing in request body.
* **IT03:** returns 400 when executed operations are not all completed.
* **IT04:** returns 400 when unberth time is after port departure time.
* **IT05:** returns 404 when VVE with given code does not exist.
* **IT06:** returns 409 when attempting to complete an already completed VVE.
* **IT07:** response body reflects updated status and recorded timestamps.

---

### 4.4. SPA Tests (E2E)

* **E2E01:** shows “Mark as Completed” option for VVEs in `In Progress` state.
* **E2E02:** hides or disables completion option for already completed VVEs.
* **E2E03:** blocks completion when any cargo operation is not finished.
* **E2E04:** allows entry of unberth time and port departure time.
* **E2E05:** submits correct payload to completion endpoint.
* **E2E06:** updates UI to `Completed` state after successful completion.
* **E2E07:** makes VVE read-only after completion.
* **E2E08:** displays error messages when completion fails.
* **E2E09:** logs out-of-sync or forbidden edits for non-admin users.

---

## 5. Construction (Implementation)

### 5.1. Backend (API + Service + Domain)

**Endpoint**

* `POST /api/vve/{code}/complete`

---

**Controller Responsibilities**

* Validate request body fields:
  * `actualUnBerthTime`
  * `actualLeavePortTime`
  * `updaterEmail`
* Convert ISO date strings into `Date` objects.
* Create `VesselVisitExecutionCode` value object from path parameter.
* Call `VesselVisitExecutionService.setCompletedAsync()`.
* Translate service `Result` into HTTP responses.
* Forward unexpected errors to middleware.

---

**Service Responsibilities**

* Retrieve VVE by code from repository.
* Enforce cross-aggregate rules (existence, lifecycle state).
* Delegate completion logic to the domain entity.
* Persist completed VVE.
* Return `Result.ok()` or `Result.fail()` consistently.

---

**Domain & Repository**

* **VesselVisitExecution**
  * Enforces lifecycle transition to `Completed`.
  * Validates:
    * All cargo operations are finished.
    * Temporal consistency of unberth and departure times.
  * Locks the aggregate against further modifications after completion.
  * Records audit log entries (timestamp, user, action).

* **VesselVisitExecutionRepository**
  * Retrieves and persists VVEs by code.
  * Prevents accidental overwrites of completed VVEs.

---

### 5.2. Frontend (SPA)

**Complete VVE Modal / Action**

* Visible only when VVE status is `In Progress`.
* Inputs:
  * Actual unberth time (datetime picker).
  * Actual port departure time (datetime picker).
* Validation:
  * All cargo operations must be completed.
  * Unberth time < port departure time.
* Submit action calls completion endpoint.
* On success:
  * Update VVE status to `Completed`.
  * Switch view to read-only mode.
* On failure:
  * Display validation or business error messages.

---

## 6. Integration and Demo

### 6.1. Demo Script

1. Open VVE details for an `In Progress` vessel visit.
2. Show cargo operations, with at least one unfinished.
3. Attempt to mark VVE as completed (blocked).
4. Finish all cargo operations.
5. Open completion modal and enter unberth and port departure times.
6. Submit completion request.
7. Show updated `Completed` status and read-only UI.

---

### 6.2. Evidence

---

## 7. Observations

* Completion logic is centralized in the domain to ensure consistency.
* Read-only enforcement after completion prevents accidental data corruption.
* Audit logging ensures traceability for operational statistics and compliance.
* SPA and backend validations are aligned to provide immediate feedback.
* This user story cleanly closes the VVE lifecycle and enables downstream analytics.
