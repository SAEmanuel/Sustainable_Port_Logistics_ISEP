describe("Incidents – E2E", () => {
    beforeEach(() => {
        // ---------- FIXTURES ----------
        const incidents = [
            {
                code: "INC-001",
                incidentTypeCode: "IT-1",
                vveList: ["VVE-1", "VVE-2"],
                startTime: "2025-01-01T10:00:00.000Z",
                endTime: null,
                duration: null,
                severity: "Minor",
                impactMode: "Specific",
                description: "Minor incident description",
                createdByUser: "sar@test.com",
                upcomingWindowStartTime: null,
                upcomingWindowEndTime: null,
            },
            {
                code: "INC-002",
                incidentTypeCode: "IT-2",
                vveList: [],
                startTime: "2025-01-05T12:00:00.000Z",
                endTime: "2025-01-05T14:00:00.000Z",
                duration: 120,
                severity: "Critical",
                impactMode: "AllOnGoing",
                description: "Critical resolved incident",
                createdByUser: "sar@test.com",
                upcomingWindowStartTime: null,
                upcomingWindowEndTime: null,
            },
            {
                code: "INC-003",
                incidentTypeCode: "IT-2",
                vveList: [],
                startTime: "2025-01-10T09:00:00.000Z",
                endTime: null,
                duration: null,
                severity: "Major",
                impactMode: "Upcoming",
                description: "Upcoming incident",
                createdByUser: "sar@test.com",
                upcomingWindowStartTime: "2025-01-11T00:00:00.000Z",
                upcomingWindowEndTime: "2025-01-12T00:00:00.000Z",
            },
        ];

        // dá resposta "completa" para o mapper de incident types (se existir mapper)
        const incidentTypes = [
            { id: "it1", code: "IT-1", name: "Type 1", description: "", severity: "Minor", parentCode: null },
            { id: "it2", code: "IT-2", name: "Type 2", description: "", severity: "Major", parentCode: null },
        ];

        // IMPORTANTE: o teu getAllVVEs faz mapToVVEDomain() -> devolve codes
        // Portanto devolvemos objetos "seguros" (com code e alguns campos comuns)
        const vvesApiPayload = [
            { id: "v1", code: "VVE-1", status: "Planned", createdAt: "2025-01-01T00:00:00.000Z" },
            { id: "v2", code: "VVE-2", status: "Planned", createdAt: "2025-01-01T00:00:00.000Z" },
            { id: "v3", code: "VVE-3", status: "Planned", createdAt: "2025-01-01T00:00:00.000Z" },
        ];

        // ---------- INTERCEPTS (robustos) ----------
        // Privacy Policy (tens calls a localhost:5008 no runner)
        cy.intercept("GET", "**/api/PrivacyPolicy/currentPrivacyPolicy", {
            statusCode: 200,
            body: { id: "pp1", title: "PP", content: "x", version: "1.0" },
        }).as("getPrivacyPolicy");

        // LISTA (não confunde com /active etc)
        cy.intercept("GET", /\/api\/incidents(\?.*)?$/i, { statusCode: 200, body: incidents }).as("getAll");

        cy.intercept("GET", /\/api\/incidents\/active(\?.*)?$/i, {
            statusCode: 200,
            body: incidents.filter((x) => !x.endTime),
        }).as("getActive");

        cy.intercept("GET", /\/api\/incidents\/resolved(\?.*)?$/i, {
            statusCode: 200,
            body: incidents.filter((x) => !!x.endTime),
        }).as("getResolved");

        cy.intercept("GET", /\/api\/incidents\/search\/severity(\?.*)?$/i, (req) => {
            const u = new URL(req.url);
            const sev = u.searchParams.get("severity");
            req.reply({ statusCode: 200, body: incidents.filter((x) => x.severity === sev) });
        }).as("getBySeverity");

        cy.intercept("GET", /\/api\/incidents\/search\/date(\?.*)?$/i, {
            statusCode: 200,
            body: incidents,
        }).as("getByDateRange");

        cy.intercept("GET", /\/api\/incidents\/vve\/[A-Za-z0-9-]+$/i, (req) => {
            const vve = req.url.split("/").pop()!;
            req.reply({ statusCode: 200, body: incidents.filter((x) => (x.vveList ?? []).includes(vve)) });
        }).as("getByVve");

        // /api/incidents/{code} (evita apanhar active/resolved/search/vve)
        cy.intercept("GET", /\/api\/incidents\/(?!active$|resolved$|search\/|vve\/)[A-Za-z0-9-]+$/i, (req) => {
            const code = req.url.split("/").pop()!;
            const found = incidents.find((x) => x.code === code);
            req.reply({ statusCode: found ? 200 : 404, body: found ?? {} });
        }).as("getByCode");

        // PATCH resolve
        cy.intercept("PATCH", /\/api\/incidents\/[A-Za-z0-9-]+\/resolve$/i, (req) => {
            const parts = req.url.split("/");
            const code = parts[parts.length - 2];
            const found = incidents.find((x) => x.code === code) ?? incidents[0];
            req.reply({
                statusCode: 200,
                body: { ...found, endTime: "2025-02-01T10:00:00.000Z", duration: 60 },
            });
        }).as("resolveIncident");

        // PATCH updateList
        cy.intercept("PATCH", /\/api\/incidents\/[A-Za-z0-9-]+\/updateList$/i, (req) => {
            const parts = req.url.split("/");
            const code = parts[parts.length - 2];
            const found = incidents.find((x) => x.code === code) ?? incidents[2];
            req.reply({ statusCode: 200, body: { ...found, vveList: ["VVE-1", "VVE-3"] } });
        }).as("updateListVVEs");

        // DELETE
        cy.intercept("DELETE", /\/api\/incidents\/[A-Za-z0-9-]+$/i, { statusCode: 204 }).as("deleteIncident");

        // POST create
        cy.intercept("POST", /\/api\/incidents$/i, (req) => {
            req.reply({ statusCode: 201, body: { ...req.body, duration: null } });
        }).as("createIncident");

        // PUT update
        cy.intercept("PUT", /\/api\/incidents\/[A-Za-z0-9-]+$/i, (req) => {
            const code = req.url.split("/").pop()!;
            const found = incidents.find((x) => x.code === code) ?? incidents[0];
            req.reply({ statusCode: 200, body: { ...found, ...req.body, code } });
        }).as("updateIncident");

        // GET /api/vve (para o modal)
        cy.intercept("GET", /\/api\/vve(\?.*)?$/i, { statusCode: 200, body: vvesApiPayload }).as("getAllVVEs");

        // GET incident types (para o modal) - super robusto: apanha /incident-types, /incidenttypes, etc
        // e evita /incidents (via (?!s))
        cy.intercept("GET", /\/api\/incident(?!s)[-]?types.*$/i, { statusCode: 200, body: incidentTypes }).as(
            "getAllIncidentTypes"
        );

        // ---------- VISIT ----------
        cy.visit("/incident");
        cy.wait("@getAll");
    });

    it("abre a página e mostra tabela e stats", () => {
        cy.get(".in-header").should("exist");
        cy.get("h1.in-h1").should("exist");

        // botão Create do HEADER (ancorado ao header)
        cy.get(".in-header > button.in-btn.in-btn-primary").should("exist");

        cy.get(".in-stat").should("have.length", 3);

        cy.get(".in-table").should("exist");
        cy.get(".in-table tbody tr").should("have.length.at.least", 1);

        cy.contains(".in-table tbody tr", "INC-001").should("exist");
        cy.contains(".in-table tbody tr", "INC-002").should("exist");
    });

    it("filtra por Active e atualiza tabela", () => {
        cy.get("form.in-filter-form select.in-input").first().select("active");
        cy.get("form.in-filter-form button[type='submit']").click();
        cy.wait("@getActive");

        cy.contains(".in-table tbody", "INC-002").should("not.exist");
        cy.contains(".in-table tbody", "INC-001").should("exist");
    });

    it("filtra por Resolved e atualiza tabela", () => {
        cy.get("form.in-filter-form select.in-input").first().select("resolved");
        cy.get("form.in-filter-form button[type='submit']").click();
        cy.wait("@getResolved");

        cy.contains(".in-table tbody", "INC-002").should("exist");
        cy.contains(".in-table tbody", "INC-001").should("not.exist");
    });

    it("filtra por Severity=Critical e atualiza tabela", () => {
        cy.get("form.in-filter-form select.in-input").first().select("severity");
        cy.get("form.in-filter-form select.in-input").eq(1).select("Critical");

        cy.get("form.in-filter-form button[type='submit']").click();
        cy.wait("@getBySeverity");

        cy.contains(".in-table tbody", "INC-002").should("exist");
        cy.contains(".in-table tbody", "INC-001").should("not.exist");
    });

    it("abre detalhes ao clicar numa linha e fecha ao clicar fora", () => {
        cy.contains(".in-table tbody tr", "INC-001").click({ force: true });

        cy.get(".in-details-overlay").should("exist");
        cy.get(".in-details-modal").should("be.visible");
        cy.contains(".in-details-modal", "INC-001").should("exist");

        cy.get(".in-details-overlay").click("topLeft");
        cy.get(".in-details-overlay").should("not.exist");
    });

    it("resolve incidente (PATCH /resolve) - garante que o botão existe", () => {
        cy.contains(".in-table tbody tr", "INC-001").click({ force: true });
        cy.get(".in-details-modal").should("be.visible");

        // botão resolve está dentro do modal e dentro da action bar
        cy.get(".in-details-modal .in-actions button.in-btn.in-btn-primary", { timeout: 10000 })
            .should("exist")
            .first()
            .click();

        cy.wait("@resolveIncident");
    });

    it("updateListsVVEs aparece para impactMode != Specific e !resolved (INC-003) e faz PATCH", () => {
        cy.contains(".in-table tbody tr", "INC-003").click({ force: true });
        cy.get(".in-details-modal").should("be.visible");

        // neste caso há 2 primaries: Resolve + Atualizar
        cy.get(".in-details-modal .in-actions button.in-btn.in-btn-primary", { timeout: 10000 })
            .should("have.length.at.least", 2)
            .last()
            .click();

        cy.wait("@updateListVVEs");
    });

    it("delete (confirm true) apaga incidente (DELETE)", () => {
        cy.window().then((win) => cy.stub(win, "confirm").returns(true));

        cy.contains(".in-table tbody tr", "INC-001").click({ force: true });
        cy.get(".in-details-modal").should("be.visible");

        cy.get(".in-details-modal .in-actions button.in-btn.in-btn-danger").click();
        cy.wait("@deleteIncident");

        cy.contains(".in-table tbody", "INC-001").should("not.exist");
    });

    it("criar incidente: abre modal, carrega VVEs + IncidentTypes, preenche, seleciona, e faz POST", () => {
        // botão create do header (ancorado ao header)
        cy.get(".in-header > button.in-btn.in-btn-primary").click();
        cy.get(".in-modal-overlay").should("exist");

        cy.wait("@getAllVVEs");
        cy.wait("@getAllIncidentTypes");

        // code (placeholder fixo)
        cy.get(".in-modal input[placeholder='Ex: INC-2025-00001']").type("INC-999");

        // description: é o 1º .in-group-full do modal (no teu JSX é a descrição)
        cy.get(".in-modal .in-group.in-group-full").first().find("input.in-input").type("Created by E2E");

        // Selector 0 = Incident Types
        cy.get(".in-modal .in-vve-selector").eq(0).within(() => {
            cy.contains(".in-vve-item", "IT-1").click();
        });

        // Selector 1 = VVEs (Specific default)
        cy.get(".in-modal .in-vve-selector").eq(1).within(() => {
            cy.contains(".in-vve-item", "VVE-1").click();
        });

        // SUBMIT do modal (não é o botão do header!)
        cy.get(".in-modal .in-modal-actions button[type='submit']").click();

        cy.wait("@createIncident");
        cy.get(".in-modal-overlay").should("not.exist");
    });

    it("editar incidente: abre modal via botão Edit e faz PUT", () => {
        cy.contains(".in-table tbody tr", "INC-001").within(() => {
            cy.get("button.in-btn.in-btn-ghost").click(); // Edit
        });

        cy.get(".in-modal-overlay").should("exist");

        // na abertura do modal também carrega VVEs + IncidentTypes
        cy.wait("@getAllVVEs");
        cy.wait("@getAllIncidentTypes");

        // description: 1º group-full
        cy.get(".in-modal .in-group.in-group-full").first().find("input.in-input").clear().type("Updated by E2E");

        cy.get(".in-modal .in-modal-actions button[type='submit']").click();

        cy.wait("@updateIncident");
        cy.get(".in-modal-overlay").should("not.exist");
    });
});
