# **US2.2.10 – View Vessel Visit Notification Status**

---

## **4. Tests**

| **Test ID** | **Scenario / Description**                     | **Input Data**                                         | **Expected Output**                             | **Result** |
| ----------- | ---------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | ---------- |
| **T01**     | Retrieve all VVNs (Accepted) for a valid SAR   | `idSar = 72f1...`, `status=Accepted`                   | List of VVNs with status = Accepted             | ✅ Pass     |
| **T02**     | Retrieve VVNs filtered by IMO number           | `status=Accepted`, `imo=IMO9706906`                    | Only VVNs matching IMO number                   | ✅ Pass     |
| **T03**     | Retrieve VVNs filtered by ETA                  | `status=Submitted`, `ETA="2025-03-01T12:00"`           | Only VVNs within ±1h of ETA                     | ✅ Pass     |
| **T04**     | Retrieve VVNs filtered by ETD                  | `status=Withdrawn`, `ETD="2025-05-11T10:00"`           | Only VVNs within ±1h of ETD                     | ✅ Pass     |
| **T05**     | Retrieve VVNs filtered by SubmittedDate        | `status=Submitted`, `submittedDate="2025-01-05T10:00"` | Only VVNs submitted near given date             | ✅ Pass     |
| **T06**     | Retrieve VVNs filtered by AcceptedDate         | `status=Accepted`, `acceptedDate="2025-01-06T10:00"`   | Only VVNs accepted near given date              | ✅ Pass     |
| **T07**     | Retrieve InProgress or PendingInformation VVNs | `status=inprogress-pending`                            | List of VVNs in progress or pending information | ✅ Pass     |
| **T08**     | Retrieve Withdrawn VVNs                        | `status=Withdrawn`                                     | List of VVNs marked as Withdrawn                | ✅ Pass     |
| **T09**     | No VVNs found for SAR                          | Valid SAR with none submitted                          | Empty list returned                             | ✅ Pass     |
| **T10**     | Invalid date format                            | `ETA="invalid-date"`                                   | Throws `BusinessRuleValidationException`        | ✅ Pass     |

**Unit Test Example (xUnit):**

```csharp
[Fact]
public async Task EnsureAcceptedVvnsAreFilteredByImoSuccessfully()
{
    var dto = new FilterAcceptedVvnStatusDto { VesselImoNumber = "IMO9706906" };
    var result = await _service.GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(_validSarId, dto);
    Assert.All(result, vvn => Assert.Equal("IMO9706906", vvn.VesselImo));
}

[Fact]
public async Task EnsureInvalidDateThrowsException()
{
    var dto = new FilterSubmittedVvnStatusDto { EstimatedTimeArrival = "invalid" };
    await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
        _service.GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync(_validSarId, dto));
}
```

---

## **5. Construction (Implementation)**

The implementation follows the layered architecture and **DDD (Domain-Driven Design)** approach.
It reuses the domain aggregates for **VesselVisitNotification**, **ShippingAgentRepresentative**, and **ShippingAgentOrganization** to ensure data visibility and access control.

### **Main Components**

| **Layer**              | **Class / File**                                                        | **Responsibility**                                                               |
| ---------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Domain**             | `VesselVisitNotification.cs`                                            | Aggregate root holding vessel visit details, status, and timestamps.             |
|                        | `VvnCode.cs`, `ClockTime.cs`, `VvnStatusWrapper.cs`                     | Value Objects for identification, time, and state management.                    |
| **Application**        | `VesselVisitNotificationService.cs`                                     | Contains all logic for fetching and filtering VVNs by status, date, IMO, etc.    |
|                        | `VesselVisitNotificationFactory.cs`                                     | Converts entities to DTOs for API responses.                                     |
| **DTOs**               | `FilterAcceptedVvnStatusDto.cs`, `FilterSubmittedVvnStatusDto.cs`, etc. | Define filter parameters for each status query.                                  |
| **Infrastructure**     | `VesselVisitNotificationRepository.cs`                                  | Accesses VVNs from persistence.                                                  |
|                        | `ShippingAgentRepresentativeRepository.cs`                              | Fetches representatives for the same organization.                               |
|                        | `VesselRepository.cs`                                                   | Resolves IMO numbers to vessel entities.                                         |
| **Presentation (API)** | `VesselVisitNotificationController.cs`                                  | Exposes endpoints `/api/VesselVisitNotification/{status}` with query parameters. |

