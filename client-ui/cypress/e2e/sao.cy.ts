const API_SAO = "http://localhost:5008/api/ShippingAgentOrganization";
const SAO_PAGE_URL = "/sao";

describe("SAO – E2E", () => {
  beforeEach(() => {
    cy.fixture("sao.json").then((saos) => {
      cy.intercept("GET", API_SAO, {
        statusCode: 200,
        body: saos,
      }).as("getSAOs");
    });

    cy.visit(SAO_PAGE_URL);
    cy.wait("@getSAOs");
  });

  it("abre a página de SAO e mostra a lista", () => {
    cy.get(".sao-table").should("exist");
    cy.get(".sao-table tbody tr").should("have.length", 2);

    cy.contains("TransGlobal Shipping").should("exist");
    cy.contains("Lusitania Cargo SA").should("exist");
  });

  it("pesquisa por legalName e filtra a tabela", () => {
    cy.intercept("GET", `${API_SAO}/legalName/*`, {
      statusCode: 200,
      body: {
        shippingOrganizationCode: { value: "SAO0000001" },
        legalName: "TransGlobal Shipping",
        altName: "TGS",
        address: "Rua do Porto 123",
        taxnumber: { value: "PT508112233" },
      },
    }).as("searchByLegalName");

    cy.get("input.sao-search").clear().type("TransGlobal Shipping");
    cy.get(".sao-search-btn").click();

    cy.wait("@searchByLegalName");

    cy.get(".sao-table tbody tr").should("have.length", 1);
    cy.contains("TransGlobal Shipping").should("exist");
  });

  it("abre o slide ao clicar numa linha e mostra detalhes", () => {
    cy.contains(".sao-table tbody tr", "TransGlobal Shipping").click();

    cy.get(".sao-slide").should("exist");
    cy.contains("TransGlobal Shipping").should("exist");
    cy.contains("PT508112233").should("exist");

    cy.get(".sao-slide-close").click();
    cy.get(".sao-slide").should("not.exist");
  });

  it("cria uma nova SAO através do modal, faz POST e apaga da BD no fim", () => {

    cy.intercept("GET", API_SAO, (req) => {
      req.continue();
    }).as("getSAOsReal");


    cy.intercept("POST", API_SAO).as("createSAO");

    cy.visit(SAO_PAGE_URL);
    cy.wait("@getSAOsReal");


    cy.get(".sao-create-btn-top").click();
    cy.get(".sao-modal").should("be.visible");


    cy.get(".sao-modal .sao-input").eq(0).type("Nova SAO");          // legalName
    cy.get(".sao-modal .sao-input").eq(1).type("NSA");               // altName
    cy.get(".sao-modal .sao-input").eq(2).type("Rua Exemplo 123");   // address
    cy.get(".sao-modal .sao-input").eq(3).type("PT508112244");       // taxnumber


    cy.get(".sao-modal .sao-btn-save").click();


    cy.wait("@createSAO").then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);

      const body = interception.response?.body;

      const createdCode = body?.shippingOrganizationCode ?? body?.code;


      expect(createdCode, "código da SAO criada deve existir na resposta").to.exist;


      cy.contains("td", "Nova SAO").should("exist");


      cy.request("DELETE", `${API_SAO}/legalName/${encodeURIComponent("Nova SAO")}`)
        .its("status")
        .should("be.oneOf", [200, 204]);
    });
  });
});
