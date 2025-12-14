# USx -???

## 3. Design - User Story Realization 

### 3.1. Rationale

_**Note that SSD - Alternative One is adopted.**_

| Interaction ID                      | Question: Which class is responsible for...           | Answer | Justification (with patterns)                                                                                 |
|:------------------------------------|:------------------------------------------------------|:-------|:--------------------------------------------------------------------------------------------------------------|
| Step 1 :   	                        | 	... interacting with the actor?                      | x      | Pure Fabrication: there is no reason to assign this responsibility to any existing class in the Domain Model. |
| 			  		                             | 	... coordinating the US?                             | y      | Controller                                                                                                    |
| Step 2 : request data (skillName)		 | 	... displaying the form for the actor to input data? | z      | Pure Fabrication                                                                                              |

### Systematization ##

According to the taken rationale, the conceptual classes promoted to software classes are: 

*none

Other software classes (i.e. Pure Fabrication) identified: 

* none


## 3.2. Sequence Diagram (SD)


### Full Diagram

This diagram shows the full sequence of interactions between the classes involved in the realization of this user story.

![Sequence Diagram - Full](svg/usx-sequence-diagram-full.svg)

### Split Diagrams

The following diagram shows the same sequence of interactions between the classes involved in the realization of this user story, but it is split in partial diagrams to better illustrate the interactions between the classes.

It uses Interaction Occurrence (a.k.a. Interaction Use).

![Sequence Diagram - split](svg/usx-sequence-diagram-split.svg)


**Get Skill Repository**

![Sequence Diagram - Partial - Get Skill Repository](svg/usx-sequence-diagram-partial-get-skill-repository.svg)

**Register Skill**

![Sequence Diagram - Partial - Register Skill](svg/usx-sequence-diagram-partial-register-skill.svg)

## 3.3. Class Diagram (CD)

![Class Diagram](svg/usx-class-diagram.svg)