## 2. Analysis

### 2.1. Relevant Domain Model Excerpt

Based on the provided DDD, **US.4.2.1** primarily involves the creation of **OperationPlan** instances for each **VesselVisitNotification** (VVN) scheduled on a selected day, allocating **resources**, **staff**, and (when applicable) **storage and berth/dock context**.

#### Core aggregates/entities involved (as represented in the domain model)

- **VesselVisitNotification**
    - Purpose in this US: **source of demand** for planning (the “what needs to be planned” for a given day).
    - Key attributes (from the model):
        - `code`
        - `estimate_time_arrival`, `estimate_time_departure`
        - `volume`, `documents`, `acceptance_date`
        - `actual_time_arrival`, `actual_time_departure` (present in the model even though execution is also modeled separately)
        - `status`
    - Business meaning: VVNs define the set of vessel visits to be included in the daily batch generation.

- **OperationPlan**
    - Purpose in this US: **target output** to be generated (one plan per eligible VVN).
    - Key attributes (from the model):
        - `actual_time_arrival`, `actual_time_departure`
        - `loading_duration`, `unloading_duration`
        - `approval`
    - Interpretation for this US:
        - The plan must at least capture the **planned windows/durations** for (un)loading and the necessary state for **approval** (the DDD explicitly includes an approval concept).
        - The presence of “actual” timestamps suggests the aggregate may later be enriched/updated post-execution (or used for planned vs. actual comparison).

- **PhysicalResource**
    - Purpose in this US: planning must allocate operational equipment (e.g., cranes).
    - Key attributes:
        - `alpha_code`
        - `schedule`
        - `operational_capacity`
        - `setup_time`
        - `type`, `status`, `description`
    - Planning relevance: algorithm feasibility depends on `schedule`, `status`, and `setup_time`.

- **StaffMember**
    - Purpose in this US: planning must allocate qualified staff.
    - Key attributes:
        - `mec_number`, `short_name`
        - `email`, `phone_number`
        - `schedule`
        - `status`
    - Planning relevance: staff availability is constrained by `schedule` and `status`.

- **Qualification**
    - Purpose in this US: supports qualification constraints for staff/resource assignment.
    - Key attributes:
        - `code`, `name`
    - Planning relevance: links “who can do what” and/or “which roles are required” for specific operations.

- **Dock**
    - Purpose in this US: VVNs are operationally constrained by berth availability and constraints.
    - Key attributes:
        - `code`, `number`
        - `location`
        - `depth`, `length`, `max_draft`
    - Planning relevance: berth feasibility and time-window conflicts must consider dock constraints.

- **StorageArea**
    - Purpose in this US: planned operations may require storage allocation (yard/area).
    - Key attributes:
        - `id`
        - `location`
        - `teu_capacity`, `current_occupancy`
        - `type`
    - Planning relevance: unloading/loading may require capacity feasibility against `current_occupancy` and `teu_capacity`.

#### Contextual entities (used indirectly by this US)
- **Vessel**: `name`, `owner`, `imo_number` (gives operational context for the visit)
- **VesselType**: `name`, `description`, `max_bays`, `max_rows`, `max_tiers`, `teu_capacity` (capacity/constraints may influence plan feasibility)
- **VesselVisitExecution**: `arrival`, `departure`, `berth_time`, `warning`, `status`, `user_email`
    - Not created by this US, but is part of the OEM lifecycle and will later support planned-vs-actual monitoring.
- **Incident / IncidentType**
    - Not created by this US, but impacts execution monitoring and later analytics:
        - Incident: `id`, `start`, `end`, `description`, `user_email`, `status`
        - IncidentType: `code`, `name`, `description`, `classification`

---

### 2.2. Other Remarks

- The DDD explicitly includes **schedules** in both `PhysicalResource` and `StaffMember`. Therefore, feasibility for daily batch plan generation must validate time-window compatibility against these schedules, and not only against VVNs.
- `StorageArea.current_occupancy` and `StorageArea.teu_capacity` imply that storage allocation is not cosmetic: it must be considered a **hard constraint** (or a constraint that can render a VVN infeasible).
- The presence of `OperationPlan.approval` indicates that the generated plan should enter an **approval-aware state** (e.g., “pending approval”), even if the UI only previews before saving.
- Although execution is modeled via `VesselVisitExecution`, the `OperationPlan` aggregate contains fields named with “actual” timestamps. For this US, these should remain unset or defaulted at creation time, and only populated during/after execution monitoring (unless your domain rules state otherwise).
