## 3. Design – User Story Realization (US4.1.6)

### 3.1. Rationale

***Note that SSD – Alternative One is adopted.***

| Interaction ID | Question: Which class is responsible for... | Answer | Justification (with patterns) |
| -------------: | ------------------------------------------- | ------ | ----------------------------- |
| Step 1 | interacting with the actor (HTTP request) | ResourceAllocationController | Controller (GRASP) to handle REST interaction and request parameter parsing, keeping transport concerns out of the domain. |
|  | coordinating the use case? | PhysicalResourceService | Application Service (DDD) coordinating the query flow; orchestrates repositories and aggregation logic without embedding business rules in the controller. |
| Step 2 | validating request parameters (resource, period)? | PhysicalResourceController + PhysicalResourceService | Split validation: Pure Fabrication for parameter presence/type checks; Information Expert for semantic rules (e.g., from < to, supported resource types). |
| Step 3 | retrieving eligible Operation Plans? | OperationPlanRepo | Repository abstracts persistence and filtering logic (e.g., status = SAVED, overlapping period); Low Coupling with storage technology. |
| Step 4 | extracting operations relevant to the query? | PhysicalResourceService | Controller (GRASP) role at application level; coordinates filtering by time window and resource identity across plans. |
| Step 5 | computing total allocated time and operation count? | PhysicalResourceService | Information Expert over aggregation rules; logic spans multiple aggregates and therefore must not live inside OperationPlan. |

#### Systematization

According to the taken rationale, the conceptual classes promoted to software classes are:

- OperationPlan (Aggregate Root, read-only usage)
- Operation (Entity inside the aggregate)
- StaffAssignment (Value Object)

Other software classes (i.e., Pure Fabrication) identified:

- PhysicalResourceController
- PhysicalResourceService
- OperationPlanRepo
