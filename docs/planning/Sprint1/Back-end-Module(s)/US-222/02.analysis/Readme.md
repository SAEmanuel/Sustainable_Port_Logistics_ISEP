# **US2.2.2 – Register and Update Vessel Records**

## **2. Analysis**

---

### **2.1. Relevant Domain Model Excerpt**

![Domain Model](./puml/us2.2.2-domain-model.svg)

**Concepts identified:**

---

#### **Vessel (Aggregate Root)**

**Attributes:**

* `Id` → Surrogate key (`VesselId`).
* `ImoNumber` → Natural key (Value Object).
* `Name` → Vessel name.
* `Owner` → Operator or owning entity.
* `VesselTypeId` → Foreign key referencing an existing `VesselType`.

**Behaviors (methods):**

* `UpdateName(name)` → Validates minimum length and non-nullity.
* `UpdateOwner(owner)` → Validates minimum length and non-nullity.
* `UpdateImoNumber(imoNumber)` and `UpdateVesselType(vesselTypeId)` → Private (used internally, not accessible externally).

---

#### **ImoNumber (Value Object)**

* Represents the **International Maritime Organization number** (7 digits, final digit as check digit).
* Validates format and check digit upon instantiation.
* Immutable once created.
* Ensures global uniqueness of vessels across the system.

---

#### **VesselType (Entity / Aggregate Root)**

* Defined and created in **US2.2.1 – Create and Manage Vessel Types**.
* Each `Vessel` must reference an existing `VesselType` through `VesselTypeId`.
* Acts as a foreign aggregate dependency for `Vessel`.

---

#### **Owner / Operator (string property)**

* Represents the company or entity responsible for the vessel’s operation.
* Must not be null or blank.
* Must have a minimum length of **5 characters**.
* Candidate for future refactoring into a **Value Object** or **Entity** if ownership becomes relevant for authorization or contracts (see dependency with US2.2.5).

---

### **Invariants and Business Rules**

* A `Vessel` **must always** satisfy the following conditions:

  * Valid and unique `ImoNumber`.
  * Non-empty `Name` (≥ 5 characters).
  * Non-empty `Owner` (≥ 5 characters).
  * Valid and existing `VesselTypeId` (not empty GUID).
* **ImoNumber is immutable** after creation (serves as the natural key).
* **Duplicate IMO numbers are forbidden**, enforced at the service layer before persistence.
* **Updates** are restricted to `Name` and `Owner` attributes.
* Referential integrity is mandatory: every `Vessel` must reference an existing `VesselType`.

---

### **2.2. Other Remarks**

* The `ImoNumber` value object encapsulates the **validation and checksum logic**, ensuring domain consistency without external dependencies.
* **Search operations** (`GetByImo`, `GetByName`, `GetByOwner`, `GetFilter`) are implemented at the **Application Service layer** (`VesselService`) and not modeled inside the domain aggregate.
* **Logging and traceability** are handled via structured logging (`ILogger`) within both `VesselService` and `VesselController`, ensuring auditability of all CRUD operations.
* **Error handling strategy:**

  * Violations of domain rules throw `BusinessRuleValidationException`.
  * Controller layer translates exceptions into appropriate HTTP responses:

    * `400 Bad Request` → Invalid input or business rule violation.
    * `404 Not Found` → Entity not found in repository.
