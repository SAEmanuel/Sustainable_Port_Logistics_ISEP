# US 2.2.12 – Register and Manage Physical Resources

## 3. Design – User Story Realization

### 3.1. Rationale

This design section describes how the system implements the functionality for registering, updating, deactivating, and managing physical resources used in port operations.  
It details the interactions between the **Controller**, **Service**, **Repository**, and **Database** layers, emphasizing logging, validation, and audit tracking to ensure data integrity and maintainability.

The design ensures:
- **Separation of concerns** between business logic and persistence.
- **Consistent validation** of data integrity (unique codes, existing qualifications, valid operational capacity).
- **Comprehensive logging and audit trails** at both the service and controller levels for accountability and traceability.
- **Robust error handling** through domain exceptions (`BusinessRuleValidationException`).

The implemented architecture follows the principles of **Domain-Driven Design (DDD)**, ensuring that business rules and domain logic are centralized within the service layer while the controller focuses on orchestrating API requests and responses.

---

### 3.2. Sequence Diagram (SD)

This section presents a unified sequence diagram illustrating the main operations of this user story:

1. **Create** – The process of registering a new physical resource.  
   It validates the provided data (description, capacity, setup time, and qualification), ensures the qualification exists, generates a unique code, saves the new resource, and logs the creation.

2. **Update** – The workflow for modifying existing physical resource data.  
   It checks if the resource exists, validates qualification references, applies updates, commits the transaction, and records the operation in the audit logs.

3. **Deactivate / Reactivate** – Procedures for toggling a resource’s operational status.  
   These operations preserve data integrity while preventing reactivation or deactivation of already active/inactive resources, and they include logging for traceability.

Each interaction layer — from the **API Controller** to the **Database** — is explicitly modeled to ensure transparency of control flow, data validation, persistence, and logging.

![SD](./puml/us2.2.12-sequence-diagram-full.svg)

---

### 3.3. Design Considerations

- **Logging & Audit:**  
  The `ILogger` interface is injected into both the `PhysicalResourceController` and `PhysicalResourceService` to log key actions (`CREATE`, `UPDATE`, `DEACTIVATE`, `REACTIVATE`) and error conditions.  
  These logs are persisted to separate files (`Logs/PhysicalResource/...`) via the configured Serilog pipeline.

- **Validation:**  
  Input data validation occurs within both DTOs and the `EntityPhysicalResource` constructor.  
  Domain-level validation ensures no invalid or inconsistent states (e.g., negative setup time, non-existent qualification IDs).

- **Error Handling:**  
  All domain validation errors raise a `BusinessRuleValidationException`, caught by the controller and translated into a `400 Bad Request` response.  
  Non-existent entities trigger a `404 Not Found` response.

- **Persistence:**  
  All database interactions occur via the `IPhysicalResourceRepository` and `IUnitOfWork`, ensuring transactional consistency.

- **Extensibility:**  
  The structure supports future enhancements such as:
    - Adding scheduling data for resources.
    - Linking resources to maintenance history.
    - Integrating with planning and scheduling modules.

---

### 3.4. Summary

This design ensures that physical resource management operations are implemented in a **modular**, **traceable**, and **error-resilient** manner.  
By incorporating strong **domain validation**, **consistent audit logging**, and **clear separation between layers**, the system provides a reliable foundation for managing assets critical to port logistics.

