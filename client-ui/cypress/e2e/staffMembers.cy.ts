const API_BASE = "**/api/StaffMembers";
const API_QUALIFICATIONS = "**/api/Qualifications";

describe("Staff Members – E2E (Simplificado)", () => {
    const mockQualifications = [
        { id: "1", code: "STS-001", name: "Estivador" },
        { id: "2", code: "MTN-001", name: "Manutenção" },
        { id: "3", code: "QLF-NEW", name: "Nova Qualificação" },
    ];

    const MEC_ALICE = "M001";
    const NAME_ALICE = "Alice Johnson";
    const NEW_EMAIL = "alice.new@port.com";

    beforeEach(() => {
        cy.fixture("staffMembers.json").then((staffMembers) => {
            cy.intercept("GET", API_BASE, {
                statusCode: 200,
                body: staffMembers,
            }).as("getStaffMembers");
        });

        cy.intercept("GET", API_QUALIFICATIONS, {
            statusCode: 200,
            body: mockQualifications,
        }).as("getQualifications");

        cy.visit("/staff-members");
        cy.wait("@getStaffMembers");
    });

    it("1. Abre a página e mostra a tabela com 2 dados iniciais", () => {
        cy.get(".staffMember-title-area").should("exist");
        cy.get(".staffMember-table tbody tr").should("have.length", 2);

        cy.contains(MEC_ALICE).should("exist");
        cy.contains("Bob Smith").should("exist");
    });

    it("2. Toggle status a partir do slide: M001 desativa e faz PUT no endpoint de toggle", () => {
        const mecNumber = MEC_ALICE;
        const updatedStaff = {
            id: "1",
            mecanographicNumber: mecNumber,
            isActive: false,
            shortName: NAME_ALICE,
            email: "alice.johnson@example.com",
            phone: "+351912345600",
            schedule: { shift: "Morning", daysOfWeek: "0000011" },
            qualificationCodes: ["STS-001", "MTN-001"]
        };

        cy.contains(".staffMember-row", mecNumber).click();

        cy.get(".staffMember-slide").should("exist");
        cy.get(".badge-active").should("exist");

        cy.intercept("PUT", `${API_BASE}/toggle/${mecNumber}`, {
            statusCode: 200,
            body: updatedStaff,
        }).as("toggleStatus");

        cy.get(".staffMember-btn-toggle").click();

        cy.wait("@toggleStatus");

        cy.get(".badge-inactive").should("exist");
        cy.get(".staffMember-slide").should("have.attr", "data-staff-inactive", "true");
    });

    it("3. Busca por Número Mecanográfico (M002) exibe o card de resultado", () => {
        const mecNumber = "M002";
        const searchResult = { id: "2", mecanographicNumber: mecNumber, shortName: "Bob Smith", isActive: true, schedule: { shift: "Evening", daysOfWeek: "0000100" }, qualificationCodes: [] };

        cy.intercept("GET", `${API_BASE}/mec/${mecNumber}`, {
            statusCode: 200,
            body: searchResult,
        }).as("searchByMecNumber");

        cy.get(".staff-search-buttons button").eq(1).click();

        cy.get(".staff-search-box").should("exist");

        cy.get(".staff-search-input").type(mecNumber);

        cy.get(".staff-search-btn").click();

        cy.wait("@searchByMecNumber");

        cy.get(".staff-search-result").should("exist");
        cy.get(".staff-result-card").should("contain.text", "Bob Smith");
    });

    it("4. Botão de criação abre o modal, preenche o mínimo e faz POST", () => {
        const newStaff = {
            shortName: "New Hire",
            email: "new@port.com",
            phone: "999999999",
            schedule: { shift: "Morning", daysOfWeek: "0000001" },
        };

        cy.intercept("POST", API_BASE, (req) => {
            expect(req.body.shortName).to.equal(newStaff.shortName);
            expect(req.body.schedule.daysOfWeek).to.equal(newStaff.schedule.daysOfWeek);
            req.reply({
                statusCode: 201,
                body: { id: "3", mecanographicNumber: "M003", ...newStaff, isActive: true, qualificationCodes: [] },
            });
        }).as("createStaffMember");

        cy.get(".staff-create-btn-top").click();

        cy.get(".staffMember-create-modal").should("exist");
        cy.wait("@getQualifications");

        cy.get(".staffMember-create-modal").within(() => {

            cy.get(".staffMember-form-group input").eq(0).type(newStaff.shortName);

            cy.get(".staffMember-form-group input").eq(1).type(newStaff.email);

            cy.get(".staffMember-form-group input").eq(2).type(newStaff.phone);

            cy.get(".staffMember-weekday-item").eq(0).click();

            cy.get(".staffMember-btn-save").click();
        });

        cy.wait("@createStaffMember");
        cy.get(".staffMember-create-modal").should("not.exist");

        cy.get(".staffMember-table tbody tr").should("have.length", 3);
    });

    it("5. Edição: Altera email e ADICIONA uma qualificação (QLF-NEW)", () => {
        const mecNumber = MEC_ALICE;
        const newEmail = NEW_EMAIL;
        const newQual = "QLF-NEW";
        const updateData = {
            mecNumber: mecNumber,
            email: newEmail,
            qualificationCodes: [newQual],
            addQualifications: true,
        };
        const mockUpdatedResponse = {
            id: "1",
            mecanographicNumber: mecNumber,
            email: newEmail,
            qualificationCodes: ["STS-001", "MTN-001", newQual],
            shortName: NAME_ALICE,
            schedule: { shift: "Morning", daysOfWeek: "0000011" },
            isActive: true
        };

        cy.contains(".staffMember-row", mecNumber).click();
        cy.get(".staffMember-slide").should("exist");

        cy.get(".staffMember-btn-edit").click();

        cy.get(".staffMember-create-modal").should("exist");

        cy.intercept("PUT", `${API_BASE}/update`, (req) => {
            expect(req.body).to.deep.include(updateData);
            req.reply({ statusCode: 200, body: mockUpdatedResponse });
        }).as("updateStaffMember");

        cy.get(".staffMember-create-modal").within(() => {

            cy.get('.staffMember-form-group input').eq(1).clear().type(newEmail);

            cy.get(".staffMember-checkbox-label input[type='checkbox']").eq(2).click();

            cy.wait("@getQualifications");

            cy.contains(".staffMember-qual-item", newQual).click();

            cy.get(".staffMember-btn-save").click();
        });

        cy.wait("@updateStaffMember");
        cy.get(".staffMember-create-modal").should("not.exist");
    });
});