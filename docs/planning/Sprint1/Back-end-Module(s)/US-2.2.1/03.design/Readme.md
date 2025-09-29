# US2.2.1 – Create and manage vessel types

## 3. Design – User Story Realization

### 3.1. Rationale

This section explains **which software class takes responsibility** for each interaction step, following the SSD (System Sequence Diagram) defined in the analysis.

| Interaction ID                                                  | Question: Which class is responsible for... | Answer                        | Justification (with patterns)                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Step 1: Officer submits “Create VesselType”                     | …interacting with the actor?                | `VesselTypeController`        | **Controller** pattern: centralizes input handling from UI/API.                                                  |
|                                                                 | …coordinating the US?                       | `VesselTypeAppService`        | **Application Service**: orchestrates domain logic and delegates to the domain model.                            |
| Step 2: request data (name, description, capacity, constraints) | …validating business rules?                 | `VesselType` (Aggregate Root) | **Information Expert**: only the aggregate enforces its invariants (capacity > 0, constraints > 0, unique name). |
| Step 3: persist VesselType                                      | …storing/retrieving VesselType?             | `VesselTypeRepository`        | **Repository**: abstracts persistence and provides access to aggregates.                                         |
| Step 4: log action                                              | …recording audit trail?                     | `AuditService`                | **Pure Fabrication**: dedicated service for cross-cutting concerns.                                              |

**Systematization**
According to this rationale, the conceptual classes promoted to software classes are:

* `VesselType` (Aggregate Root)

Other software classes (i.e., Pure Fabrication) identified:

* `VesselTypeController`
* `VesselTypeAppService`
* `VesselTypeRepository`
* `AuditService`

---

### 3.2. Sequence Diagram (SD)

This diagram illustrates the interactions between the classes for realizing the user story.

**Full Diagram:**
Shows the complete flow:
`Officer → UI → Controller → AppService → VesselType → Repository → AuditService`.
![SD](../01.requirements-engineering/puml/us2.2.1-sequence-diagram-alternative-1.svg)

---

### 3.3. Class Diagram (CD)

The class diagram for this US includes:

* `VesselType` (Aggregate Root with attributes: name, description, capacityTEU, maxRows, maxBays, maxTiers).
* `VesselTypeController` (handles requests from UI/API).
* `VesselTypeAppService` (application service orchestrating use case).
* `VesselTypeRepository` (persistence abstraction).
* `AuditService` (responsible for audit logging).
