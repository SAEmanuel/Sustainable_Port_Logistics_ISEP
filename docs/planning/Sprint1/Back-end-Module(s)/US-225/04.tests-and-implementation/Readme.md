# US2.2.5 – Create Shipping Agent Organizations

---

## 4. Tests

### 4.1. Purpose
The main goal of testing this user story is to verify the correct behavior of the system when creating **Shipping Agent Organizations**, ensuring that all business rules and constraints are enforced.

### 4.2. Scope
The tests cover the **Domain**, **Application Service**, and **Controller** layers:

#### Unit Tests
- **Domain (Entity):** validation of rules such as non-empty name, valid dimension constraints, and capacity calculation.
- **Application Service:** validation of name uniqueness, repository integration, and transactional behavior.
- **Controller:** validation of HTTP responses, exception handling, and DTO serialization.

#### Integration Tests (API)
- API endpoints `/api/ShippingAgentOrganization` tested via HTTP requests (Postman collection):  
  - `GET /api/ShippingAgentOrganization` – retrieve all vessel types  
  - `GET /api/ShippingAgentOrganization/code/{code}` – retrieve by ShippingAgentCode  
  - `GET /api/ShippingAgentOrganization/legalname/{legalname}` – retrieve by LegalName  
  - `GET /api/ShippingAgentOrganization/taxnumber/{taxnumber}` – retrieve by TaxNumber  
  - `POST /api/ShippingAgentOrganization` – create   

### 4.3. Key Test Cases


| Layer | Test Case | Expected Result |
| ------ | ---------- | ---------------- |
| **Domain** | Creating `ShippingAgentOrganization` with invalid organization code (null/empty/invalid chars) | `BusinessRuleValidationException` thrown |
| **Domain** | Creating `ShippingAgentOrganization` with too long organization code (>10 chars) | `BusinessRuleValidationException` thrown |
| **Domain** | Creating `ShippingAgentOrganization` with invalid tax number | `BusinessRuleValidationException` thrown |
| **Domain** | Valid creation of `ShippingAgentOrganization` | Object initialized with valid ID, code, legal name, and tax number |
| **Domain** | Two organizations with same ID are equal | `Equals` returns `true`, identical hash codes |
| **Service** | Adding new organization with existing code | `BusinessRuleValidationException: "Shipping Agent Organization with code X already exists"` |
| **Service** | Adding new organization with existing tax number | `BusinessRuleValidationException: "Shipping Agent Organization with tax number X already exists"` |
| **Service** | Adding new organization with existing legal name | `BusinessRuleValidationException: "Shipping Agent Organization with legal name X already exists"` |
| **Service** | Valid creation of organization | Returns `ShippingAgentOrganizationDto` with generated ID and provided data |
| **Service** | Getting organization by ID (exists) | Returns corresponding `ShippingAgentOrganizationDto` |
| **Service** | Getting organization by ID (not found) | Returns `null` |
| **Controller** | `GET /api/ShippingAgentOrganization` when records exist | HTTP `200 OK` with list of DTOs |
| **Controller** | `GET /api/ShippingAgentOrganization/{id}` when found | HTTP `200 OK` with DTO |
| **Controller** | `GET /api/ShippingAgentOrganization/{id}` when not found | HTTP `404 NotFound` |
| **Controller** | `GET /api/ShippingAgentOrganization/code/{code}` valid | HTTP `200 OK` with matching DTO |
| **Controller** | `GET /api/ShippingAgentOrganization/code/{code}` invalid/not found | HTTP `404 NotFound` with error message |
| **Controller** | `GET /api/ShippingAgentOrganization/legalname/{name}` valid | HTTP `200 OK` with DTO |
| **Controller** | `GET /api/ShippingAgentOrganization/legalname/{name}` not found | HTTP `404 NotFound` |
| **Controller** | `POST /api/ShippingAgentOrganization` valid input | HTTP `201 Created` with DTO body |
| **Controller** | `POST /api/ShippingAgentOrganization` invalid (business rule violation) | HTTP `400 BadRequest` with error message |

---

## 5. Construction (Implementation)

### 5.1. Layers Involved
The implementation follows a **DDD + Clean Architecture** approach, consisting of the following layers:

| Layer | Description | Example Classes |
| ------ | ------------ | ---------------- |
| **Presentation** | Handles HTTP requests and responses. | `ShippingAgentOrganizationController` |
| **Application** | Coordinates business operations and validation flow. | `IShippingAgentOrganizationService`, `ShippingAgentOrganizationService`, `ShippingAgentOrganizationFactory` |
| **Domain** | Contains core business logic and invariants. | `ShippingAgentOrganization`, `ShippingAgentOrganizationId` |
| **Infrastructure** | Handles data persistence and transaction management. | `IShippingAgentOrganizationRepository`, `UnitOfWork` |
| **Cross-cutting** | Logging and monitoring. | `ILogger<T>` |

### 5.2. Main Code Elements

#### (a) Domain – `ShippingAgentOrganization`

Implements all business rules:

```csharp
if (string.IsNullOrWhiteSpace(legalName))
    throw new BusinessRuleValidationException("Legal name cannot be empty.");

if (string.IsNullOrWhiteSpace(address))
    throw new BusinessRuleValidationException("Address cannot be empty.");

if (shippingOrganizationCode == null || !shippingOrganizationCode.IsValid())
    throw new BusinessRuleValidationException("Invalid shipping organization code.");

if (taxNumber == null || !taxNumber.IsValid())
    throw new BusinessRuleValidationException("Invalid tax number.");
````

#### (b) Application Service – `ShippingAgentOrganizationService`

Coordinates validation and persistence:

```csharp
public async Task<ShippingAgentOrganizationDto> CreateAsync(CreatingShippingAgentOrganizationDto dto)
{
    var code = new ShippingOrganizationCode(dto.ShippingOrganizationCode);
    var tax = new TaxNumber(dto.Taxnumber);

    if (await _repo.GetByCodeAsync(code) is not null)
        throw new BusinessRuleValidationException($"Shipping Agent Organization with code '{code}' already exists.");

    if (await _repo.GetByTaxNumberAsync(tax) is not null)
        throw new BusinessRuleValidationException($"Shipping Agent Organization with tax number '{tax.Value}' already exists.");

    if (await _repo.GetByLegalNameAsync(dto.LegalName) is not null)
        throw new BusinessRuleValidationException($"Shipping Agent Organization with legal name '{dto.LegalName}' already exists.");

    var entity = new ShippingAgentOrganization(code, dto.LegalName, dto.AltName, dto.Address, tax);

    await _repo.AddAsync(entity);
    await _unitOfWork.CommitAsync();

    return new ShippingAgentOrganizationDto(entity);
}
```

#### (c) Controller – `ShippingAgentOrganizationController`

Exposes REST endpoints:

```csharp
[HttpPost]
public async Task<ActionResult<ShippingAgentOrganizationDto>> Create([FromBody] CreatingShippingAgentOrganizationDto dto)
{
    try
    {
        var q = await _service.CreateAsync(dto);

        return CreatedAtAction(nameof(GetGetById), new { id = q.Id }, q);
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
* Successful requests return `ShippingAgentOrganizationDto` objects serialized in JSON.
* Error cases return detailed validation messages with proper HTTP codes (`400`, `404`).
* Logging is available through **Serilog**, recording creation, update, and search events.

**Example demo scenario:**

1. `POST /api/ShippingAgentOrganization` → creates `"Shipping Co."`
2. `GET /api/ShippingAgentOrganization/legalname/Shipping Co.` → confirms existence




