// @ts-ignore
const API_BASE = "http://localhost:5008/api/VesselType";

describe("Vessel Types – E2E", () => {
    /**
     * Antes de cada teste:
     *  - mock da lista de vessel types
     *  - visitar /vessel-types
     */
    beforeEach(() => {
        cy.fixture("vesselTypes.json").then((vesselTypes) => {
            cy.intercept("GET", API_BASE, {
                statusCode: 200,
                body: vesselTypes,
            }).as("getVesselTypes");
        });

        cy.visit("/vessel-types");
        cy.wait("@getVesselTypes");
    });

    it("abre a página e mostra a lista com os dados vindos da API", () => {
        // header básico
        cy.get(".vt-title-area").should("exist");
        cy.get(".vt-title").should("exist");
        cy.get(".vt-sub").should("exist");

        // tabela e nº de linhas
        cy.get(".vt-table").should("exist");
        cy.get(".vt-table tbody tr").should("have.length", 2);

        // verifica que os nomes da fixture aparecem
        cy.get(".vt-table").within(() => {
            cy.contains("Panamax").should("exist");
            cy.contains("Feeder").should("exist");
        });
    });

    it("faz pesquisa LOCAL pelo nome e filtra a tabela", () => {
        cy.visit("/vessel-types");

        // garante que a tabela inicial carregou (pelo menos 1 linha)
        cy.get(".vt-table tbody tr").its("length").should("be.gte", 1);

        // escreve no input e dispara a pesquisa
        cy.get("input.vt-search").type("feed");
        cy.get(".vt-search-btn").click();

        // agora, garante que:
        // 1) continua a haver pelo menos 1 linha
        cy.get(".vt-table tbody tr").its("length").should("be.gte", 1);

        // 2) TODAS as linhas visíveis correspondem ao filtro "feed" (no nome)
        cy.get(".vt-table tbody tr").each(($tr) => {
            cy.wrap($tr)
                .find("td")
                .first() // coluna do nome
                .invoke("text")
                .then((text) => {
                    expect(text.toLowerCase()).to.include("feed");
                });
        });

        // opcional: se quiseres mesmo garantir que o Feeder aparece
        cy.contains(".vt-table tbody tr", "Feeder").should("exist");
    });


    it("ao clicar numa linha abre o slide de detalhes com os campos certos", () => {
        // clica especificamente na linha que contém 'Panamax'
        cy.contains(".vt-table tbody tr", "Panamax").click();

        // slide deve aparecer
        cy.get(".vt-slide").should("exist");

        // verifica alguns campos de detalhe (compatíveis com a fixture)
        cy.get(".vt-slide").within(() => {
            cy.contains("Panamax").should("exist");
            cy.contains("Panamax class vessel").should("exist"); // mesma string da fixture
            cy.contains("8").should("exist");                 // capacityTeu
        });

        // botão de fechar funciona
        cy.get(".vt-slide-close").click();
        cy.get(".vt-slide").should("not.exist");
    });

    it("botão de criação no header abre o modal de criação e faz POST", () => {
        // intercept do POST
        cy.intercept("POST", API_BASE, (req) => {
            expect(req.body).to.include({
                name: "NewType",
                description: "New vessel type",
                maxBays: 12,
                maxRows: 14,
                maxTiers: 9,
            });

            req.reply({
                statusCode: 201,
                body: {
                    id: "3",
                    capacityTeu: 1512,
                    ...req.body,
                },
            });
        }).as("createVesselType");

        // abre modal
        cy.get(".vt-create-btn-top").click();
        cy.get(".vt-modal").should("exist");

        // preenche campos
        cy.get(".vt-modal").within(() => {
            cy.get(".vt-input").eq(0)
                .type("{selectAll}{backspace}NewType"); // name

            cy.get(".vt-input").eq(1)
                .type("{selectAll}{backspace}New vessel type"); // description

            cy.get(".vt-input").eq(2)
                .type("{selectAll}{backspace}12"); // maxBays

            cy.get(".vt-input").eq(3)
                .type("{selectAll}{backspace}14"); // maxRows

            cy.get(".vt-input").eq(4)
                .type("{selectAll}{backspace}9");  // maxTiers

            cy.get(".vt-btn-save").click();
        });

        // API chamada
        cy.wait("@createVesselType");

        // modal fechado
        cy.get(".vt-modal").should("not.exist");
    });

    it("a partir do slide de detalhes abre o modal de edição e faz PUT", () => {
        // escolhe o Feeder (segunda linha)
        cy.get(".vt-table tbody tr").eq(1).click();
        cy.get(".vt-slide").should("exist");

        // intercept do PUT
        cy.intercept("PUT", `${API_BASE}/*`, (req) => {
            expect(req.body).to.have.property("name", "Feeder-Updated");
            req.reply({
                statusCode: 200,
                body: { id: "2", capacityTeu: 1600, ...req.body },
            });
        }).as("updateVesselType");

        // abre modal de edição
        cy.get(".vt-btn-edit").click();
        cy.get(".vt-modal").should("exist");

        // altera o nome e guarda
        cy.get(".vt-modal").within(() => {
            cy.get(".vt-input").eq(0).clear().type("Feeder-Updated");
            cy.get(".vt-btn-save").click();
        });

        cy.wait("@updateVesselType");
        cy.get(".vt-modal").should("not.exist");
    });

    it("a partir do slide de detalhes abre o modal de delete e faz DELETE", () => {
        // seleciona a primeira linha
        cy.get(".vt-table tbody tr").first().click();
        cy.get(".vt-slide").should("exist");

        // abre modal de delete
        cy.get(".vt-btn-delete").click();
        cy.get(".vt-modal-delete").should("exist");

        // intercept do DELETE
        cy.intercept("DELETE", `${API_BASE}/*`, (req) => {
            // confirma que está a apagar o id certo
            expect(req.url).to.match(/\/api\/VesselType\/1$/);
            req.reply({ statusCode: 204 });
        }).as("deleteVesselType");

        // confirma delete
        cy.get(".vt-modal-delete").within(() => {
            cy.get(".vt-btn-delete").click();
        });

        cy.wait("@deleteVesselType");
        cy.get(".vt-modal-delete").should("not.exist");
    });
});
