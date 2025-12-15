# US4.1.12 – Manage the catalog of Incident Types

## 4. Tests

### 4.1. Test Strategy

Testing for this user story is organized into three complementary levels:

* **Unit Tests (Domain):** validate domain invariants and behavior of `IncidentType` and `SeverityFactory` (code format, severity constraints, parent updates).
* **Unit/Integration Tests (Repository):** validate MongoDB queries relevant to hierarchy operations (`getRootTypes`, `getDirectChilds`, `getSubTreeFromParentNode`).
* **API Tests (Controller/Routes):** validate endpoint behavior, request validation, and expected HTTP responses for create/update/read operations, including hierarchy browsing.

### 4.2. Suggested Test Cases

#### A) Domain Tests (IncidentType / Severity)

* **T01 – Create IncidentType with valid data**
  Expect: instance created, `updatedAt = null`, parent accepted when `null`.
* **T02 – Reject invalid code format** (`INC001`, `T-INC01`, `T-INC0001`)
  Expect: `BusinessRuleValidationError` with `InvalidCodeFormat`.
* **T03 – Reject invalid parent code format**
  Expect: `BusinessRuleValidationError`.
* **T04 – SeverityFactory rejects unsupported severity** (`"Low"`)
  Expect: `BusinessRuleValidationError` with `InvalidSeverity`.
* **T05 – Update parent to null** (`changeParent(null)` or `clearParent()`)
  Expect: parent becomes `null`, `updatedAt` updated.

#### B) Repository Tests (Mongo + Mongoose)

* **T06 – getRootTypes returns only roots**
  Setup: create nodes with `parent=null` and with `parent=...`
  Expect: only roots returned.
* **T07 – getDirectChilds returns only direct children**
  Setup: A -> B -> C
  Expect: children(A) = [B], not [C].
* **T08 – getSubTreeFromParentNode returns all descendants**
  Setup: A -> B -> C and A -> D
  Expect: subtree(A) contains B, C, D (order optionally by depth/code).

#### C) API Tests (Routes/Controllers)

* **T09 – POST /incidentTypes creates root**
  Expect: 200 OK + DTO.
* **T10 – POST /incidentTypes rejects duplicate code**
  Expect: 400 (or 409 if you standardize conflicts).
* **T11 – POST /incidentTypes rejects non-existing parent**
  Expect: 400 with domain/business error.
* **T12 – PUT /incidentTypes/:code updates and supports parentCode=null**
  Expect: 200 OK and parent cleared.
* **T13 – GET /incidentTypes/roots returns list**
  Expect: 200 OK + array.
* **T14 – GET /incidentTypes/:code/children returns children**
  Expect: 200 OK + array.
* **T15 – GET /incidentTypes/:code/subtree returns subtree**
  Expect: 200 OK + array.

---

## 5. Construction (Implementation)

### 5.1. Main Components Implemented

* **Domain**

    * `IncidentType` aggregate root with controlled mutation methods (`changeName`, `changeDescription`, `changeSeverity`, `changeParent` / `clearParent`).
    * `Severity` constrained type with `SeverityFactory.fromString`.
* **Persistence**

    * Mongoose schema `IncidentTypeSchema` with indexes:

        * `code` (unique + indexed)
        * `parent` (indexed)
* **Mapping**

    * `IncidentTypeMap` for Domain ↔ Persistence ↔ DTO conversion.
* **Repository**

    * `IncidentTypeRepo` implementing:

        * `findByCode`, `findByName`, `save`
        * `getRootTypes`
        * `getDirectChilds`
        * `getSubTreeFromParentNode` using `$graphLookup`
* **Application Service**

    * `IncidentTypeService` implementing:

        * `createAsync`, `updateAsync`, `getByCode`, `getByName`
        * `getRootTypes`, `getDirectChilds`, `getSubTreeFromParentNode`
    * Includes parent existence validation and cycle prevention on update.
* **Presentation/API**

    * Controllers for create/update/read plus hierarchy endpoints:

        * Roots: `GET /api/incidentTypes/roots`
        * Children: `GET /api/incidentTypes/:code/children`
        * Subtree: `GET /api/incidentTypes/:code/subtree`
    * Express routes with Celebrate/Joi validation
    * Dependency Injection registration via `dependencyInjectorLoader` and config tokens.

### 5.2. Efficiency Considerations

* Child retrieval uses MongoDB index on `parent` (`find({ parent: code })`), avoiding scanning the entire collection.
* Subtree retrieval uses MongoDB aggregation `$graphLookup`, avoiding iterative N+1 queries from the service layer.

---

## 6. Integration and Demo

### 6.1. Integrated Endpoints

* `POST /api/incidentTypes`
* `PUT /api/incidentTypes/:code`
* `GET /api/incidentTypes/:code`
* `GET /api/incidentTypes/search/name?name=...`
* `GET /api/incidentTypes/roots`
* `GET /api/incidentTypes/:code/children`
* `GET /api/incidentTypes/:code/subtree`

### 6.2. Demo Script (suggested)

1. **Create a root type**: Environmental Conditions (`T-INC001`, parent=null).
2. **Create children** under the root: Fog (`T-INC002`), Strong Winds (`T-INC003`).
3. **List roots** and confirm the root is returned.
4. **Load direct children** of `T-INC001`.
5. **Load subtree** of `T-INC001` and validate returned descendants.
6. **Update** `T-INC002` (change description, severity, or move parent to another valid root).
7. (Optional) Show rejection of invalid operations (duplicate code, invalid parent, cycle attempt).

---

## 7. Observations

* The hierarchical model is implemented using an **Adjacency List** (`parent` field), which is simple to maintain and efficient for direct child queries with proper indexing.
* For full hierarchy traversal, `$graphLookup` provides an efficient database-side approach, avoiding repeated queries.
* A future enhancement could include:

    * standardized error mapping (e.g., 409 Conflict for duplicates/avoided deletions),
    * an endpoint to return the hierarchy as a pre-built tree structure for the SPA,
    * a delete policy (hard delete vs soft delete) aligned with operational audit requirements and any downstream references (incidents/disruptions).
