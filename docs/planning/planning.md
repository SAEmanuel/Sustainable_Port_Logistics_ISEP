# Planning

## Overview

The **Port Management System project** is developed over the 5th semester (2nd year, 1st semester) of the Degree in Informatics Engineering (LEI) at ISEP during the 2025-2026 academic year.
It follows a **Project-Based Learning (PBL)** approach using **Scrum methodology**, integrating five course units (UCs):

* **ARQSI** (Arquitetura de Sistemas),
* **LAPR5** (Laboratory and Project V),
* **SGRAI** (Sistemas Gráficos e Interação),
* **GESTA** (Gestão),
* **ASIST** (Administração de Sistemas).
* **IARTI** (Inteligência Artificial).

The project is divided into **three sprints**, each with specific deadlines and UC participation, culminating in a fully functional system by **January 2026**.

---

## Team Composition

* **Team Size**: 4 students
  The team consists of students identified in the following table:

| Student Number | Name                 |
|----------------|----------------------|
| **1230564**    | Francisco dos Santos |
| **1230839**    | Emanuel Almeida      |
| **1231274**    | Jorge Ubaldo         |
| **1230444**    | Romeu Xu             |
| **1211225**    | Alexandre Moura      |

* **Roles**:

    * **Scrum Master**: LAPR5 PL teacher (weekly meetings during LAPR5 PL+OT class).
    * **Development Team**: 4 students responsible for analysis, design, implementation, testing, and documentation.

* **Formation**: Teams are finalized within the first two weeks of the semester (by mid-September 2025) and validated by the LAPR5 PL teacher via Moodle submission.

---

## Task Distribution

Throughout the project development period, the distribution of *tasks / requirements / features* by the team members will be tracked in GitHub Issues and documented in the following way:

| Task                       | Sprint A                                     | Sprint B | Sprint C |
|----------------------------| -------------------------------------------- | -------- | -------- |
| Glossary                   | [1230444](docs/global-artifacts/glossary.md) |          |          |
| Use Case Diagram (UCD)     | [1231274](docs/global-artifacts/ucd.md)      |          |          |
| Supplementary Specification | [1231274](docs/global-artifacts/furps.md)    |          |          |
| Domain Model (DDD)         | [All team members](docs/domain-model)        |          |          |
| Readme.md                  | [1231274](README.md)                         |          |          |
| Planning.md                | [1231274](docs/planning.md)                  |          |          |


| Task - US'S Back-end Module(s) | Sprint A                 | Sprint B | Sprint C |
|--------------------------------|--------------------------| -------- | -------- |
| US-2.2.1                       | [1231274]() & [1230444]() |  |  |
| US-2.2.2                       | [1231274]()              |  |  |
| US-2.2.3                       | [1230444]()              |  |  |
| US-2.2.4                       | [All Members]()          |  |  |
| US-2.2.5                       | [1211225]()              |  |  |
| US-2.2.6                       | [1211225]()              |  |  |
| US-2.2.7                       | [All Members]()          |  |  |
| US-2.2.8                       | [All Members]()          |  |  |
| US-2.2.9                       | [All Members]()          |  |  |
| US-2.2.10                      | [All Members]()          |  |  |
| US-2.2.11                      | [1230564]()              |  |  |
| US-2.2.12                      | [1230839]()              |  |  |
| US-2.2.13                      | [1230839]() &  1230564]() |  |  |


| Task - US'S Project Client Analysis | Sprint A                                     | Sprint B | Sprint C |
|-------------------------------------| -------------------------------------------- | -------- | -------- |
| US-2.3.1                            | [All Members]() |  |  |
| US-2.3.2                            | [All Members]() |  |  |
| US-2.3.3                            | [All Members]() |  |  |
| US-2.3.4                            | [All Members]() |  |  |
| US-2.3.5                            | [All Members]() |  |  |
| US-2.3.6                            | [All Members]() |  |  |
| US-2.3.7                            | [All Members]() |  |  |

# Scope of Work Distribution

