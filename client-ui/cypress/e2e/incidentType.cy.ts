describe("Incident Types – E2E", () => {
    /**
     * Setup:
     * 1. Mock dos dados (Roots e Children)
     * 2. Intercepts ROBUSTOS (Regex)
     * 3. Visit da página correta
     */
    beforeEach(() => {
        const incidentTypes = [
            {
                id: "1",
                code: "T-INC001",
                name: "Environmental",
                description: "Nature related",
                severity: "Major",
                parentCode: null
            },
            {
                id: "2",
                code: "T-INC002",
                name: "Fire",
                description: "Fire incident",
                severity: "Critical",
                parentCode: "T-INC001"
            }
        ];

        // 1. Intercept GENÉRICO (Definimos este primeiro)
        // Apanha qualquer ID (ex: T-INC001), mas também apanharia "roots" se fosse o último.
        cy.intercept("GET", /\/api\/incident[-]?types\/[a-z0-9-]+$/i, {
            statusCode: 200,
            body: incidentTypes[0],
        }).as("getGeneral");

        // 2. Intercept ESPECÍFICO (Definimos este em SEGUNDO para ter prioridade)
        // Como é o último matching, o Cypress usa este para o URL .../roots
        cy.intercept("GET", /\/api\/incident[-]?types(\/roots)?(\?.*)?$/i, {
            statusCode: 200,
            body: [incidentTypes[0]],
        }).as("getRoots");

        // 3. Subtree
        cy.intercept("GET", /\/api\/incident[-]?types\/.*\/subtree$/i, {
            statusCode: 200,
            body: incidentTypes,
        }).as("getSubtree");

        // 4. Create
        cy.intercept("POST", /\/api\/incident[-]?types$/i, (req) => {
            req.reply({ statusCode: 201, body: { id: "99", ...req.body } });
        }).as("createIncidentType");

        // 5. Update
        cy.intercept("PUT", /\/api\/incident[-]?types\/.*$/i, (req) => {
            req.reply({ statusCode: 200, body: { id: "1", ...req.body } });
        }).as("updateIncidentType");

        // Visitar a página
        cy.visit("/incidentType");

        // Agora o pedido vai ser apanhado corretamente pelo @getRoots
        cy.wait("@getRoots");
    });

    it("abre a página e mostra a tabela de Roots e o painel de hierarquia vazio", () => {
        // Header
        cy.get(".it-header h1").should("contain", "Incident Types");

        // Stats cards
        cy.get(".it-stat-card").should("have.length", 3);

        // Tabela: deve ter 1 linha (o Root T-INC001)
        cy.get(".it-table tbody tr").should("have.length", 1);
        cy.get(".it-table tbody tr").first().within(() => {
            cy.contains("T-INC001").should("exist");
            cy.contains("Environmental").should("exist");
            cy.contains("ROOT").should("exist"); // Badge
        });

        // Painel Hierarquia (Vazio inicialmente)
        cy.get(".it-hierarchy-empty").should("exist");
    });

    it("faz pesquisa por NOME e atualiza a tabela", () => {
        // Intercept específico para a busca (opcional, se quiseres forçar resposta diferente)
        cy.intercept("GET", /\/api\/incident[-]?types(\?.*name=Fire.*)?$/i, {
            statusCode: 200,
            body: [{
                id: "2",
                code: "T-INC002",
                name: "Fire",
                severity: "Critical",
                parentCode: "T-INC001"
            }]
        }).as("searchByName");

        // 1. Selecionar tipo de filtro "Name"
        cy.get(".it-search-type-select").select("name");

        // 2. Escrever "Fire"
        cy.get(".it-search-input").type("Fire");

        // 3. Clicar Search
        cy.get(".it-search-button").click();

        // 4. Verifica tabela atualizada
        // Nota: O cy.contains procura texto em qualquer lugar, é mais seguro
        cy.get(".it-table tbody").contains("Fire").should("exist");
    });

    it("ao clicar numa linha, carrega a árvore no painel direito", () => {
        // Clica na linha do T-INC001
        cy.contains(".it-table tbody tr", "T-INC001").click();

        cy.wait("@getSubtree");

        // Painel Direito
        cy.get(".it-hierarchy-card").within(() => {
            // Título atualizado
            cy.contains("T-INC001 — Environmental").should("exist");

            // Árvore renderizada
            cy.get(".it-tree-node").should("exist");

            // Verifica se o nó filho (Fire) aparece na árvore
            cy.contains("Fire").should("exist");
        });
    });

    it("botão de criação abre modal (Stepper) e faz POST", () => {
        // 1. Abrir modal
        cy.get(".create-it-button").click();
        cy.get(".it-modal-overlay").should("exist");

        // --- STEP 1: Parent Selection ---
        // Verifica se estamos no passo 1
        cy.get(".it-stepper .active").should("contain", "1");

        // CORREÇÃO: Em vez de procurar pelo texto "None" (que muda com a língua),
        // clicamos no PRIMEIRO card, que é sempre a opção de "Root/Sem Pai".
        cy.get(".it-parent-card").first().click();

        // Clicar em Next / Próximo
        // Usamos Regex para funcionar em Inglês ou Português
        cy.get(".it-submit-button").contains(/Next|Próximo|Seguinte/i).click();

        // --- STEP 2: Details ---
        cy.get(".it-details-header").should("exist");

        // Preencher formulário
        // Nota: Garante que os "name" dos inputs estão corretos no teu código React
        cy.get("input[name='code']").type("T-INC999");
        cy.get("input[name='name']").type("Test Type");
        cy.get("input[name='description']").type("Automated Test Description");
        cy.get("select[name='severity']").select("Minor");

        // Submit Final (Create / Criar)
        cy.get(".it-submit-button").contains(/Create|Criar/i).click();

        // Verifica se o POST foi feito e o modal fechou
        cy.wait("@createIncidentType");
        cy.get(".it-modal-overlay").should("not.exist");
    });

    it("botão de editar na tabela abre modal e faz PUT", () => {
        // 1. Clicar no botão Edit na linha da tabela
        cy.get(".it-table tbody tr").first().find(".pr-edit-button").click();

        cy.get(".it-modal-overlay").should("exist");

        // 2. Editar campos
        // O campo Code deve estar disabled
        cy.get("input[value='T-INC001']").should("be.disabled");

        // Alterar Nome
        cy.get("input[name='name']").clear().type("Environmental Updated");

        // 3. Testar pesquisa de Pai
        cy.get(".it-search-input-small").type("Fire");

        // 4. Guardar
        cy.get(".it-submit-button").contains(/Save|Salvar/i).click();

        cy.wait("@updateIncidentType");
        cy.get(".it-modal-overlay").should("not.exist");
    });
});