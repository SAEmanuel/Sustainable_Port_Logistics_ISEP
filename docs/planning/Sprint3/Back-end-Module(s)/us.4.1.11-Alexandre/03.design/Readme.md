## 4. Design – User Story Realization (US4.1.11)

### 4.1. Rationale

***Note that SSD – Alternative One is adopted.***

| Interaction ID | Question: Which class is responsible for... | Answer | Justification (with patterns) |
|---------------:|---------------------------------------------|--------|-------------------------------|
| Step 1 | interacting with the actor (HTTP request)? | UpdateVVEToCompletedController | **Controller (GRASP)**. Handles REST interaction, request parsing, and response formatting, isolating HTTP concerns from application and domain logic. |
|  | coordinating the use case? | VesselVisitExecutionService | **Application Service (DDD)**. Orchestrates the completion flow, coordinates repositories, domain logic, and logging without embedding UI or persistence concerns. |
| Step 2 | validating request parameters (times, updater)? | UpdateVVEToCompletedController + VesselVisitExecutionService | **Pure Fabrication** for syntactic validation (presence, type); **Information Expert** for semantic validation (time consistency, lifecycle rules). |
| Step 3 | ensuring all cargo operations are completed? | VesselVisitExecution (Domain) | **Information Expert (GRASP)**. The aggregate root owns executed operations and enforces the invariant that completion is only allowed if all operations are finished. |
| Step 4 | transitioning the VVE lifecycle to “Completed”? | VesselVisitExecution | **Aggregate Root (DDD)**. Encapsulates lifecycle state changes and enforces invariants such as immutability after completion. |
| Step 5 | persisting the updated VVE state? | VesselVisitExecutionRepo | **Repository (DDD)**. Abstracts persistence and storage technology, ensuring low coupling and clean separation from domain logic. |
| Step 6 | recording audit information (timestamp, user, changes)? | VesselVisitExecution | **Information Expert**. The aggregate owns its audit log and ensures every state-changing operation is tracked for traceability. |
| Step 7 | mapping domain objects to DTOs? | VesselVisitExecutionMap | **Mapper / Data Mapper**. Converts between domain, persistence, and DTO representations without leaking concerns across layers. |

---

### 4.2. Systematization

According to the adopted rationale, the following **conceptual classes** are promoted to **software classes**:

- **VesselVisitExecution**  
  *Aggregate Root*. Encapsulates visit execution lifecycle, executed operations, audit log, and enforces completion rules.

- **ExecutedOperation**  
  *Entity / Value Object*. Represents execution state of planned operations associated with a VVE.

- **VesselVisitExecutionCode**  
  *Value Object*. Ensures identity and validity of VVE codes.

---

### 4.3. Pure Fabrication / Supporting Classes

The following **supporting software classes** are identified to fulfill non-domain responsibilities:

- **UpdateVVEToCompletedController**  
  REST controller responsible for HTTP interaction and request handling.

- **VesselVisitExecutionService**  
  Application service coordinating domain operations, repositories, and external services.

- **VesselVisitExecutionRepo**  
  Repository providing persistence abstraction for VVEs.

- **VesselVisitExecutionMap**  
  Mapper responsible for transforming domain objects into DTOs and persistence schemas.

- **OperationPlanRepo**  
  Repository used indirectly to ensure execution consistency with planned operations.

---

### 4.4. Design Notes

- Completion logic is centralized in the **VesselVisitExecution** aggregate to guarantee lifecycle consistency.
- The **Service layer** orchestrates the use case but delegates all business invariants to the domain.
- Once completed, the VVE is treated as **read-only**, except through authorized correction flows (not covered in this user story).
- Audit logging is intrinsic to the aggregate, ensuring traceability for operational statistics and compliance.

This design adheres to **DDD**, **GRASP**, and **Clean Architecture** principles, ensuring low coupling, high cohesion, and clear separation of concerns.