| Scope of Work (by Main Concept) | Member 1<br/>1231274 | Member 2<br/>1230444 | Member 3<br/>1230839 | Member 4<br/>1230564 | Member 5<br/>1211225 |
|---------------------------------|----------------------|----------------------|----------------------|----------------------|----------------------|
| Dock                            |                      | X                    |                      |                      |                      |
| Qualification                   |                      |                      | X                    | X                    |                      |
| Resource                        |                      |                      | X                    |                      | X                    |
| Shipping Agent Organization     |                      |                      |                      |                      | X                    |
| Shipping Agent Representative   |                      |                      |                      |                      | X                    |
| Staff Member                    |                      |                      |                      | X                    |                      |
| Storage Area                    | X                    | X                    | X                    | X                    |                      |
| Vessel                          | X                    |                      |                      |                      |                      |
| Vessel Type                     | X                    | X                    |                      |                      |                      |
| Vessel Visit Notification       | X                    | X                    | X                    | X                    | X                    |




## Sprint Schedule

The project is structured into three sprints with the following deadlines (commits on GitHub before 20:00 as per course rules):

| Sprint   | Duration               | Deadline     | Participating UCs                        |
| -------- |------------------------|--------------|------------------------------------------|
| Sprint A | Sept 15 – Oct 26, 2025 | Oct 26, 2025 | LAPR5, ARQSI, GESTA                      |
| Sprint B | Oct 26 – Nov xx, 2025  | Nov xx, 2025 | LAPR5, ARQSI, GESTA, IARTI, ASIST, SGRAI |
| Sprint C | Nov xx – Jan yy, 2026  | Jan yy, 2026 | LAPR5, ARQSI, GESTA, IARTI, ASIST, SGRA  |

---

### **Sprint A: Foundations and Domain Model Setup**

* **Duration**: Sept 15 – Oct 26, 2025
* **Focus**: Initial setup, technical constraints, and definition of the Domain Model.

### **Deliverables**

* **Project Repository**:

    * GitHub repo initialized with `main` branch and project board configured.
    * Defined project structure aligned with architecture and supported technologies.
* **Development Foundations**:

    * CI/CD setup with GitHub Actions (US104).
    * Initial automation scripts for build and testing.
* **Domain Model & Docs**:

    * Domain model defined with Aggregates, Entities, Value Objects, and Events (US110).
    * Glossary, FURPS+, and UML diagrams stored in `docs/`.

---

## Scrum Process

### 1. Weekly Meetings

Weekly meetings are held during LAPR5 PL+OT classes, led by the Scrum Master:

* Review task progress vs. sprint goals.
* Plan upcoming tasks and solve blockers.
* Adjust sprint backlog as needed.
* Follow an **adapted Daily Scrum** to ensure communication and transparency.

### 2. User Stories

Each sprint starts with **User Stories**:

1. Reception & analysis (requirements, dependencies, ACs).
2. Clarification of doubts via **LAPR5 RUC**.
3. Planning & assignment of stories to tasks.
4. Implementation & validation with acceptance criteria.

### 3. Task Division & Responsibilities

* Balanced workload — no member is overloaded.
* Rotation for learning — members work in different areas.
* Integration across UCs — each student contributes to multiple courses.

### 4. Evidence & Tracking

* Frequent commits on GitHub with descriptive messages.
* Issues used to track work and link to project board.
* Pull Requests reviewed before merge.
* Documentation updated in `docs/` with technical decisions and architecture.

---

## Technical Documentation

* **Location**: `docs/` folder in GitHub.
* **Content**: sprint plans, retrospectives, UML (use case, class, sequence) diagrams in SVG via PlantUML, DDD diagrams, design docs.
* **Tools**: PlantUML, GitHub Actions for CI/CD.

---

## Risk Management

* **Conflicts**: Resolved internally; escalated to LAPR5 PL teacher if needed.
* **Technical Issues**: Mitigated via CI/CD, test-driven development, nightly builds.
* **Scalability**: Addressed by ensuring the system can handle growth in number of vessels, docks, storage areas, and notifications.
* **Integration Risks**: Minimized by defining clear bounded contexts (DDD) and consistent APIs.