# US2.2.5 – Create Shipping Agent Organizations

---

## 4. Tests

### 4.1. Purpose
The main goal of testing this user story is to verify the correct behavior of the system when creating **Shipping Agent Representatives**, ensuring that all business rules and constraints are enforced.

### 4.2. Scope
The tests cover the **Domain**, **Application Service**, and **Controller** layers:

#### Unit Tests
- **Domain (Entity):** validation of rules such as non-empty name, valid dimension constraints, and capacity calculation.
- **Application Service:** validation of name uniqueness, repository integration, and transactional behavior.
- **Controller:** validation of HTTP responses, exception handling, and DTO serialization.

#### Integration Tests (API)
- API endpoints `/api/ShippingAgentRepresentative` tested via HTTP requests (Postman collection):  
  - `GET /api/ShippingAgentRepresentative` – retrieve all representatives  
  - `GET /api/ShippingAgentRepresentative/{id}` – retrieve by representative ID  
  - `GET /api/ShippingAgentRepresentative/name/{name}` – retrieve by Name  
  - `GET /api/ShippingAgentRepresentative/email/{email}` – retrieve by Email  
  - `GET /api/ShippingAgentRepresentative/status/{status}` – retrieve by Status  
  - `POST /api/ShippingAgentRepresentative` – create  
  - `PATCH /api/ShippingAgentRepresentative/email/{email}` – update by email  

### 4.3. Key Test Cases
| Layer | Test Case | Expected Result |
| ------ | ---------- | ---------------- |
| **Domain** | Creating `ShippingAgentRepresentative` with invalid email | `BusinessRuleValidationException` thrown |
| **Domain** | Creating `ShippingAgentRepresentative` with invalid phone | `BusinessRuleValidationException` thrown |
| **Domain** | Creating `ShippingAgentRepresentative` with invalid status | `ArgumentException` thrown |
| **Domain** | Adding duplicate notification | `BusinessRuleValidationException` thrown |
| **Domain** | Valid creation of `ShippingAgentRepresentative` | Object initialized with valid ID, name, citizen ID, email, phone, status, SAO, and empty notifications |
| **Domain** | Two representatives with same ID are equal | `Equals` returns `true`, identical hash codes |
| **Service** | Adding new representative with existing citizen ID | `BusinessRuleValidationException: "Representative with Citizen ID X already exists"` |
| **Service** | Adding new representative for non-existing SAO | `BusinessRuleValidationException: "SAO X not found"` |
| **Service** | Adding new representative when SAO already has a representative | `BusinessRuleValidationException: "SAO X already has a representative"` |
| **Service** | Valid creation of representative | Returns `ShippingAgentRepresentativeDto` with generated ID and provided data |
| **Service** | Getting representative by ID (exists) | Returns corresponding `ShippingAgentRepresentativeDto` |
| **Service** | Getting representative by ID (not found) | Returns `null` |
| **Controller** | `GET /api/ShippingAgentRepresentative` when records exist | HTTP `200 OK` with list of DTOs |
| **Controller** | `GET /api/ShippingAgentRepresentative/{id}` when found | HTTP `200 OK` with DTO |
| **Controller** | `GET /api/ShippingAgentRepresentative/{id}` when not found | HTTP `404 NotFound` |
| **Controller** | `GET /api/ShippingAgentRepresentative/name/{name}` valid | HTTP `200 OK` with matching DTO |
| **Controller** | `GET /api/ShippingAgentRepresentative/name/{name}` not found | HTTP `404 NotFound` with error message |
| **Controller** | `GET /api/ShippingAgentRepresentative/email/{email}` valid | HTTP `200 OK` with DTO |
| **Controller** | `GET /api/ShippingAgentRepresentative/status/{status}` valid | HTTP `200 OK` with DTO |
| **Controller** | `POST /api/ShippingAgentRepresentative` valid input | HTTP `201 Created` with DTO body |
| **Controller** | `POST /api/ShippingAgentRepresentative` invalid (business rule violation) | HTTP `400 BadRequest` with error message |
| **Controller** | `PATCH /api/ShippingAgentRepresentative/email/{email}` valid | HTTP `200 OK` with updated DTO |

