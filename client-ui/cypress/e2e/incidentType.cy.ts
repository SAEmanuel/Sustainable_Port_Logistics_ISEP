describe("Incident Types – E2E (robusto)", () => {
    beforeEach(() => {
        // -------------------------
        // "DB" em memória (mutável)
        // -------------------------
        const store = {
            types: [
                {
                    id: "1",
                    code: "T-INC001",
                    name: "Environmental",
                    description: "Nature related",
                    severity: "Major",
                    parentCode: null,
                },
                {
                    id: "2",
                    code: "T-INC002",
                    name: "Fire",
                    description: "Fire incident",
                    severity: "Critical",
                    parentCode: "T-INC001",
                },
            ] as Array<{
                id: string;
                code: string;
                name: string;
                description: string;
                severity: "Minor" | "Major" | "Critical";
                parentCode: string | null;
            }>,
        };

        const rootsOf = () => store.types.filter((t) => t.parentCode === null);
        const byCode = (code: string) => store.types.find((t) => t.code === code);

        // -------------------------
        // INTERCEPTS (endpoints reais)
        // -------------------------

        // GET /api/incidentTypes/roots
        cy.intercept("GET", "**/api/incidentTypes/roots*", (req) => {
            req.reply({ statusCode: 200, body: rootsOf() });
        }).as("getRoots");

        // GET /api/incidentTypes/search/all
        cy.intercept("GET", "**/api/incidentTypes/search/all*", (req) => {
            req.reply({ statusCode: 200, body: store.types });
        }).as("getAllIncidentTypes");

        // GET /api/incidentTypes/search/name?name=...
        cy.intercept("GET", "**/api/incidentTypes/search/name*", (req) => {
            const u = new URL(req.url);
            const q = (u.searchParams.get("name") ?? "").toLowerCase();
            const filtered = store.types.filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    t.code.toLowerCase().includes(q)
            );
            req.reply({ statusCode: 200, body: filtered });
        }).as("searchByName");

        // GET /api/incidentTypes/{code}/children
        cy.intercept("GET", /\/api\/incidentTypes\/[^/]+\/children(\?.*)?$/i, (req) => {
            const code = req.url.split("/").slice(-2, -1)[0]; // .../{code}/children
            const children = store.types.filter((t) => t.parentCode === code);
            req.reply({ statusCode: 200, body: children });
        }).as("getChildren");

        // GET /api/incidentTypes/{code}/subtree
        cy.intercept("GET", /\/api\/incidentTypes\/[^/]+\/subtree(\?.*)?$/i, (req) => {
            // Para o teu buildTree funcionar, basta devolver a lista com pais+filhos.
            // Devolver tudo é suficiente e mais robusto para E2E.
            req.reply({ statusCode: 200, body: store.types });
        }).as("getSubtree");

        // GET /api/incidentTypes/{code}  (exclui roots/search)
        cy.intercept("GET", /\/api\/incidentTypes\/(?!roots$|search\/)[A-Za-z0-9-]+(\?.*)?$/i, (req) => {
            const last = req.url.split("?")[0].split("/").pop()!;
            const one = byCode(last);
            if (!one) req.reply({ statusCode: 404, body: {} });
            else req.reply({ statusCode: 200, body: one });
        }).as("getByCode");

        // POST /api/incidentTypes
        cy.intercept("POST", "**/api/incidentTypes", (req) => {
            const dto = req.body as any;

            const created = {
                id: String(Date.now()),
                code: dto.code,
                name: dto.name,
                description: dto.description ?? "",
                severity: dto.severity ?? "Minor",
                parentCode: dto.parentCode ?? null,
            };

            // Update store
            store.types.unshift(created);

            req.reply({ statusCode: 201, body: created });
        }).as("createIncidentType");

        // PUT /api/incidentTypes/{code}
        cy.intercept("PUT", /\/api\/incidentTypes\/[A-Za-z0-9-]+$/i, (req) => {
            const code = req.url.split("/").pop()!;
            const dto = req.body as any;

            const idx = store.types.findIndex((t) => t.code === code);
            if (idx === -1) {
                req.reply({ statusCode: 404, body: {} });
                return;
            }

            store.types[idx] = {
                ...store.types[idx],
                name: dto.name ?? store.types[idx].name,
                description: dto.description ?? store.types[idx].description,
                severity: dto.severity ?? store.types[idx].severity,
                parentCode: dto.parentCode === undefined ? store.types[idx].parentCode : dto.parentCode,
            };

            req.reply({ statusCode: 200, body: store.types[idx] });
        }).as("updateIncidentType");

        // DELETE /api/incidentTypes/{code}
        cy.intercept("DELETE", /\/api\/incidentTypes\/[A-Za-z0-9-]+$/i, (req) => {
            const code = req.url.split("/").pop()!;
            store.types = store.types.filter((t) => t.code !== code);
            req.reply({ statusCode: 204, body: {} });
        }).as("deleteIncidentType");

        // -------------------------
        // VISIT
        // -------------------------
        cy.visit("/incidentType");
        cy.wait("@getRoots");
    });

    it("abre a página, mostra stats, tabela de roots e painel de hierarquia vazio", () => {
        cy.get(".it-header").should("exist");
        cy.get(".it-header h1").should("exist");

        cy.get(".it-stat-card").should("have.length", 3);

        // Roots (só T-INC001 inicialmente)
        cy.get(".it-table tbody tr").should("have.length", 1);
        cy.contains(".it-table tbody tr", "T-INC001").should("exist");
        cy.contains(".it-table tbody tr", "Environmental").should("exist");
        cy.contains(".it-table tbody tr", "ROOT").should("exist");

        cy.get(".it-hierarchy-empty").should("exist");
    });

    it("pesquisa por NAME e atualiza a tabela", () => {
        cy.get(".it-search-type-select").select("name");
        cy.get(".it-search-input").type("Fire");
        cy.get(".it-search-button").click();

        cy.wait("@searchByName");

        // Deve aparecer o tipo Fire
        cy.contains(".it-table tbody", "T-INC002").should("exist");
        cy.contains(".it-table tbody", "Fire").should("exist");
    });

    it("ao clicar numa linha, carrega subtree e mostra árvore no painel direito", () => {
        cy.contains(".it-table tbody tr", "T-INC001").click();
        cy.wait("@getSubtree");

        cy.get(".it-hierarchy-card").within(() => {
            cy.contains("T-INC001 — Environmental").should("exist");
            cy.get(".it-tree-node").should("exist");
            cy.contains("Fire").should("exist");
        });
    });

    it("criar: abre modal, escolhe Root, next, preenche e faz POST; depois aparece na tabela", () => {
        cy.get(".create-it-button").click();
        cy.get(".it-modal-overlay").should("exist");

        // Ao abrir modal, carrega roots para sugestões
        cy.wait("@getRoots");

        // STEP 1: escolhe Root (primeiro card)
        cy.get(".it-parent-card").first().click();
        cy.get(".it-modal-actions-wizard--single .it-submit-button").click();

        // STEP 2: preencher
        cy.get("input[name='code']").type("T-INC999");
        cy.get("input[name='name']").type("New Type");
        cy.get("input[name='description']").type("Created by Cypress");
        cy.get("select[name='severity']").select("Minor");

        cy.get("button[type='submit'].it-submit-button").click();
        cy.wait("@createIncidentType");

        // Modal fecha (por onCreated no page)
        cy.get(".it-modal-overlay").should("not.exist");

        // Page faz refresh roots (root novo deve aparecer)
        cy.wait("@getRoots");

        cy.contains(".it-table tbody", "T-INC999").should("exist");
        cy.contains(".it-table tbody", "New Type").should("exist");
    });

    it("editar: abre modal, altera nome, pesquisa pai (opcional), salva e faz PUT; tabela reflete update", () => {
        // Garantir que estamos na lista de roots
        cy.get(".it-search-type-select").select("roots");
        cy.get(".it-search-button").click();
        cy.wait("@getRoots");

        // Clica Edit (primeiro botão dentro da célula de ações)
        cy.contains(".it-table tbody tr", "T-INC001").within(() => {
            cy.get("td")
                .last()
                .find("button.pr-edit-button")
                .first()
                .click();
        });

        cy.get(".it-modal-overlay").should("exist");

        // Edit modal carrega roots para candidates
        cy.wait("@getRoots");

        // Code read-only
        cy.get(".it-modal-overlay .it-modal-content")
            .find("input.info-card-input")
            .should("have.value", "T-INC001")
            .and("be.disabled");

        // Mudar name
        cy.get("input[name='name']").clear().type("Environmental Updated");

        // Testar pesquisa de pai (não depende de tradução)
        cy.get(".it-search-input-small").type("Fire");
        cy.wait("@searchByName"); // debounced, mas o click não é necessário; o efeito faz request

        // Mudar parent (opcional): aqui deixo sem pai para não criar ciclo,
        // mas se quiseres escolher parent basta selecionar pelo value.
        // cy.get("select[name='parentCode']").select("T-INC002");

        cy.get("button[type='submit'].it-submit-button").click();
        cy.wait("@updateIncidentType");

        cy.get(".it-modal-overlay").should("not.exist");

        // Page recarrega roots
        cy.wait("@getRoots");

        cy.contains(".it-table tbody", "Environmental Updated").should("exist");
    });

    it("delete: confirma e apaga (DELETE); tabela não volta a mostrar item após refresh", () => {
        cy.window().then((win) => cy.stub(win, "confirm").returns(true));

        cy.contains(".it-table tbody tr", "T-INC001").within(() => {
            cy.get("td")
                .last()
                .find("button.pr-edit-button")
                .eq(1) // segundo botão = delete
                .click();
        });

        cy.wait("@deleteIncidentType");

        // handler faz loadRoots no final
        cy.wait("@getRoots");

        cy.contains(".it-table tbody", "T-INC001").should("not.exist");
    });

    it("search ALL: lista todos os incident types (roots + children)", () => {
        cy.get(".it-search-type-select").select("all");
        cy.get(".it-search-button").click();
        cy.wait("@getAllIncidentTypes");

        cy.contains(".it-table tbody", "T-INC001").should("exist");
        cy.contains(".it-table tbody", "T-INC002").should("exist");
    });

    it("search CODE: devolve 1 item e auto-seleciona + carrega subtree", () => {
        cy.get(".it-search-type-select").select("code");
        cy.get(".it-search-input").type("T-INC001");
        cy.get(".it-search-button").click();

        cy.wait("@getByCode");
        cy.wait("@getSubtree");

        cy.get(".it-hierarchy-card").within(() => {
            cy.contains("T-INC001 — Environmental").should("exist");
        });
    });
});
