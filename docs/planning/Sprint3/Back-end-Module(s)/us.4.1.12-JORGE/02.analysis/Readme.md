# US4.1.12 – Manage the catalog of Incident Types

## 2. Analysis

### 2.1. Relevant Domain Model Excerpt

Within the **Operational Disruptions / Incident Classification** bounded context, the core concept introduced/extended by this user story is the **IncidentType** taxonomy.

#### Aggregate

**IncidentType (Aggregate Root)**
Represents a standardized classification node in a hierarchy (tree). The hierarchy is modeled through a self-reference to a parent type.

**Attributes**

* `code` (unique, immutable identifier; e.g., `T-INC001`)
* `name`
* `description`
* `severity` (enum: `Minor | Major | Critical`)
* `parentCode` (optional; references another IncidentType by code)

**Relationships**

* `IncidentType (parent) 1 ── 0..* IncidentType (children)` via `parentCode`

**Key invariants / business rules**

* `code` must be unique and should not change after creation.
* `severity` must be one of the supported values.
* If `parentCode` is provided, it must reference an existing IncidentType.
* The hierarchy must remain a **DAG tree** (no cycles): a type cannot become an ancestor/descendant of itself.

#### Domain excerpt (PlantUML class diagram)

![Domain Model](./puml/us4.1.12-domain-model.png)


### 2.2. Other Remarks

* **Persistence approach (MongoDB + Mongoose):** adjacency list using `parentCode` (nullable), with a **unique index** on `code` and a **non-unique index** on `parentCode` to ensure efficient child retrieval.
* **Deletion semantics (recommended):** if the type has children or is referenced by disruption/incident records, deletion should be blocked (409) or replaced by a soft-delete strategy (e.g., `isActive=false`), depending on your broader data-retention rules.
* **Separation from complementary tasks:** IncidentType is a dedicated catalog for disruption classification; it should not be reused as a generic “task type” to avoid mixing concerns and ambiguous semantics.
