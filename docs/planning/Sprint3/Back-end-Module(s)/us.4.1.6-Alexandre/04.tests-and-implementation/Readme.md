## 4. Tests

### 4.1. Test Strategy

* **Unit Tests (Service/Domain):** validate business logic, mapping, and invariants without touching the database. Mock repositories and mappers.
* **Integration Tests (API + DB):** validate REST endpoints for querying resource allocation, filtering by crane and period, and aggregating total allocation time.
* **E2E Tests (SPA):** validate full workflow of loading physical resource allocation, selecting date intervals, displaying aggregated totals, and handling errors/warnings.

### 4.2. Unit Test Cases (suggested)

**OperationPlanRepo**

* **UT01:** `searchByCraneAndInterval()` throws error if `startDate` or `endDate` is missing.
* **UT02:** returns empty array when no operation plans exist for given crane/interval.
* **UT03:** maps database records to domain objects using `OperationPlanMap`.
* **UT04:** builds correct MongoDB query with crane filter and normalized day intervals.
* **UT05:** omits crane filter when `craneId` is undefined.
* **UT06:** normalizes start/end to day boundaries (00:00:00 / 23:59:59).

**OperationPlanService**

* **UT07:** `getPlansByCraneAsync()` returns failure `Result` when dates are missing.
* **UT08:** returns empty `Result` if repository returns no plans.
* **UT09:** maps valid plans to DTOs using `OperationPlanMap`.
* **UT10:** propagates repository errors as failure `Result`.
* **UT11:** `createPlanAsync()` returns failure `Result` when domain creation fails.
* **UT12:** `getPlansAsync()` filters and maps plans correctly by vessel or date.

### 4.3. Integration Test Cases (API)

**GET /api/operation-plans/by-resource**

* **IT01:** returns 400 when `crane`, `startDate`, or `endDate` query parameters are missing.
* **IT02:** returns 200 with aggregated allocation time and number of operations per plan.
* **IT03:** only includes saved operation plans in response.
* **IT04:** filters plans correctly by crane and date interval.
* **IT05:** returns empty array when no matching plans exist.
* **IT06:** returns detailed operation list and allocation per crane.

### 4.4. SPA Tests (E2E)

* **E2E01:** opens physical resource busy modal when clicking allocation button.
* **E2E02:** selecting `busyFrom` and `busyTo` triggers API call and displays results in table.
* **E2E03:** table shows total allocation time (`craneBusyTime`) and number of operations for selected crane.
* **E2E04:** shows friendly message when no operation plans exist in selected interval.
* **E2E05:** handles API errors gracefully and displays toast notifications.
* **E2E06:** modal closes correctly with animation and resets state.
* **E2E07:** total allocation time aggregates loading + unloading durations correctly.

---

## 5. Construction (Implementation)

### 5.1. Backend (API + Service + Domain)

**Endpoints**

* `GET /api/operation-plans/by-resource?crane={code}&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

**Controller Responsibilities**

* Validate required query parameters: `crane`, `startDate`, `endDate`.
* Call `OperationPlanService.getPlansByCraneAsync()` with parsed dates.
* Aggregate per-plan total allocation time and number of operations for the given crane.
* Only return plans where the crane was actually used.
* Handle errors using `clientError` or `fail` responses.

**Service Responsibilities**

* Validate input dates and throw meaningful error if missing.
* Call `OperationPlanRepo.searchByCraneAndInterval()`.
* Map domain objects to DTOs using `OperationPlanMap`.
* Return `Result.ok()` or `Result.fail()`.

**Domain & Repository**

* `OperationPlanRepo.searchByCraneAndInterval()`:
  * Accepts `startDate`, `endDate`, optional `craneId`.
  * Normalizes dates to day start/end.
  * Builds MongoDB query with optional crane regex filter.
  * Returns array of `OperationPlan` domain objects.
  * Filters out plans without operations for the crane.

### 5.2. Frontend (SPA)

**PhysicalResourceBusyModal Component**

* Props: `resource`, `isOpen`, `onClose`.
* State:
  * `busyFrom`, `busyTo` (date pickers)
  * `filteredPlans` (plans filtered by crane)
  * `busyTime` (total allocation time)
  * `isLoading`, `error`
* Effects:
  * Reset state when modal opens.
  * Fetch plans when `busyFrom` and `busyTo` are selected.
  * Aggregate `craneBusyTime` and number of operations per plan.
* Table displays:
  * Plan Date
  * Algorithm
  * Number of operations for the crane
  * Crane Busy Time (h)
  * Total Plan Time (h)
* Shows message if no plans found.
* Handles closing with animation and state reset.

---

## 6. Integration and Demo

### 6.1. Demo Script

1. Open physical resource list and select a crane.
2. Click "View Allocation" to open busy modal.
3. Select date interval (`busyFrom` / `busyTo`) and trigger fetch.
4. Show table with:
   * Each plan's algorithm
   * Number of operations for the crane
   * Crane busy time and total plan time
5. Show message if no plans exist in selected interval.
6. Simulate API error and show toast notification.
7. Close modal and demonstrate state reset and animation.

### 6.2. Evidence

---

## 7. Observations

* Ensure date interval selection is inclusive and normalized to full days.
* Consider memoizing fetched plans to avoid redundant API calls.
* Aggregate calculation: `craneBusyTime = sum(loadingDuration + unloadingDuration)`.
* Keep audit logs immutable and link back to planDate and crane for traceability.
* SPA should display human-readable date (`DD/MM/YYYY`) and hours with `h` suffix.
* Handle edge cases where operations have zero duration or missing fields.
