const API_BASE = "**/api/PhysicalResource";

describe("Physical Resources – E2E", () => {
    beforeEach(() => {
        cy.fixture("physicalResources.json").then((resources) => {
            cy.intercept("GET", API_BASE, {
                statusCode: 200,
                body: resources,
            }).as("getResources");
        });

        // Visita a página
        cy.visit("/physical-resources");
        cy.wait("@getResources");
    });

    it("1. Abre a página e mostra a tabela com os dados iniciais", () => {
        cy.get(".physical-resource-header").should("exist");
        cy.get(".pr-table tbody tr").should("have.length", 3);
        cy.contains("Volvo FH16 Truck").should("exist");
    });

    it("2. Ao clicar em Detalhes, abre o modal e fecha", () => {
        cy.contains("tr", "TRUCK-001").find(".pr-details-button").click();
        cy.get(".pr-details-modal-content").should("be.visible");
        cy.get(".pr-details-hero h2").should("contain.text", "TRUCK-001");

        // Clica no botão de fechar (cancel-button)
        cy.get(".pr-details-modal-content .pr-cancel-button").click();
        cy.get(".pr-details-modal-content").should("not.exist");
    });

    it("3. Faz pesquisa por descrição, exibe resultado", () => {
        const searchTerm = "Volvo";
        const mockResult = [{
            id: "1",
            code: "TRUCK-001",
            description: "Volvo FH16 Truck",
            physicalResourceType: "Truck",
            physicalResourceStatus: "Available",
            operationalCapacity: 25.5,
            setupTime: 10
        }];

        cy.intercept("GET", `${API_BASE}/search/description/${searchTerm}`, {
            statusCode: 200,
            body: mockResult,
        }).as("searchByDesc");

        cy.get(".pr-search-type-select").select("description");
        cy.get(".pr-search-input").type(searchTerm);
        cy.get(".pr-search-button").click();

        cy.wait("@searchByDesc");
        cy.get(".pr-table tbody tr").should("have.length", 1);
        cy.contains("Volvo FH16 Truck").should("exist");
    });

    it("4. Botão de criação abre o Wizard, preenche os passos e faz POST", () => {
        const newResource = {
            description: "New Forklift Toyota",
            operationalCapacity: 50,
            setupTime: 5,
            physicalResourceType: "Forklift",
            qualificationCode: "Q-DRIVER"
        };

        cy.intercept("POST", API_BASE, (req) => {
            req.reply({
                statusCode: 201,
                body: { id: "99", code: "FORK-99", ...newResource, physicalResourceStatus: "Available" },
            });
        }).as("createResource");

        cy.get(".create-pr-button").click();
        cy.get(".pr-modal-content").should("be.visible");

        // --- PASSO 1 ---
        cy.contains(".pr-wizard-step.active", "1").should("exist"); // Verifica pelo número do passo
        cy.get(".pr-type-card").contains(/Empilhador|Forklift/i).click();

        // --- PASSO 2 ---
        cy.contains(".pr-wizard-step.active", "2").should("exist");

        cy.get("input[name='description']").type(newResource.description);
        cy.get("input[name='operationalCapacity']").type(String(newResource.operationalCapacity));
        cy.get("input[name='setupTime']").type(String(newResource.setupTime));

        // CORREÇÃO 1: Clica no botão submit (Next) sem depender do texto "Próximo"
        // Como no passo 2 só há um botão submit, isto funciona.
        cy.get(".pr-modal-actions-wizard .pr-submit-button").click();

        // --- PASSO 3 ---
        cy.contains(".pr-wizard-step.active", "3").should("exist");

        // Clica em Criar (Submit final)
        cy.get(".pr-modal-actions-wizard .pr-submit-button").click();

        cy.wait("@createResource");
        cy.get(".pr-modal-content").should("not.exist");
    });

    it("5. Edição a partir dos detalhes faz PATCH com novos dados", () => {
        const resourceId = "1";
        const updatedDesc = "Volvo FH16 Truck - Updated";

        // 1. Abre Detalhes
        cy.contains("tr", "TRUCK-001").find(".pr-details-button").click();

        // 2. Intercept do PATCH
        cy.intercept("PATCH", `${API_BASE}/update/${resourceId}`, (req) => {
            req.reply({
                statusCode: 200,
                body: {
                    id: resourceId,
                    code: "TRUCK-001",
                    physicalResourceType: "Truck",
                    physicalResourceStatus: "Available",
                    operationalCapacity: 25.5,
                    setupTime: 10,
                    description: updatedDesc
                },
            });
        }).as("updateResource");

        // 3. Clica no botão de Editar (lápis)
        cy.get(".pr-edit-button-corner").click();

        // 4. Preenche formulário
        cy.get("input[name='description']")
            .should("be.visible")
            .clear()
            .type(updatedDesc);

        // CORREÇÃO 2: Usa {force: true} para forçar o clique se estiver tapado ou a animar
        cy.get(".pr-submit-button").click({ force: true });

        cy.wait("@updateResource");

        // Verifica se o texto atualizou na UI
        cy.get(".details-description").should("contain.text", updatedDesc);
    });


    const mockPlans = [
    {
        "_id": "695030b96a1d0377ba399fa3",
        "domainId": "9de2cebb-40a6-471b-b586-26bb803f4a57",
        "algorithm": "Genético",
        "totalDelay": 9,
        "status": "ok",
        "planDate": "2025-12-01T00:00:00.000Z",
        "author": "sa.emanuel204@gmail.com",
        "operations": [
            {
                "vvnId": "a3e352fa-415f-4ac7-b9fe-8619fa4dc6c3",
                "vessel": "Global Titan",
                "dock": "DK-0001",
                "startTime": 0,
                "endTime": 17,
                "loadingDuration": 4,
                "unloadingDuration": 7,
                "crane": "TRUCK-001",
                "craneCountUsed": 1,
                "totalCranesOnDock": 1,
                "optimizedOperationDuration": 11,
                "realDepartureTime": 11,
                "realArrivalTime": 1,
                "departureDelay": 0,
                "staffAssignments": [
                    {
                        "staffMemberName": "Emanuelly Lingjiyang",
                        "intervalStart": "2025-12-01T01:00:00",
                        "intervalEnd": "2025-12-01T08:00:00"
                    }
                ],
                "theoreticalRequiredCranes": null,
                "resourceSuggestion": null
            }
        ]
    }
    ];

    it("6. Abre busy modal de TRUCK-001 e mostra alocação", () => {
        cy.intercept("GET", "**/operation-plans/by-resource*", {
            statusCode: 200,
            body: mockPlans,
        }).as("getPlans");

        cy.contains("tr", "TRUCK-001").find(".pr-allocation-button").click();

        cy.get(".pr-details-modal-content").should("be.visible");

        cy.get(".react-datepicker__input-container input").first().clear().type("2025-12-01{enter}");
        cy.get(".react-datepicker__input-container input").last().clear().type("2025-12-02{enter}");

        cy.wait("@getPlans");

        cy.get(".pr-table tbody").contains("Genético").should("exist"); 

        const expectedOccupancy = 4 + 7;
        cy.get(".pr-table tbody tr").eq(3).should("contain.text", `${expectedOccupancy} h`);

        
    });

});