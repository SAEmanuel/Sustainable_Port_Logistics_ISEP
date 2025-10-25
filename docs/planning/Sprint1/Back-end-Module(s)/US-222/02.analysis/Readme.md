# **US2.2.2 – Register and Update Vessel Records**

## **2. Analysis**

---

### **2.1. Relevant Domain Model Excerpt**

![Domain Model – US2.2.2](./puml/us2.2.2-domain-model.svg)

This excerpt focuses on the **Vessel Aggregate** and its relationship with the **VesselType** aggregate created in *US2.2.1*.

---

### **Main Concepts Identified**

#### **Vessel (Aggregate Root)**

**Attributes:**

| Attribute      | Description                                     | Type / Notes                                |
| -------------- | ----------------------------------------------- | ------------------------------------------- |
| `Id`           | Surrogate primary key                           | `VesselId` (Value Object wrapping a `Guid`) |
| `ImoNumber`    | Natural key ensuring vessel uniqueness          | `ImoNumber` (Value Object)                  |
| `Name`         | Vessel name                                     | `string` (≥ 5 chars, non-null)              |
| `Owner`        | Operator or owner company                       | `string` (≥ 5 chars, non-null)              |
| `VesselTypeId` | Foreign key referencing an existing Vessel Type | `VesselTypeId`                              |

**Behaviours:**

* `UpdateName(name)` → Validates length and non-nullity.
* `UpdateOwner(owner)` → Validates length and non-nullity.
* `UpdateImoNumber(imoNumber)` and `UpdateVesselType(vesselTypeId)` → **Private**, used internally during creation.

**Design Notes:**

* Acts as the **Aggregate Root** for all vessel-related entities.
* Responsible for enforcing **domain invariants** (name, owner, and type integrity).

---

#### **ImoNumber (Value Object)**

* Represents the **International Maritime Organization (IMO)** identification number.
* Composed of **7 digits**, where the last is a **checksum**.
* Provides validation logic (`ValidateFormat`, `ValidateCheckDigit`) ensuring domain consistency.
* **Immutable** once created and used as the **natural key** for `Vessel`.

---

#### **VesselType (External Aggregate Reference)**

* Defined in **US2.2.1 – Create and Manage Vessel Types**.
* Every `Vessel` must reference an existing `VesselType` through its `VesselTypeId`.
* Referential integrity enforced by the **VesselService** prior to persistence.

---

#### **Owner (String Attribute)**

* Represents the organization or person responsible for vessel operation.
* Must not be null, empty, or shorter than 5 characters.
* Potential candidate for evolution into a **Value Object (OwnerName)** or **Entity (Owner)** in future user stories (e.g., *US2.2.5 – Manage Vessel Ownership*).

---

### **2.2. Business Rules and Invariants**

| Rule   | Description                                        | Enforcement                                            |
| ------ | -------------------------------------------------- | ------------------------------------------------------ |
| **R1** | IMO Number must be valid and unique                | `ImoNumber` validation + service-level duplicate check |
| **R2** | Name must be non-empty and ≥ 5 chars               | Domain validation in `SetName()`                       |
| **R3** | Owner must be non-empty and ≥ 5 chars              | Domain validation in `SetOwner()`                      |
| **R4** | VesselTypeId must reference an existing VesselType | Verified at the application layer                      |
| **R5** | IMO Number is immutable after creation             | No public setter or update method                      |
| **R6** | Updates allowed only for Name and Owner            | Enforced in `VesselService.PatchByImoAsync()`          |

---

### **2.3. Supporting Domain Principles**

* **Encapsulation of Invariants:**
  All validation logic (length, null checks, IMO checksum) is embedded within the domain layer.

* **Consistency via Value Objects:**
  `ImoNumber`, `VesselId`, and `VesselTypeId` are implemented as **Value Objects** ensuring strong typing and equality semantics.

* **Referential Integrity:**
  Before persisting a new vessel, the system checks that the `VesselType` exists in the repository.

* **Uniqueness Guarantee:**
  Duplicate IMO numbers are prevented at the domain service level before commit.

---

### **2.4. Cross-Cutting Concerns**

* **Logging:**
  All CRUD operations are logged using `ILogger<VesselService>` and `ILogger<VesselController>`, ensuring traceability and audit compliance.

* **Error Handling:**

    * `BusinessRuleValidationException` → Violated invariants (400 Bad Request).
    * Entity not found → 404 Not Found.
    * Repository or system errors → 500 Internal Server Error.

* **DTO Usage:**
  `CreatingVesselDto`, `UpdatingVesselDto`, and `VesselDto` isolate the domain model from external representation (REST API), following the **DTO Pattern**.