### **Example – Service Logic**

```csharp
public async Task<List<VesselVisitNotificationDto>> GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(
    Guid idSar, FilterAcceptedVvnStatusDto dto)
{
    var listReps = await GetShippingAgentRepresentativesBySaoAsync(idSar);
    var vvns = await GetVvnForSpecificRepresentative(dto.SpecificRepresentative, listReps);
    vvns = vvns.Where(v => v.Status.StatusValue == VvnStatus.Accepted).ToList();

    if (!string.IsNullOrWhiteSpace(dto.VesselImoNumber))
        vvns = await GetVvnsFilterByImoNumber(vvns, dto.VesselImoNumber);
    if (!string.IsNullOrWhiteSpace(dto.EstimatedTimeArrival))
        vvns = GetVvnsFilterByEstimatedTimeArrival(vvns, dto.EstimatedTimeArrival);
    if (!string.IsNullOrWhiteSpace(dto.AcceptedDate))
        vvns = GetVvnsFilterByAcceptedDate(vvns, dto.AcceptedDate);

    return VesselVisitNotificationFactory.CreateLitsVvnDtosFromList(vvns);
}
```

### **REST Endpoints**

| **Status Type**                     | **Example Endpoint**                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| **Accepted**                        | `GET /api/VesselVisitNotification/accepted?imo=IMO9706906&acceptedDate=2025-01-06` |
| **Submitted**                       | `GET /api/VesselVisitNotification/submitted?submittedDate=2025-01-05`              |
| **InProgress + PendingInformation** | `GET /api/VesselVisitNotification/inprogress-pending`                              |
| **Withdrawn**                       | `GET /api/VesselVisitNotification/withdrawn`                                       |

---

## **6. Integration and Demo**

Integration was validated within the **Port Management API** context:

* The `VesselVisitNotificationController` integrates directly with the `VesselVisitNotificationService`.
* Repository access uses **Entity Framework Core** for database interaction.
* Logging and observability handled via **ILogger** in all service methods.

### **Demonstration Steps**

1. **Start the API** and ensure the seed database is loaded.
2. **Perform request** (example):

   ```
   GET /api/VesselVisitNotification/accepted?imo=IMO9706906
   ```
3. **Expected Response:**

   ```json
   [
     {
       "code": "VVN-2025-0001",
       "vesselImo": "IMO9706906",
       "estimatedTimeArrival": "2025-02-25T10:00",
       "estimatedTimeDeparture": "2025-02-27T18:00",
       "status": "Accepted",
       "assignedDock": "Dock-12",
       "rejectionReason": null
     }
   ]
   ```
4. Filters can be combined dynamically (e.g. `?imo=IMO9706906&eta=2025-02-25T10:00`).
5. The log file (`RequestLogsMiddleware`) confirms filtering sequence and final count.

---

## **7. Observations**

* The design enforces **organizational isolation** — representatives can only view VVNs belonging to their **own ShippingAgentOrganization (SAO)**.
* The filters were implemented using **LINQ in-memory evaluation** after repository retrieval for flexibility and clarity.
* Invalid date formats or IMO numbers trigger `BusinessRuleValidationException`, ensuring data integrity.
* The service methods share a common structure for maintainability and testing.
* Future improvements may include:

    * Adding **pagination and sorting** to the endpoints.
    * Introducing **caching** for performance optimization on large datasets.
    * Extending the endpoint to include **Rejected** and **Completed** VVNs once those statuses are fully supported.


