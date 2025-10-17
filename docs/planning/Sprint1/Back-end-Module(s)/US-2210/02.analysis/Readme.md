# **US2.2.10 – View Vessel Visit Notification Status**

## **2. Analysis**

---

### **2.1. Domain Model Excerpt**

![](./svg/LAPR5_project.svg)
* **VesselVisitNotification**

    * Represents a single vessel visit notification.
    * Attributes: `VesselImo`, `EstimatedTimeArrival`, `EstimatedTimeDeparture`, `Status`, `SubmittedDate`, `AcceptedDate`, etc.

* **ShippingAgentRepresentative**

    * Each representative belongs to a **ShippingAgentOrganization** and can have multiple VVNs (via `Notifs`).

* **ShippingAgentOrganization**

    * Groups multiple representatives under one organization code (SAO).

* **VesselVisitNotificationService**

    * Exposes methods for each status type, applying filters and enforcing organization-level data visibility.

---

### **2.2. Implemented Application Methods**

| **Method Name**                                                                  | **Status Type**                | **Filter DTO Used**                   | **Main Filters Applied**                                   |
| -------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------- | ---------------------------------------------------------- |
| `GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync` | InProgress, PendingInformation | `FilterInProgressPendingVvnStatusDto` | Representative, IMO, ETA, ETD                              |
| `GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync`                    | Submitted                      | `FilterSubmittedVvnStatusDto`         | Representative, IMO, ETA, ETD, SubmittedDate               |
| `GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync`                     | Accepted                       | `FilterAcceptedVvnStatusDto`          | Representative, IMO, ETA, ETD, SubmittedDate, AcceptedDate |
| `GetWithdrawnVvnsByShippingAgentRepresentativeIdFiltersAsync`                    | Withdrawn                      | `FilterWithdrawnVvnStatusDto`         | Representative, IMO, ETA, ETD                              |

---

### **2.3. Helper Filtering Methods**

| **Helper Method**                           | **Purpose**                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `GetShippingAgentRepresentativesBySaoAsync` | Fetches all representatives under the same organization as the current SAR.    |
| `GetVvnForSpecificRepresentative`           | Retrieves VVNs linked to one or multiple representatives via `VvnCode`.        |
| `GetVvnsFilterByImoNumber`                  | Filters VVNs based on vessel IMO number (validated against vessel repository). |
| `GetVvnsFilterByEstimatedTimeArrival`       | Filters VVNs by ETA within ±1 hour of the provided timestamp.                  |
| `GetVvnsFilterByEstimatedTimeDeparture`     | Filters VVNs by ETD within ±1 hour of the provided timestamp.                  |
| `GetVvnsFilterBySubmittedDate`              | Filters VVNs by submitted date within ±1 hour of provided timestamp.           |
| `GetVvnsFilterByAcceptedDate`               | Filters VVNs by accepted date within ±1 hour of provided timestamp.            |

---

### **2.4. Output Behavior and Logging**

* Extensive structured logging (`LogInformation`, `LogWarning`, `LogError`) is implemented for:

    * Filter application
    * Empty results
    * Invalid date formats
    * Missing VVNs or organization mismatches
* All validation failures throw `BusinessRuleValidationException` with detailed messages.
* Each method concludes by converting entities into DTOs via:

  ```csharp
  VesselVisitNotificationFactory.CreateLitsVvnDtosFromList(listVvnFiltered);
  ```

---

### **2.5. Data Visibility Rules**

* A SAR **cannot view VVNs** from another organization.
* VVNs are only retrieved if the requesting SAR belongs to the same `ShippingOrganizationCode`.
* Each filter method enforces these boundaries through repository lookups.

---

### **2.6. Remarks**

* The feature is **read-only** — no modification to domain entities.
* Filtering occurs entirely in memory after retrieving relevant VVNs, ensuring accuracy across multiple status states.
* Designed with extensibility in mind — additional filters (like vessel name) can be easily added later.


