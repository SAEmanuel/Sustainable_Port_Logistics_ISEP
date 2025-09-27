# Supplementary Specification (FURPS+) – Port Management System

## Functionality

*Specifies functionalities that:
(i) are common across several US/UC;
(ii) are not directly tied to a single US/UC, namely: Audit, Reporting, Security.*

* The system shall support **user authentication and authorization** with different roles (e.g., Port Authority Officer, Shipping Agent Representative, System Administrator).
* The system shall ensure that all **Vessel Visit Notifications (VVNs)** and related approvals/rejections are auditable, logging who performed the action and when.
* The system shall support **reporting features** such as port activity summaries, dock utilization rates, and storage occupancy reports.
* The system shall ensure **data traceability**, storing a history of updates (e.g., vessel records, dock assignments, occupancy changes).

---

## Usability

*Evaluates the user interface: error prevention, aesthetics, documentation, consistency.*

* Error messages shall be **clear and actionable**, e.g., when an IMO number is invalid or when occupancy exceeds capacity.
* The system shall provide **inline help or tooltips** for complex forms (e.g., Vessel Visit Notification submission, Storage Area setup).
* The interface shall maintain **consistent layout and terminology** across modules (Vessels, Docks, Storage, VVNs, Staff/Resources).
* Search and filter functions shall be **intuitive** (e.g., search vessels by IMO, docks by location, staff by qualification).

---

## Reliability

*Refers to the integrity, compliance, and interoperability of the software.*

* The system shall ensure **data integrity** (e.g., no VVN without a valid vessel reference, no StorageArea exceeding capacity).
* **Audit logs** shall not be alterable and must store approvals/rejections with officer ID and timestamp.
* The system shall **recover gracefully** from failed operations (e.g., partial data entry, invalid submissions).
* The system shall be **compliant with IMO data standards** (e.g., IMO number format, ISO 6346 container codes).

---

## Performance

*Performance requirements: response time, load capacity, scalability.*

* The system shall support **concurrent usage** by multiple Port Authority Officers and Shipping Agents without performance degradation.
* Searches (e.g., vessels, docks, storage areas) shall return results in **under 2 seconds** for typical datasets.
* The system shall handle **hundreds of Vessel Visit Notifications** and associated records without impacting usability.
* Updates to occupancy and dock assignments shall be processed in **real time** to ensure consistency.

---

## Supportability

*Includes testability, adaptability, maintainability, scalability.*

* The system shall include **comprehensive documentation** (user guide, admin guide, developer documentation) stored in the repo.
* Maintenance tasks (updates, bug fixes) shall be automated through **CI/CD pipelines**.
* The system shall support the **English language** for all interfaces and messages.
* The system shall be **scalable** to support larger ports (more docks, storage areas, vessels).
* Automated **unit and integration tests** shall validate the main functionalities.

---

## Design Constraints

*Constraints on system design and process.*

* The system shall be implemented primarily in **Java**.
* **JUnit 5** shall be used for unit testing.
* Diagrams and figures (UML, DDD context maps) shall be recorded in **SVG** format.
* The project shall follow **Scrum methodology** with sprints, sprint reviews, and retrospectives.
* The **Domain Model** shall follow **DDD principles** (Aggregates, Entities, Value Objects, Domain Events).

---

## Implementation Constraints

*Constraints on code, DB, and OS.*

* The system shall use **GitHub** for version control, with all code and documentation maintained in the repository.
* The system shall support both **in-memory storage** (for testing) and **RDBMS persistence** (for deployment).
* Deployment shall support **Linux and Windows** environments.
* Database integrity must be guaranteed via **relational schema** (unique keys, foreign keys, constraints).

---

## Interface Constraints

*Constraints on integration with external systems.*

* The system shall provide **REST APIs** (or equivalent endpoints) for integration with external reporting or scheduling tools.
* The system shall integrate with a **remote RDBMS** configurable via settings.
* Notification services (email/SMS) may be integrated to alert Shipping Agents of VVN decisions.

---

## Physical Constraints

*Hardware/environment constraints.*

* The system shall run on **standard server hardware** capable of handling applications.
* For large ports, **scaling horizontally** across multiple servers or containers shall be possible.
* No specific hardware size/weight requirements apply, but the system must run efficiently on commodity hardware during development and production.
