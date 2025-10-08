# US2.2.4 – Register and Update Storage Areas

## 4. Tests

**Test Strategy**

* **Unit Tests**: validar regras de negócio no Aggregate Root `StorageArea` (ex.: `occupancy ≤ maxCapacity`, descrição mínima/máxima, nome único).
* **Integration Tests**: validar persistência com `StorageAreaRepository`.
* **API/Functional Tests**: testar os endpoints do `StorageAreasController`.

**Main Test Cases**

| Test ID | Description                                     | Input                                                                                                  | Expected Output                |
| ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| TC01    | Register new Storage Area (Yard) successfully   | `{name:"Yard A", type:"Yard", maxBays:2, maxRows:2, maxTiers:2, distances:[{dock:"D1",distance:1.5}]}` | `201 Created` + StorageAreaDto |
| TC02    | Reject duplicate name                           | Same name as existing storage area                                                                     | `400 Bad Request`              |
| TC03    | Reject invalid description (too long)           | description length > 100 chars                                                                         | `400 Bad Request`              |
| TC04    | Reject occupancy > max capacity                 | Create/Update with `currentOccupancy = 20` and `maxCapacity = 10`                                      | `400 Bad Request`              |
| TC05    | Register with multiple docks                    | distances with 2 different DockCodes                                                                   | `201 Created`                  |
| TC06    | Reject duplicate dock distance                  | distances list with same DockCode twice                                                                | `400 Bad Request`              |
| TC07    | Update storage area type                        | `PATCH /api/storageareas/{id}` `{type:"Warehouse"}`                                                    | `200 OK` + updated dto         |
| TC08    | Get all storage areas                           | `GET /api/storageareas`                                                                                | `200 OK` + list of areas       |
| TC09    | Get storage area by ID                          | `GET /api/storageareas/{id}`                                                                           | `200 OK` + dto                 |
| TC10    | Get storage area by Name                        | `GET /api/storageareas/name/Yard A`                                                                    | `200 OK` + dto                 |
| TC11    | Get dock distances by ID                        | `GET /api/storageareas/distances?id={id}`                                                              | `200 OK` + list of distances   |
| TC12    | Reject dock distances query for non-existing ID | `GET /api/storageareas/distances?id={invalid}`                                                         | `404 Not Found`                |

---

## 5. Construction (Implementation)

* **Domain Layer**

    * Aggregate Root: `StorageArea`
    * Entities/Value Objects:

        * `StorageAreaId` (VO)
        * `StorageAreaDockDistance` (VO)
    * DTOs: `CreatingStorageAreaDto`, `StorageAreaDto`, `StorageAreaDockDistanceDto`
    * Factory: `StorageAreaFactory`
    * Repository Interface: `IStorageAreaRepository`

* **Application Layer**

    * Service: `StorageAreaService`

        * `GetAllAsync()`
        * `GetByIdAsync(StorageAreaId)`
        * `GetByNameAsync(string)`
        * `GetDistancesToDockAsync(string? name, StorageAreaId? id)`
        * `CreateAsync(CreatingStorageAreaDto)`

* **Infrastructure Layer**

    * EF Core Mapping: `StorageAreaEntityTypeConfiguration`
    * Repository Implementation: `StorageAreaRepository`

* **Presentation Layer**

    * Controller: `StorageAreasController`

        * `GET /api/storageareas`
        * `GET /api/storageareas/id/{id}`
        * `GET /api/storageareas/name/{name}`
        * `GET /api/storageareas/distances`
        * `POST /api/storageareas`

---

## 6. Integration and Demo

**Integration Steps:**

1. Apply latest EF migrations to update DB schema with `StorageArea` aggregate.
2. Configure dependency injection for `IStorageAreaRepository` and `StorageAreaService`.
3. Add logging (Serilog) for all service and controller actions.
4. Run API endpoints via Swagger or IntelliJ HTTP Client to verify behavior.
5. Integrate with **Dock management module** (ensuring DockCodes used in distances exist).
6. Demonstrate with sample requests:

    * Register new Yard with multiple dock distances.
    * Update capacity and validate occupancy constraint.
    * Query distances by name or ID.

---

## 7. Observations

* Validation logic (e.g., **occupancy ≤ maxCapacity**) is enforced inside the `StorageArea` aggregate root.
* Each `StorageArea` **may or may not** be linked to multiple docks; when linked, **distances must be unique per DockCode**.
* Distances are manually inserted by the Port Authority Officer.
* Current scope does **not include Physical Resources**, but the model anticipates future extension with a `PhysicalResources` aggregate.
* Logging is integrated at **domain** and **controller** levels to ensure traceability.
* Updating capacity must ensure no existing containers are "lost" (business constraint check).
