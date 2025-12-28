describe("Complementary Tasks – E2E", () => {
    const categories = [
        {
            id: "cat-1",
            code: "CTC001",
            name: "General Support",
            description: "General complementary operations",
            category: "Maintenance",
            defaultDuration: 60,
            isActive: true
        },
        {
            id: "cat-2",
            code: "CTC002",
            name: "Technical Operations",
            description: "Technical complementary support",
            category: "Safety and Security",
            defaultDuration: 45,
            isActive: true
        }
    ];

    const vves = [
        {
            id: "vve-1",
            code: "VVE-001"
        },
        {
            id: "vve-2",
            code: "VVE-002"
        }
    ];

    const tasks = [
        {
            id: "1",
            code: "CT001",
            category: categories[0].id,
            staff: "John Doe",
            timeStart: "2025-01-01T10:00:00Z",
            timeEnd: null,
            status: "Scheduled",
            vve: vves[0].id
        },
        {
            id: "2",
            code: "CT002",
            category: categories[1].id,
            staff: "Jane Smith",
            timeStart: "2025-01-01T11:00:00Z",
            timeEnd: null,
            status: "InProgress",
            vve: vves[1].id
        }
    ];

    beforeEach(() => {
        cy.intercept(
            "GET",
            /\/api\/complementary-tasks(\?.*)?$/i,
            { statusCode: 200, body: tasks }
        ).as("getCT");

        cy.intercept(
            "GET",
            /\/api\/complementary-task-categories(\?.*)?$/i,
            { statusCode: 200, body: categories }
        ).as("getCTC");

        cy.intercept(
            "POST",
            /\/api\/complementary-tasks$/i,
            req =>
                req.reply({
                    statusCode: 201,
                    body: {
                        id: "99",
                        code: "CT999",
                        status: "Scheduled",
                        timeEnd: null,
                        ...req.body
                    }
                })
        ).as("createCT");

        cy.intercept(
            "PUT",
            /\/api\/complementary-tasks\/.+$/i,
            req =>
                req.reply({
                    statusCode: 200,
                    body: {
                        ...tasks[0],
                        ...req.body
                    }
                })
        ).as("updateCT");

        cy.visit("/ct");
        cy.wait("@getCT");
        cy.wait("@getCTC");
    });

    it("1️⃣ Loads page and shows tasks table", () => {
        cy.get(".ct-table tbody tr").should("have.length", 2);
        cy.contains("td", "CT001").should("exist");
        cy.contains("td", "CT002").should("exist");
    });

    it("2️⃣ Creates a new complementary task", () => {

        cy.get("button.create-ct-button").click();

        cy.get(".ct-modal-overlay").should("exist");

        // CATEGORY
        cy.get("#ct-category")
            .should("be.visible")
            .find("option")
            .eq(1)
            .then(opt => cy.get("#ct-category").select(opt.val() as string));

        // VVE
        cy.get("#ct-vve")
            .should("be.visible")
            .find("option")
            .eq(1)
            .then(opt => cy.get("#ct-vve").select(opt.val() as string));

        // STAFF (required)
        cy.get("#ct-staff")
            .clear()
            .type("Cypress Operator");

        // START DATE (required)
        cy.get("#ct-timeStart")
            .type("2025-01-05T10:30");

        // SUBMIT
        cy.get(".ct-submit-button")
            .should("be.enabled")
            .click();

        cy.wait("@createCT");

        cy.get(".ct-modal-overlay").should("not.exist");
    });

    it("3️⃣ Edits an existing complementary task", () => {
        cy.contains(".ct-table tbody tr", "CT001")
            .find(".pr-edit-button")
            .click();

        cy.get(".ct-modal-overlay").should("exist");

        cy.get("#ct-edit-staff")
            .clear()
            .type("Updated Staff");

        cy.get("#ct-edit-startTime")
            .clear()
            .type("2025-01-01T12:00");

        cy.get("#ct-edit-status").select("InProgress");

        cy.get(".ct-submit-button").should("be.enabled").click();

        cy.wait("@updateCT");
        cy.get(".ct-modal-overlay").should("not.exist");
    });

    it("4️⃣ Marks an in-progress task as completed", () => {
        cy.contains(".ct-table tbody tr", "CT002")
            .within(() => {
                cy.get(".ct-status-btn-complete").click();
            });

        cy.wait("@updateCT");
    });
});