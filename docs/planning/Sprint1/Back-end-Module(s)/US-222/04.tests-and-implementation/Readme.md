# **US2.2.2 – Manage Vessels (Create, Search, Update)**

---

## **4. Tests**

### **4.1. Unit Tests**

The following unit tests were implemented to validate the **domain logic** and **application service** behavior.

#### **Domain Layer (Vessel Aggregate)**

**Class:** `Vessel`
**Tests covered:**

* Create Vessel with valid data (IMO, Name, Owner, VesselTypeId).
* Reject invalid IMO numbers (wrong format / invalid check digit).
* Reject empty or too-short names (<5 chars).
* Reject empty or too-short owners (<5 chars).
* Reject VesselTypeId with empty GUID.
* `UpdateName` and `UpdateOwner` correctly update values and preserve invariants.

#### **Value Object: `ImoNumber`**

**Tests covered:**

* Accept valid IMO numbers (e.g., `IMO 9706906`).
* Reject empty, malformed, or invalid check digit formats.
* Maintain immutability and correct string representation (`ToString()` returns `IMO XXXXXXX`).

#### **Application Layer (VesselService)**

**Tests covered:**

* `CreateAsync()` creates a new Vessel if the IMO number is unique and VesselType exists.
* Rejects duplicate IMO numbers.
* Rejects when referenced VesselType does not exist.
* `GetByImoNumberAsync()` retrieves correct Vessel DTO.
* `PatchByImoAsync()` updates only provided fields (`Name`, `Owner`) and leaves others unchanged.
* `GetByFilterAsync()` returns filtered lists of vessels based on criteria.

**Tools used:**

* **xUnit** (testing framework)
* **Moq** (mocking repositories, logger, and UnitOfWork)

#### **Sample Test Example (xUnit)**

```csharp
[Fact]
public async Task CreateAsync_ShouldCreateVessel_WhenValidData()
{
    // Arrange
    var vesselType = new VesselType("Container", "Large Ship", 10, 5, 3, 1000);
    var dto = new CreatingVesselDto("IMO 9706906", "Ever Given", "Evergreen Marine", vesselType.Id);

    var repoMock = new Mock<IVesselRepository>();
    var typeRepoMock = new Mock<IVesselTypeRepository>();
    typeRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
        .ReturnsAsync(vesselType);

    var uowMock = new Mock<IUnitOfWork>();
    var loggerMock = new Mock<ILogger<VesselService>>();

    var service = new VesselService(uowMock.Object, repoMock.Object, typeRepoMock.Object, loggerMock.Object);

    // Act
    var result = await service.CreateAsync(dto);

    // Assert
    Assert.Equal(dto.ImoNumber, result.ImoNumber.ToString());
    Assert.Equal(dto.Name, result.Name);
}
```

---

## **5. Construction (Implementation)**

The implementation followed the **DDD layered architecture** established in previous user stories:

| **Layer**              | **Main Classes / Components**         | **Responsibilities**                                                    |
| :--------------------- | :------------------------------------ | :---------------------------------------------------------------------- |
| **Presentation (API)** | `VesselController`                    | Exposes REST endpoints (`GET`, `POST`, `PATCH`) for vessel management.  |
| **Application**        | `VesselService`, `VesselFactory`      | Orchestrates domain logic, validates input, transforms DTOs ↔ Entities. |
| **Domain**             | `Vessel`, `ImoNumber`, `VesselTypeId` | Enforces business invariants and core rules.                            |
| **Infrastructure**     | `VesselRepository`, `IUnitOfWork`     | Handles persistence and transaction consistency.                        |
| **Cross-cutting**      | `ILogger<T>`                          | Logs all API and domain-level actions for audit traceability.           |

**Key construction highlights:**

* IMO number validation encapsulated in the `ImoNumber` Value Object.
* Factory pattern (`VesselFactory`) ensures consistency of entity creation and DTO conversion.
* Repository pattern provides persistence abstraction for testability.
* Logging via `ILogger` (Serilog) records each operation.
* Exception handling unified through `BusinessRuleValidationException`.

---

## **6. Integration and Demo**

Integration testing was performed through the REST API using **HTTP request scripts (.http)** executed in **Visual Studio Code** and **Postman**.

**Endpoints tested:**

| HTTP Method | Endpoint                    | Purpose                                     |
| :---------- | :-------------------------- | :------------------------------------------ |
| `GET`       | `/api/vessel`               | List all registered vessels.                |
| `GET`       | `/api/vessel/id/{id}`       | Retrieve a specific vessel by ID.           |
| `GET`       | `/api/vessel/imo/{imo}`     | Retrieve a vessel by IMO number.            |
| `GET`       | `/api/vessel/name/{name}`   | Search vessels by name.                     |
| `GET`       | `/api/vessel/owner/{owner}` | Search vessels by owner/operator.           |
| `GET`       | `/api/vessel/filter`        | Multi-criteria filtering.                   |
| `POST`      | `/api/vessel`               | Register a new vessel record.               |
| `PATCH`     | `/api/vessel/imo/{imo}`     | Update an existing vessel (partial update). |

**Integration Results**

* All valid requests return correct HTTP codes:

    * `201 Created` on successful registration.
    * `200 OK` on successful retrieval/update.
    * `400 Bad Request` on validation errors.
    * `404 Not Found` when vessel/type doesn’t exist.
* All logs successfully recorded in **Serilog console and file output**.
* Verified data persisted in **PostgreSQL** using EF Core migrations.

---

## **7. Observations**

* The implementation of this US consolidates the **Vessel aggregate** as a key component of the domain, directly linked to the **VesselType aggregate** from US2.2.1.
* Business rules for IMO validation, ownership, and naming are **fully encapsulated** in the domain model, ensuring consistency regardless of API entry points.
* All operations respect **transactional integrity** via the `UnitOfWork` pattern.
* Future extensions could include:

    * Soft-delete or status field (`Active/Inactive`).
    * Support for vessel flag, dimensions, and registry details.
    * Batch imports of vessels from external registries (CSV or XML).
* The approach ensures full alignment with **DDD and SOLID principles**, maintaining testability and traceability through structured logging.