---

## 5. Construction (Implementation)

### 5.1. Layers Involved
The implementation follows a **DDD + Clean Architecture** approach, consisting of the following layers:

The implementation follows a **DDD + Clean Architecture** approach, consisting of the following layers:

| Layer | Description | Example Classes |
| ------ | ------------ | ---------------- |
| **Presentation** | Handles HTTP requests and responses. | `ShippingAgentRepresentativeController` |
| **Application** | Coordinates business operations and validation flow. | `IShippingAgentRepresentativeService`, `ShippingAgentRepresentativeService` |
| **Domain** | Contains core business logic and invariants. | `ShippingAgentRepresentative`, `ShippingAgentRepresentativeId` |
| **Infrastructure** | Handles data persistence and transaction management. | `IShippingAgentRepresentativeRepository`, `UnitOfWork` |
| **Cross-cutting** | Logging and monitoring. | `ILogger<T>` |


### 5.2. Main Code Elements

#### (a) Domain – `ShippingAgentOrganization`

Implements all business rules:

```csharp
if (string.IsNullOrWhiteSpace(name))
    throw new BusinessRuleValidationException("Name cannot be empty.");

if (!email.IsValid())
    throw new BusinessRuleValidationException("Invalid email address.");

if (!phoneNumber.IsValid())
    throw new BusinessRuleValidationException("Invalid phone number.");

if (!Enum.IsDefined(typeof(Status), status))
    throw new ArgumentException("Invalid status value.");
````

#### (b) Application Service – `ShippingAgentOrganizationService`

Coordinates validation and persistence:

```csharp
public async Task<ShippingAgentRepresentativeDto> AddAsync(CreatingShippingAgentRepresentativeDto dto)
{
    if (await _repo.GetByCitizenIdAsync(dto.CitizenId) != null)
        throw new BusinessRuleValidationException($"Representative with Citizen ID '{dto.CitizenId}' already exists.");

    var sao = await _saoRepo.GetByCodeAsync(new ShippingOrganizationCode(dto.Sao))
              ?? throw new BusinessRuleValidationException($"SAO '{dto.Sao}' not found.");

    if (await _repo.GetBySaoAsync(sao.ShippingOrganizationCode) != null)
        throw new BusinessRuleValidationException($"SAO '{dto.Sao}' already has a representative.");

    var entity = new ShippingAgentRepresentative(
        dto.Name, dto.CitizenId, dto.Nationality, dto.Email, dto.PhoneNumber, 
        Enum.Parse<Status>(dto.Status, true), sao.ShippingOrganizationCode
    );

    await _repo.AddAsync(entity);
    await _unitOfWork.CommitAsync();

    return new ShippingAgentRepresentativeDto(entity);
}
```

#### (c) Controller – `ShippingAgentOrganizationController`

Exposes REST endpoints:

```csharp
public async Task<ActionResult<ShippingAgentRepresentativeDto>> Create([FromBody] CreatingShippingAgentRepresentativeDto dto)
{
    try
    {
        var sar = await _service.AddAsync(dto);
        return CreatedAtAction(nameof(GetGetById), new { id = sar.Id }, sar);
    }
    catch (BusinessRuleValidationException ex)
    {
        return BadRequest(new { Message = ex.Message });
    }
}
```

---

## 6. Integration and Demo

* The implemented API endpoints were tested using **Postman**, confirming full integration between layers.
* Successful requests return `ShippingAgentRepresentativeDto` objects serialized in JSON.
* Error cases return detailed validation messages with proper HTTP codes (`400`, `404`).
* Logging is available through **Serilog**, recording creation, update, and notification events.

**Example demo scenario:**

1. `POST /api/ShippingAgentRepresentative` → creates `"John Doe"` for SAO `"REP001XYZ"`
2. `GET /api/ShippingAgentRepresentative/name/John Doe` → confirms existence




