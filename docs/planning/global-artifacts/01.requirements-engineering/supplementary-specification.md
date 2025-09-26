# Supplementary Specification (FURPS+)

## Functionality

_Specifies functionalities that:  
    (i) are common across several US/UC;  
    (ii) are not related to US/UC, namely: Audit, Reporting and Security._

- The system shall support user authentication and authorization for all functionalities, ensuring secure access based on roles (e.g., Admin, CRM Manager, CRM Collaborator, Show Designer, Drone Tech) as per NFR08.
- The system shall provide simulation capabilities for figures and shows, including collision detection and reporting, applicable across testing use cases (3.1.5).
- The system shall log all user actions and system events (e.g., show request updates, figure imports) to support auditing and traceability.

## Usability

_Evaluates the user interface. It has several subcategories, among them: error prevention; interface aesthetics and design; help and documentation; consistency and standards._

- Error messages shall be clear and concise, aiding users in understanding and resolving issues (e.g., collision reports during simulation or unsupported drone features as per 3.1.3).
- The system shall include inline help or tooltips for complex operations (e.g., DSL import, simulation setup) to guide users.
- The interface shall maintain consistency in layout and terminology across all modules (e.g., client management, figure library, show requests).

## Reliability

_Refers to the integrity, compliance and interoperability of the software. The requirements to be considered are: frequency and severity of failure, possibility of recovery, possibility of prediction, accuracy, average time between failures._

- The system shall ensure data integrity by accurately recording and updating information (e.g., customer data, figure DSL code, show schedules as per 3.1.2-3.1.4).
- All modules shall be thoroughly tested to minimize the occurrence of software bugs, adhering to a test-driven development approach (NFR03).
- The system shall recover gracefully from simulation failures (e.g., halting on collision detection with detailed reporting as per 3.1.5).
- The system shall maintain consistency between in-memory and RDBMS data persistence options (NFR07).

## Performance

_Evaluates the performance requirements of the software, namely: response time, start-up time, recovery time, memory consumption, CPU usage, load capacity and application availability._

- The system shall handle a large number of concurrent users efficiently without significant degradation in performance (e.g., supporting multiple CRM Collaborators and Drone Techs simultaneously).
- The simulation system shall scale to handle hundreds of drones in parallel, potentially using multiple servers for subareas (3 System Specifications), with a multithreaded design (NFR12).
- The system shall provide simulation step times of less than 1 second per step for small shows (<50 drones) to ensure usability during testing.
- Start-up time shall be minimized by pre-loading default data (NFR07) and optimizing network socket communications (NFR10).

## Supportability

_The supportability requirements gathers several characteristics, such as: testability, adaptability, maintainability, compatibility, configurability, installability, scalability and more._

- The system shall provide comprehensive documentation for users, administrators, and developers, stored in the "docs" folder in Markdown format (NFR02).
- Maintenance tasks, such as system updates and bug fixes, shall be easy to perform without disrupting system operation, supported by nightly builds and CI metrics (NFR05).
- The system shall support English language.
- The system shall be configurable to switch between in-memory and RDBMS persistence via configuration files (NFR07).
- The system shall be scalable to support large drone shows, with simulation parallelization capabilities (3 System Specifications, NFR12).

## Design Constraints

_Specifies or constraints the system design process. Examples may include: programming languages, software process, mandatory standards/patterns, use of development tools, class library, etc._

- The system shall comply with recognized coding standards, ensuring readability and maintainability of the codebase (e.g., Java coding conventions).
- Unit tests shall be implemented using the JUnit 5 framework to validate the correctness of system functionalities (aligned with NFR03).
- The system shall use object serialization for data persistence between runs.
- All images/figures produced during the development process shall be recorded in SVG format for scalability and portability (e.g., UML diagrams in NFR02).
- The system shall follow Scrum methodology for project management, with sprints and weekly meetings (NFR01).
- DSL parsing and validation shall use the ANTLR tool as per LPROG requirements (NFR11).

## Implementation Constraints

_Specifies or constraints the code or construction of a system such as: mandatory standards/patterns, implementation languages, database integrity, resource limits, operating system._

- The system shall be implemented primarily in Java (NFR09), with additional languages allowed for specific requirements (e.g., DSL generation or drone code).
- The system shall use GitHub for source control, with all code, documentation, and artifacts versioned in the main branch (NFR04).
- The simulation system shall implement a multithreaded parent process with child drone processes, using shared memory, semaphores for synchronization, and signal-based termination (NFR12).
- The system shall support deployment on both Linux and Windows, with build and deployment scripts provided (NFR06).
- Database integrity shall be ensured through a relational database (RDBMS) for final deployment, with in-memory options for development/testing (NFR07).

## Interface Constraints

_Specifies or constraints the features inherent to the interaction of the system being developed with other external systems._

- The system shall interface with an external tool for DSL code generation, importing the high-level DSL descriptions for figures and shows (3.1.3).
- Network communication shall use socket APIs, either a custom protocol or a standard one like HTTP, for interactions such as simulation orchestration or drone feedback (NFR10).
- The system shall integrate with a remote RDBMS for persistent storage, configurable via system settings (NFR07).
- The simulation module shall interface with a central orchestrator server to synchronize drone actions and receive completion feedback during full show testing (3 System Specifications).

## Physical Constraints

_Specifies a limitation or physical requirement regarding the hardware used to house the system, as for example: material, shape, size or weight._

- The system shall be deployable on standard server hardware capable of running Linux or Windows operating systems (NFR06).
- For large-scale simulations (hundreds of drones), the system may require multiple servers to parallelize processing across airspace subareas, with sufficient memory and CPU to handle multithreading and shared memory operations (3 System Specifications, NFR12).
- No specific hardware size, shape, or weight constraints are imposed, but the system shall be optimized to run efficiently on commodity hardware during development and testing phases.

---
