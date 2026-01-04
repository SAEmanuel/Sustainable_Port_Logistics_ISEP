// cypress/e2e/vve.cy.ts
/// <reference types="cypress" />

describe("Vessel Visit Execution (E2E) - Full Suite", () => {
  const VVE_PATH = "/vve";

  // ✅ Tipo igual ao usado no FE (CompleteVVEModal)
  type ExecutedOperationFromBackend = {
    plannedOperationId: string;
    actualStart?: string | null;
    actualEnd?: string | null;
    status?: "started" | "completed" | "delayed";
  };

  // Helper: PlannedOperationId EXACTAMENTE como no FE: `${vve.vvnId}-${idx}`
  const plannedId = (vvnId: string, idx: number) => `${vvnId}-${idx}`;

  // ✅ inclui `code` porque CompleteVVEModal chama VesselVisitExecutionService.complete(..., vve.code)
  const historyVves = [
    {
      id: "vve-1",
      code: "VVE2025001",
      vvnId: "vvn-100",
      actualArrivalTime: "2025-01-01T10:00:00Z",
      status: "IN_PORT",
      creatorEmail: "admin@port.com",
    },
  ];

  const pendingVvns = [
    {
      id: "vvn-200",
      code: "VVN2025001",
      vesselImo: "IMO9999999",
      status: "ACCEPTED",
      volume: 120,
      crewManifest: true,
    },
  ];

  const mockVessel = { name: "MSC GULSUN", imo: "IMO9999999", flag: "PA" };
  const mockDefaultVessel = { name: "Unknown Ship", imo: "IMO0000000" };

  // --- Mocks para docks (evita chamadas reais /api/Dock) ---
  const mockDocks = [{ id: "dock-1", code: "DK-1" }];

  // ✅ Mock do plano COMPLETO e no shape esperado pelo FE (IOperationPlanDTO)
  const mockPlanWithOps = {
    id: "plan-1",
    algorithm: "test",
    totalDelay: 0,
    status: "OK",
    planDate: "2025-01-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    author: "test",
    operations: [
      {
        vvnId: "vvn-100",
        vessel: "Op A",
        dock: "DK-1",
        crane: "CR-1",
        startTime: 1,
        endTime: 2,
        loadingDuration: 0,
        unloadingDuration: 0,
        craneCountUsed: 1,
        totalCranesOnDock: 2,
      },
      {
        vvnId: "vvn-100",
        vessel: "Op B",
        dock: "DK-1",
        crane: "CR-1",
        startTime: 2,
        endTime: 3,
        loadingDuration: 0,
        unloadingDuration: 0,
        craneCountUsed: 1,
        totalCranesOnDock: 2,
      },
    ],
  };

  // ✅ Detalhe /api/vve/vve-1 tem de devolver VVE completo
  const vveDetailsBase = {
    ...historyVves[0],
    updatedAt: "2025-01-01T10:10:00Z",
    actualBerthTime: null,
    actualDockId: null,
    auditLog: [],
  };

  // ✅ Executed ops: IDs construídos como no FE (vvnId-idx)
  const executedOpsAllCompletedDetails = {
    ...vveDetailsBase,
    executedOperations: [
      { plannedOperationId: plannedId(vveDetailsBase.vvnId, 0), status: "completed" },
      { plannedOperationId: plannedId(vveDetailsBase.vvnId, 1), status: "completed" },
    ] satisfies ExecutedOperationFromBackend[],
  };

  const executedOpsOneIncompleteDetails = {
    ...vveDetailsBase,
    executedOperations: [
      { plannedOperationId: plannedId(vveDetailsBase.vvnId, 0), status: "completed" },
      { plannedOperationId: plannedId(vveDetailsBase.vvnId, 1), status: "started" },
    ] satisfies ExecutedOperationFromBackend[],
  };

  beforeEach(() => {
    cy.intercept("GET", /\/api\/.*(auth|user|profile).*/i, {
      statusCode: 401,
      body: {},
    }).as("authFail");

    // Histórico
    cy.intercept("GET", /\/api\/vve$/i, {
      statusCode: 200,
      body: historyVves,
    }).as("getHistoryExact");

    // Mantém compatibilidade caso o teu FE use outro path
    cy.intercept("GET", /\/api\/.*(vve|VesselVisitExecution).*$/i, (req) => {
      // Evita que este intercept genérico apanhe /api/vve/vve-1 (detalhe)
      if (/\/api\/vve\/vve-1$/i.test(req.url)) return;
      req.reply({ statusCode: 200, body: historyVves });
    }).as("getHistoryGeneric");

    // Candidates (wizard)
    cy.intercept("GET", /\/api\/.*accepted.*/i, {
      statusCode: 200,
      body: pendingVvns,
    }).as("getCandidates");

    // Docks
    cy.intercept("GET", /\/api\/Dock$/i, {
      statusCode: 200,
      body: mockDocks,
    }).as("getDocks");

    // Vessel resolve IMO -> nome
    cy.intercept("GET", /\/api\/.*imo\/.+$/i, (req) => {
      if (req.url.includes("IMO9999999")) req.reply({ statusCode: 200, body: mockVessel });
      else req.reply({ statusCode: 200, body: mockDefaultVessel });
    }).as("getVessel");

    // VVN by id
    cy.intercept("GET", /\/api\/.*VesselVisitNotification\/id\/vvn-100$/i, {
      statusCode: 200,
      body: { id: "vvn-100", vesselImo: "IMO9999999", code: "VVN-100" },
    }).as("getVvnById");

    // Create VVE (wizard)
    cy.intercept("POST", /\/api\/.*(vve|VesselVisitExecution).*/i, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: "new-vve",
          code: "VVE2025999",
          vvnId: req.body.vvnId,
          actualArrivalTime: req.body.actualArrivalTime,
          status: "IN_PORT",
          creatorEmail: req.body.creatorEmail,
        },
      });
    }).as("createVVE");

    cy.visit(VVE_PATH);

    // ✅ estabiliza a página
    cy.contains(/Atividade do Porto|NO PORTO|IN_PORT/i).should("exist");
  });

  it("deve carregar a página e mostrar histórico de chegadas", () => {
    cy.contains(/Atividade do Porto|Activity/i).should("exist");
    cy.contains("NO PORTO").should("exist");
    cy.contains("MSC GULSUN", { timeout: 10000 }).should("exist");
  });

  it("deve criar registo usando o email padrão do sistema (Wizard)", () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    cy.contains("button", /Registar Nova Chegada/i).click();

    cy.contains("div", "IMO9999999", { timeout: 10000 }).should("be.visible");
    cy.contains("div", "IMO9999999").parents('div[class*="mantine-Paper-root"]').click();
    cy.contains("button", /Próximo/i).click();

    cy.contains(/Hora de Chegada/i).should("be.visible");

    cy.get('input[type="time"]')
      .parents(".mantine-Input-wrapper")
      .parent()
      .find("button")
      .first()
      .click();
    cy.get('button[data-current="true"], button[data-today="true"]').first().click();

    cy.get('input[type="time"]').click().clear().type("00:01");
    cy.contains("button", /Próximo/i).click();

    cy.contains(/Confirmar Registo/i).should("be.visible");
    cy.contains(dateStr).should("exist");
    cy.contains("test@developer.com").should("exist");

    cy.contains("button", /Confirmar Chegada/i).click();

    cy.wait("@createVVE").then((xhr) => {
      expect(xhr.response?.statusCode).to.eq(201);
      expect(xhr.request.body.creatorEmail).to.equal("test@developer.com");
    });

    cy.contains(/sucesso/i).should("exist");
  });

  it("não deve permitir concluir VVE se nem todas as operações estiverem completed", () => {
    // ✅ IMPORTANTE: FE espera ARRAY de planos
    cy.intercept("GET", /\/api\/operation-plans(\?.*)?$/i, {
      statusCode: 200,
      body: [mockPlanWithOps],
    }).as("getPlan");

    // detalhe do VVE (executed ops incompletas)
    cy.intercept("GET", /\/api\/vve\/vve-1$/i, {
      statusCode: 200,
      body: executedOpsOneIncompleteDetails,
    }).as("getExecutedOpsIncomplete");

    // abrir detalhes
    cy.contains("MSC GULSUN", { timeout: 10000 }).click();

    // abrir modal de conclusão
    cy.contains("button", /Complete VVE/i).should("be.enabled").click();

    // ✅ aguarda loadOperations() terminar
    cy.wait("@getPlan");
    cy.wait("@getExecutedOpsIncomplete");

    // ✅ lista de operações aparece
    cy.contains(/Operations/i).should("exist");
    cy.contains("Op A").should("exist");
    cy.contains("Op B").should("exist");

    // preencher campos obrigatórios
    cy.get('input[type="datetime-local"]').eq(0).clear().type("2025-01-01T12:00");
    cy.get('input[type="datetime-local"]').eq(1).clear().type("2025-01-01T13:00");

    // como há 1 op STARTED, o botão tem de continuar desactivado
    cy.contains("button", /Concluir/i).should("be.disabled");
  });

  it("deve permitir concluir VVE quando todas as operações estiverem completed e enviar payload correcto", () => {
    // ✅ IMPORTANTE: FE espera ARRAY de planos
    cy.intercept("GET", /\/api\/operation-plans(\?.*)?$/i, {
      statusCode: 200,
      body: [mockPlanWithOps],
    }).as("getPlan");

    // detalhe do VVE (executed ops todas completas)
    cy.intercept("GET", /\/api\/vve\/vve-1$/i, {
      statusCode: 200,
      body: executedOpsAllCompletedDetails,
    }).as("getExecutedOpsCompleted");

    // endpoint complete (adapta se o teu backend for diferente)
    cy.intercept(
      { method: /POST|PUT|PATCH/, url: /\/api\/.*(vve|VesselVisitExecution).*complete.*/i },
      (req) => {
        req.reply({
          statusCode: 200,
          body: {
            ...vveDetailsBase,
            status: "completed",
            actualUnBerthTime: req.body.actualUnBerthTime,
            actualLeavePortTime: req.body.actualLeavePortTime,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    ).as("completeVVE");

    // abrir detalhes
    cy.contains("MSC GULSUN", { timeout: 10000 }).click();

    // abrir modal de conclusão
    cy.contains("button", /Complete VVE/i).should("be.enabled").click();

    // ✅ aguarda o modal terminar loadOperations() (plano + detalhe)
    cy.wait("@getPlan");
    cy.wait("@getExecutedOpsCompleted");

    // ✅ lista de operações aparece
    cy.contains(/Operations/i).should("exist");
    cy.contains("Op A").should("exist");
    cy.contains("Op B").should("exist");

    // ✅ confirma que a UI já reflecte estados
    cy.contains(/COMPLETED/i).should("exist");

    // preencher campos
    cy.get('input[type="datetime-local"]').eq(0).clear().type("2025-01-01T12:00");
    cy.get('input[type="datetime-local"]').eq(1).clear().type("2025-01-01T13:00");

    // submeter
    cy.contains("button", /Concluir/i).should("be.enabled").click();

    cy.wait("@completeVVE").then((xhr) => {
      expect(xhr.response?.statusCode).to.eq(200);
      expect(xhr.request.body).to.have.property("actualUnBerthTime");
      expect(xhr.request.body).to.have.property("actualLeavePortTime");
      expect(xhr.request.body).to.have.property("updaterEmail");
    });

    // UI reflecte concluído
    cy.contains(/COMPLETED/i).should("exist");
  });

  it("não deve permitir concluir um VVE que já esteja completed", () => {
    // histórico já completed
    cy.intercept("GET", /\/api\/vve$/i, {
      statusCode: 200,
      body: [{ ...historyVves[0], status: "completed" }],
    }).as("getHistoryCompleted");

    cy.visit(VVE_PATH);

    cy.contains("MSC GULSUN", { timeout: 10000 }).click();
    cy.contains("button", /Complete VVE/i).should("be.disabled");
    cy.contains(/COMPLETED/i).should("exist");
  });
});
