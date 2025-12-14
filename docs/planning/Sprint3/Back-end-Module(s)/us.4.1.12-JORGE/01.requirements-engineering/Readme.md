# US4.1.12 – Manage the catalog of Incident Types

## 1. Requirements Engineering

### 1.1. User Story Description

As a **Port Authority Officer**, I want to **manage the catalog of Incident Types** so that the classification of operational disruptions remains **standardized**, **hierarchical**, and **clearly distinct from complementary tasks**, enabling consistent reporting, filtering, and operational decision-making.

### 1.2. Customer Specifications and Clarifications

**From the specifications document and client meetings:**

* The system must support a **hierarchical structure** of incident types (parent–child relationship), allowing incident types to be **grouped and filtered by parent**.
* The catalog must be manageable through **CRUD operations exposed via the REST API**.
* The SPA must provide an intuitive interface for **listing**, **filtering**, and **managing** the hierarchy.
* Each Incident Type must include:

    * **Unique code** (e.g., `T-INC001`)
    * **Name** (e.g., *Equipment Failure*)
    * **Detailed description**
    * **Severity classification** (e.g., *Minor, Major, Critical*)
* Example taxonomy (non-exhaustive):

    * **Environmental Conditions** → Fog, Strong Winds, Heavy Rain
    * **Operational Failures** → Crane Malfunction, Power Outage
    * **Safety/Security Events** → Security Alert

**Clarifications / Implementation decisions (team):**

* The hierarchy will be implemented using an **Adjacency List** approach in MongoDB: each Incident Type stores a `parentCode` (nullable for root types).
* Efficient retrieval of children will be ensured by an **index on `parentCode`**, and uniqueness by a **unique index on `code`** (MongoDB + Mongoose).
* The domain will prevent **cyclic hierarchies** (e.g., a node becoming its own ancestor/descendant) during create/update.

**From forum:**

> **Question:** How should we store hierarchical relationships in MongoDB without losing performance when listing children?
> **Answer:** Store `parentCode` in each child and create an index on `parentCode`. Use lazy loading in the SPA and (optionally) `$graphLookup` for subtree retrieval when necessary.

### 1.3. Acceptance Criteria

* **AC01:** The system supports **hierarchical Incident Types** (parent and child types), enabling grouping and filtering by parent.
* **AC02:** The REST API provides **CRUD operations** for Incident Types (Create, Read/List, Update, Delete).
* **AC03:** The SPA provides an intuitive UI to **list**, **filter**, **create**, **edit**, and **delete** Incident Types, including hierarchy navigation (e.g., tree view or parent-based filtering).
* **AC04:** Each Incident Type includes and persists: **unique code**, **name**, **description**, and **severity** (Minor/Major/Critical).
* **AC05:** The system enforces **uniqueness of the code** (e.g., `T-INC001` cannot be reused).
* **AC06:** The system prevents invalid hierarchy states, including **cycles** and **non-existent parent references**.
* **AC07:** Filtering supports, at minimum: **by parent type**, and **by severity**, and a general search by **code/name**.

### 1.4. Found out Dependencies

* None (direct).
  (Indirectly, this catalog may be referenced by Incident/Disruption records later, but that is outside the scope of this user story.)

### 1.5. Input and Output Data

**Input Data (API / SPA):**

* `code` (string, required, unique; format example: `T-INC001`)
* `name` (string, required)
* `description` (string, required)
* `severity` (enum string: `Minor | Major | Critical`, required)
* `parentCode` (string, optional/nullable; must reference an existing Incident Type code)

**Output Data (API / SPA):**

* Incident Type representation:

    * `code`
    * `name`
    * `description`
    * `severity`
    * `parentCode`
    * (optional) `childrenCount` (useful for UI)
    * (optional) `createdAt`, `updatedAt` (audit metadata if adopted)

### 1.6. System Sequence Diagram (SSD)

![System Sequence Diagram - Alternative One](./puml/us4.1.12-sequence-diagram.png)

**SSD (textual description to generate the diagram):**

1. Port Authority Officer selects “Incident Types” management in the SPA.
2. SPA requests the list of root types: `GET /api/incident-types?parentCode=null`.
3. Officer expands a parent type; SPA requests children: `GET /api/incident-types?parentCode={code}`.
4. Officer creates a new type:

    * SPA sends `POST /api/incident-types` with `{ code, name, description, severity, parentCode? }`.
    * System validates uniqueness, parent existence, and cycle rules; persists the type; returns `201 Created`.
5. Officer edits an existing type:

    * SPA sends `PUT /api/incident-types/{code}` with changed fields.
    * System validates constraints; updates; returns `200 OK`.
6. Officer deletes a type:

    * SPA sends `DELETE /api/incident-types/{code}`.
    * System deletes (or blocks if business rules require), returns `200 OK/204 No Content` or an error if not permitted.

### 1.7. Other Relevant Remarks

* **Persistence strategy:** MongoDB + Mongoose with `parentCode` adjacency list.
* **Performance:** `parentCode` indexed for efficient child retrieval; `code` uniquely indexed to enforce catalog integrity.
* **UI strategy:** SPA should use **lazy loading** for hierarchy expansion (fetch children on demand) to avoid loading the entire tree unnecessarily.
* **Data integrity:** Cycle prevention and parent existence checks must be enforced at the application/domain level (MongoDB does not enforce relational constraints by default).

---
