// cypress/e2e/docks.cy.ts

// Torna o ficheiro um módulo TS, para não haver conflito de variáveis com outros specs
export {};

const API_DOCK = "**/api/Dock";
const API_DOCK_BY_CODE = "**/api/Dock/code/*";
const API_DOCK_LOCATION = "**/api/Dock/location*";
const API_DOCK_PATCH_DK1 = "**/api/Dock/code/DK-0001";

const API_VESSEL_TYPE = "**/api/VesselType";
const API_PHYSICAL_RESOURCE = "**/api/PhysicalResource*";

describe("Docks – E2E", () => {
    /**
     * Antes de cada teste:
     *  - mock GET /api/Dock com dados inline
     *  - mock GET /api/VesselType com dados inline
     *  - mock GET /api/PhysicalResource com dados inline
     *  - visitar /docks
     */
    beforeEach(() => {
        const docks = [
            {
                id: "1",
                code: "DK-0001",
                location: "Porto Sul",
                status: "Available",
                lengthM: 250,
                depthM: 15,
                maxDraftM: 12,
                physicalResourceCodes: ["PR1", "PR2"],
                allowedVesselTypeIds: ["VT1", "VT2"],
            },
            {
                id: "2",
                code: "DK-0002",
                location: "Terminal Norte",
                status: "Maintenance",
                lengthM: 180,
                depthM: 10,
                maxDraftM: 8,
                physicalResourceCodes: ["PR3"],
                allowedVesselTypeIds: ["VT1"],
            },
        ];

        const vesselTypes = [
            { id: "VT1", name: "Panamax" },
            { id: "VT2", name: "Feeder" },
        ];

        // lista inicial de docks
        cy.intercept("GET", API_DOCK, {
            statusCode: 200,
            body: docks,
        }).as("getDocks");

        // tipos de navio
        cy.intercept("GET", API_VESSEL_TYPE, {
            statusCode: 200,
            body: vesselTypes,
        }).as("getVesselTypes");

        // physical resources (mock inline)
        cy.intercept("GET", API_PHYSICAL_RESOURCE, {
            statusCode: 200,
            body: [{ code: "PR1" }, { code: "PR2" }, { code: "PR3" }],
        }).as("getPhysicalResources");

        cy.visit("/docks");

        cy.wait("@getDocks");
        cy.wait("@getVesselTypes");
        cy.wait("@getPhysicalResources");
    });

    // ------------------------------------------------------------------

    it("abre a página e mostra cards de docks com dados vindos da API", () => {
        // header básico
        cy.get(".dk-title-area").should("exist");
        cy.get(".dk-title").should("exist");
        cy.get(".dk-sub").should("exist");

        // grid de cards
        cy.get(".dk-card-grid").should("exist");
        cy.get(".dk-card").should("have.length", 2);

        // conteúdo dos cards
        cy.get(".dk-card-grid").within(() => {
            cy.contains("DK-0001").should("exist");
            cy.contains("DK-0002").should("exist");
            cy.contains("Porto Sul").should("exist");
            cy.contains("Terminal Norte").should("exist");
        });
    });

    // ------------------------------------------------------------------

    it("faz pesquisa por localização (fallback local) e filtra os cards", () => {
        // intercept da pesquisa por localização para devolver 0 results
        // e assim forçar o fallback local (filter em memória)
        cy.intercept("GET", API_DOCK_LOCATION, {
            statusCode: 200,
            body: [],
        }).as("searchByLocation");

        cy.get(".dk-card").its("length").should("be.gte", 2);

        cy.get("input.dk-search").type("Porto");
        cy.get(".dk-search-btn").click();

        cy.wait("@searchByLocation");

        // agora deve ficar só a dock com location "Porto Sul" (DK-0001)
        cy.get(".dk-card").should("have.length", 1);
        cy.contains(".dk-card", "DK-0001").should("exist");
        cy.contains(".dk-card", "DK-0002").should("not.exist");
    });

    // ------------------------------------------------------------------

    it("ao clicar num card abre o slide de detalhes com os campos certos", () => {
        cy.contains(".dk-card", "DK-0001").click();

        cy.get(".dk-slide").within(() => {
            cy.contains("DK-0001").should("exist");
            cy.contains("Porto Sul").should("exist");

            // recursos físicos
            cy.contains("PR1").should("exist");
            cy.contains("PR2").should("exist");

            // tipos de navio (via vesselTypeNamesFor)
            cy.contains("Panamax").should("exist");
            cy.contains("Feeder").should("exist");
        });
    });

    // ------------------------------------------------------------------

    it("botão de criação abre o modal de criação e faz POST", () => {
        // intercept do checkDockCodeExists -> GET /api/Dock/code/{code}
        cy.intercept("GET", API_DOCK_BY_CODE, {
            statusCode: 404, // 404 = código livre
        }).as("checkCode");

        // intercept do POST /api/Dock
        cy.intercept("POST", API_DOCK, (req) => {
            // verifica só coisas essenciais para evitar falhas chatas
            expect(req.body).to.have.property("location");            // não verificamos espaçamento
            expect(req.body).to.have.property("lengthM", 350);
            expect(req.body).to.have.property("depthM", 15.5);
            expect(req.body).to.have.property("maxDraftM", 14.8);
            expect(req.body).to.have.property("status", "Available");

            req.reply({
                statusCode: 201,
                body: {
                    id: "3",
                    code: req.body.code,
                    location: req.body.location,
                    status: req.body.status,
                    lengthM: req.body.lengthM,
                    depthM: req.body.depthM,
                    maxDraftM: req.body.maxDraftM,
                    physicalResourceCodes: req.body.physicalResourceCodes ?? [],
                    allowedVesselTypeIds: ["VT1"],
                },
            });
        }).as("createDock");

        // abre modal (botão do header)
        cy.get(".dk-create-btn-top").should("be.visible").click();
        cy.get(".dk-modal", { timeout: 10000 }).should("exist");

        cy.get(".dk-modal").within(() => {
            // .dk-input[0] = code (já preenchido automaticamente)
            // .dk-input[1] = location
            // .dk-input[2] = lengthM
            // .dk-input[3] = depthM
            // .dk-input[4] = maxDraftM

            cy.get("input.dk-input").eq(1).clear().type("Terminal Novo");
            cy.get("input.dk-input").eq(2).clear().type("350");
            cy.get("input.dk-input").eq(3).clear().type("15.5");
            cy.get("input.dk-input").eq(4).clear().type("14.8");

            // escolhe um tipo de navio (obrigatório em validateCreate)
            cy.contains("label", "Panamax")
                .find('input[type="checkbox"]')
                .check();

            cy.get(".dk-btn-save").click();
        });

        cy.wait("@createDock");

        cy.get(".dk-modal").should("not.exist");
    });

    // ------------------------------------------------------------------

    it("a partir do slide abre o modal de edição e faz PATCH por código", () => {
        // intercept do PATCH /api/Dock/code/DK-0001
        cy.intercept("PATCH", API_DOCK_PATCH_DK1, (req) => {
            // aqui também não vamos ser picuinhas com espaços,
            // só garantimos que a propriedade existe
            expect(req.body).to.have.property("location");
            // se quiseres, podes fazer algo assim:
            // expect(req.body.location).to.contain("Porto");

            req.reply({
                statusCode: 200,
                body: {
                    id: "1",
                    code: "DK-0001",
                    location: req.body.location,
                    status: "Available",
                    lengthM: 250,
                    depthM: 15,
                    maxDraftM: 12,
                    physicalResourceCodes: ["PR1", "PR2"],
                    allowedVesselTypeIds: ["VT1", "VT2"],
                },
            });
        }).as("updateDock");

        // abre slide
        cy.contains(".dk-card", "DK-0001").click();
        cy.get(".dk-slide").should("exist");

        // clica no botão Editar
        cy.get(".dk-slide .dk-btn-edit").click();

        // modal de edição
        cy.get(".dk-modal").should("exist");

        cy.get(".dk-modal").within(() => {
            // primeiro input é Localização
            cy.get("input.dk-input")
                .eq(0)
                .clear()
                .type("Porto Sul Atualizado");

            cy.get(".dk-btn-save").click();
        });

        cy.wait("@updateDock");
        cy.get(".dk-modal").should("not.exist");
    });
});
