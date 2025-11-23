const API_SAR = "http://localhost:5008/api/ShippingAgentRepresentative";
const SAR_PAGE_URL = "/sar";

describe("SAR – E2E", () => {

    beforeEach(() => {
        cy.fixture("sars.json").then((sars) => {
            cy.intercept("GET", API_SAR, {
                statusCode: 200,
                body: sars,
            }).as("getSARs");
        });

        cy.visit(SAR_PAGE_URL);
        cy.wait("@getSARs");
    });

    it("opens the SAR page and shows the list from the API", () => {

        cy.get(".vt-title-area").should("exist");
        cy.get(".vt-title").should("exist");
        cy.get(".vt-sub").should("exist");


        cy.get(".vt-table").should("exist");
        cy.get(".vt-table tbody tr").should("have.length", 2);


        cy.get(".vt-table").within(() => {
            cy.contains("Alice Martins").should("exist");
            cy.contains("Bruno Esteves").should("exist");
        });
    });

    it("searches by email using the API and filters the table", () => {

        cy.intercept("GET", `${API_SAR}/email/*`, {
            statusCode: 200,
            body: {
                id: "1",
                name: "Alice Martins",
                citizenId: { passportNumber: "P123456" },
                nationality: "Portugal",
                email: { address: "alice.martins@example.com" },
                phoneNumber: { number: "912345678" },
                sao: "SAO-01",
                notifs: [],
                status: "activated",
            },
        }).as("searchByEmail");


        cy.get(".vt-table tbody tr").its("length").should("be.gte", 1);


        cy.get("input.vt-search").clear().type("alice.martins@example.com");
        cy.get(".vt-search-btn").click();


        cy.wait("@searchByEmail");

        cy.get(".vt-table tbody tr").should("have.length", 1);


        cy.contains(".vt-table tbody tr", "alice.martins@example.com").should("exist");
    });

    it("opens the slide details when clicking a row and shows SAR info", () => {

        cy.contains(".vt-table tbody tr", "Alice Martins").click();


        cy.get(".vt-slide").should("exist");


        cy.get(".vt-slide").within(() => {
            cy.contains("Alice Martins").should("exist");
            cy.contains("alice.martins@example.com").should("exist");
            cy.contains("SAO-01").should("exist");
        });

        cy.get(".vt-slide-close").click();
        cy.get(".vt-slide").should("not.exist");
    });

    it("opens the create SAR modal from the header and performs POST", () => {
        cy.intercept(
            {
            method: "POST",
            url: /\/api\/ShippingAgentRepresentative\/?$/,
            },
            (req) => {
            expect(req.body).to.include({
                name: "New SAR",
                status: "activated",
            });

            req.reply({
                statusCode: 201,
                body: {
                id: "3",
                name: "New SAR",
                citizenId: { passportNumber: "P000000" },
                nationality: "Portugal",
                email: { address: "newsar@example.com" },
                phoneNumber: { number: "900000000" },
                sao: "SAO-NEW",
                notifs: [],
                status: "activated",
                },
            });
            }
        ).as("createSAR");

        cy.intercept("GET", "/api/ShippingAgentOrganization", {
            statusCode: 200,
            body: [
            {
                shippingOrganizationCode: { value: "SAO-NEW" },
                legalName: "SAO-NEW",
            },
            ],
        }).as("getSAOs");

        cy.get(".vt-create-btn-top").click();

        cy.wait("@getSAOs");

        cy.get(".vt-modal").within(() => {
            cy.get("input.vt-input").eq(0)
            .clear().type("New SAR"); 

            cy.get("input.vt-input").eq(1)
            .clear().type("P000000");

            cy.get("select.vt-input").eq(0).select("Portugal");

            cy.get("select.vt-input").eq(1).select("SAO-NEW");

            cy.get("input.vt-input").eq(2)
            .clear().type("newsar@example.com");

            cy.get("input.vt-input").eq(3)
            .clear().type("900000000");

            cy.get("select.vt-input").eq(2).select("activated");

            cy.get(".vt-btn-save").click();
        });

        cy.wait("@createSAR");
        cy.get(".vt-modal").should("not.exist");
    });

    it("opens the edit SAR modal from the slide and performs PATCH", () => {
        cy.get(".vt-table tbody tr").eq(1).click();
        cy.get(".vt-slide").should("exist");

        cy.intercept("PATCH", `${API_SAR}/update/*`, (req) => {
            expect(req.body).to.have.property("status", "deactivated");
            req.reply({
                statusCode: 200,
                body: {
                    id: "2",
                    name: "Bruno Esteves",
                    citizenId: { passportNumber: "P987654" },
                    nationality: "ES",
                    email: { address: "bruno.esteves@example.com" },
                    phoneNumber: { number: "934567890" },
                    sao: "SAO-02",
                    notifs: [],
                    status: "deactivated",
                },
            });
        }).as("updateSAR");

        cy.get(".vt-btn-edit").click();
        cy.get(".vt-modal").should("exist");

        cy.get(".vt-modal").within(() => {

            cy.get(".vt-input").eq(2) 
                .select("deactivated");

            cy.get(".vt-btn-save").click();
        });

        cy.wait("@updateSAR");
        cy.get(".vt-modal").should("not.exist");
    });

    it("opens the delete SAR modal from the slide and performs DELETE", () => {
        cy.get(".vt-table tbody tr").first().click();
        cy.get(".vt-slide").should("exist");

        cy.get(".vt-btn-delete").click();
        cy.get(".vt-modal-delete").should("exist");

        cy.intercept("DELETE", `${API_SAR}/*`, (req) => {
            expect(req.url).to.match(/\/api\/ShippingAgentRepresentative\/1$/);
            req.reply({ statusCode: 204 });
        }).as("deleteSAR");

        cy.get(".vt-modal-delete").within(() => {
            cy.get(".vt-btn-delete").click();
        });

        cy.wait("@deleteSAR");
        cy.get(".vt-modal-delete").should("not.exist");
    });
});
