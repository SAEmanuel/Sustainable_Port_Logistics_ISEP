## 3. Design – User Story Realization

### 3.1. Rationale

| Interaction ID | Responsible class | Justification |
|----------------|-----------------|---------------|
| Step 1 | `ComplementaryTaskController` | Controller handles REST transport |
| Step 2 | `ComplementaryTaskService` | Application Service coordinates orchestration, validation, and persistence |
| Step 3 | `ComplementaryTaskScheduler` | Domain Service detects conflicts and ongoing impact |
| Step 4 | `ComplementaryTaskRepo` | Repository abstracts persistence |
| Step 5 | `ComplementaryTaskMap` | Mapper converts domain to DTOs |
| Step 6 | `ComplementaryTaskAuditRepo` | Stores append-only audit logs |
| Step 7 | `ComplementaryTask` | Aggregate Root enforces invariants and internal consistency |

---

### 3.2. Sequence Diagram (SSD)

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
title Sequence Diagram – Manage Complementary Task (US4.1.15)

actor "Logistics Operator" as Operator
boundary "SPA" as SPA
control "ComplementaryTaskController" as Ctrl
control "ComplementaryTaskService" as App
control "ComplementaryTaskScheduler" as Scheduler
entity "ComplementaryTaskRepo" as Repo
entity "ComplementaryTaskAuditRepo" as AuditRepo
control "ComplementaryTaskMap" as Map

== List/Filter Tasks ==
Operator -> SPA : Open Complementary Tasks screen
SPA -> Ctrl : GET /api/complementary-tasks?vessel=X&start=...&end=...&status=...
Ctrl -> App : listTasks(filter)
App -> Repo : find(filter)
App -> Scheduler : markOngoingImpact(tasks)
Scheduler --> App : tasks with impact flag
App -> Map : toDTO(tasks)
Map --> App : TaskDTO[]
App --> Ctrl : 200 OK\nBody: TaskDTO[]
Ctrl --> SPA : render tasks (highlight ongoing)

== Create Task ==
Operator -> SPA : Fill create form + reason
SPA -> Ctrl : POST /api/complementary-tasks
Ctrl -> Ctrl : validate DTO (required fields, reason)
Ctrl -> App : createTask(dto, author)
App -> Scheduler : checkConflicts(dto)
alt Blocking conflict
  Scheduler --> App : conflicts[]
  App --> Ctrl : 409 Conflict\nBody: conflicts[]
else No blocking conflict
  App -> Repo : save(task)
  App -> AuditRepo : append(taskId, author, reason, diff)
  App -> Map : toDTO(task)
  Map --> App : TaskDTO
  App --> Ctrl : 200 OK\nBody: TaskDTO
end

== Update Task ==
Operator -> SPA : Edit task fields + reason
SPA -> Ctrl : PATCH /api/complementary-tasks/{code}
Ctrl -> Ctrl : validate DTO
Ctrl -> App : updateTask(code, dto, author)
App -> Scheduler : checkConflicts(dto)
alt Blocking conflict
  Scheduler --> App : conflicts[]
  App --> Ctrl : 409 Conflict
else OK
  App -> Repo : save(task)
  App -> AuditRepo : append(...)
  App -> Map : toDTO(task)
  Map --> App : TaskDTO
  App --> Ctrl : 200 OK\nBody: TaskDTO
end

== Fix Category ==
Operator -> SPA : Fix category + reason
SPA -> Ctrl : PATCH /api/complementary-tasks/{code}/fix-category
Ctrl -> App : fixCategory(code, newCategory, author)
App -> Scheduler : validateCategoryActive(newCategory)
alt Inactive category
  App --> Ctrl : 400 Bad Request
else OK
  App -> Repo : save(task)
  App -> AuditRepo : append(...)
  App --> Ctrl : 200 OK\nBody: TaskDTO
end

@enduml