// import { describe, it, expect, beforeEach, vi } from "vitest";
// import { createVveTestContext } from "./_vveTestContext";
// import { UniqueEntityID } from "../../../core/domain/UniqueEntityID";
//
// // Service
// import VesselVisitExecutionService from "../../../services/vesselVisitExecutionService";
//
// // Controllers
// import CreateVVEController from "../../../controllers/vve/createVVEController";
// import GetAllVVEController from "../../../controllers/vve/getAllVVEController";
// import GetVVEByCodeController from "../../../controllers/vve/getVVEByCodeController";
// import GetVVEByIdController from "../../../controllers/vve/getVVEByIdController";
// import GetVVEByImoController from "../../../controllers/vve/getVVEByImoController";
// import GetVVEInRangeController from "../../../controllers/vve/getVVEInRangeController";
//
// // DOMÍNIO REAL (Importante!)
// import { VesselVisitExecution } from "../../../domain/vesselVisitExecution/vesselVisitExecution";
// import { VesselVisitExecutionCode } from "../../../domain/vesselVisitExecution/vesselVisitExecutionCode";
//
// // --- HELPER DE DOMÍNIO ---
// // Cria um VVE válido respeitando as tuas regras de negócio (Regex do Código, Datas, etc)
// function makeDomainVVE(codeStr = "VVE2025000001", imo = "IMO9999999") {
//
//     // 1. Criar o Value Object do Código (vai validar o Regex)
//     const codeOrError = VesselVisitExecutionCode.create(codeStr);
//
//     // 2. Criar o Agregado
//     const vve = VesselVisitExecution.create({
//         code: codeOrError, // Passamos o VO real
//         vvnId: "vvn-123",
//         vesselImo: imo,
//         actualArrivalTime: new Date("2025-01-01T10:00:00Z"),
//         creatorEmail: "user@test.com",
//         status: "In Progress" // O create força "In Progress", mas passamos explicito
//     }, new UniqueEntityID("vve-id-123"));
//
//     return vve;
// }
//
// describe("VVE | Controller + Service (Functional Tests)", () => {
//
//     beforeEach(() => {
//         vi.clearAllMocks();
//     });
//
//     // -------------------------
//     // CREATE
//     // -------------------------
//     it("CREATE -> should create a VVE (HTTP 200)", async () => {
//         const { repoMock, mapperMock, controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, CreateVVEController);
//
//         // O repo vai retornar um objeto de domínio válido quando salvar
//         const createdVVE = makeDomainVVE("VVE2025000001");
//         repoMock.save.mockResolvedValue(createdVVE);
//
//         // O mapper converte esse domínio para DTO
//         mapperMock.toDTO.mockReturnValue({
//             id: "vve-id-123",
//             code: "VVE2025000001",
//             vvnId: "vvn-123",
//             status: "In Progress",
//             creatorEmail: "user@test.com"
//         });
//
//         // Request (input do utilizador)
//         const req = {
//             body: {
//                 vvnId: "vvn-123",
//                 actualArrivalTime: "2025-01-01T10:00:00Z",
//                 creatorEmail: "user@test.com"
//             },
//             currentUser: { email: "user@test.com" }
//         };
//
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         await controller["executeImpl"]();
//
//         expect(repoMock.save).toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
//             code: "VVE2025000001",
//             status: "In Progress"
//         }));
//     });
//
//     // -------------------------
//     // GET ALL
//     // -------------------------
//     it("GET ALL -> should return list of VVEs (HTTP 200)", async () => {
//         const { repoMock, mapperMock, controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, GetAllVVEController);
//
//         const vve1 = makeDomainVVE("VVE2025000001");
//         const vve2 = makeDomainVVE("VVE2025000002");
//
//         repoMock.findAll.mockResolvedValue([vve1, vve2]);
//
//         // Mock das chamadas sequenciais do mapper
//         mapperMock.toDTO
//             .mockReturnValueOnce({ code: "VVE2025000001" })
//             .mockReturnValueOnce({ code: "VVE2025000002" });
//
//         const req = {};
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         await controller["executeImpl"]();
//
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalledWith([
//             { code: "VVE2025000001" },
//             { code: "VVE2025000002" }
//         ]);
//     });
//
//     // -------------------------
//     // GET BY CODE
//     // -------------------------
//     it("GET BY CODE -> should return VVE if code format is valid and exists (HTTP 200)", async () => {
//         const { repoMock, mapperMock, controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, GetVVEByCodeController);
//
//         const validCode = "VVE2025000001";
//         const vve = makeDomainVVE(validCode);
//
//         // O Service vai chamar VesselVisitExecutionCode.create(validCode) internamente.
//         // O Mock do Repo deve retornar o objeto.
//         repoMock.findByCode.mockResolvedValue(vve);
//         mapperMock.toDTO.mockReturnValue({ code: validCode });
//
//         const req = { params: { code: validCode } };
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         await controller["executeImpl"]();
//
//         expect(repoMock.findByCode).toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalledWith({ code: validCode });
//     });
//
//     it("GET BY CODE -> should return 400 if code format is invalid (Domain Validation)", async () => {
//         const { controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, GetVVEByCodeController);
//
//         // Passamos um código que falha no regex /^VVE\d{4}\d{6}$/
//         const invalidCode = "BAD-CODE";
//
//         const req = { params: { code: invalidCode } };
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         // O Controller chama o Service -> Service chama VesselVisitExecutionCode.create -> Lança BusinessRuleValidationError
//         // O Controller apanha o erro e devolve 400.
//         await controller["executeImpl"]();
//
//         expect(res.status).toHaveBeenCalledWith(400); // Erro de validação de domínio
//     });
//
//     // -------------------------
//     // GET BY ID
//     // -------------------------
//     it("GET BY ID -> should return VVE (HTTP 200)", async () => {
//         const { repoMock, mapperMock, controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, GetVVEByIdController);
//
//         const vve = makeDomainVVE();
//         repoMock.findById.mockResolvedValue(vve);
//         mapperMock.toDTO.mockReturnValue({ id: "vve-id-123" });
//
//         const req = { params: { id: "vve-id-123" } };
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         await controller["executeImpl"]();
//
//         expect(repoMock.findById).toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(200);
//     });
//
//     // -------------------------
//     // GET BY IMO
//     // -------------------------
//     it("GET BY IMO -> should return list of VVEs (HTTP 200)", async () => {
//         const { repoMock, mapperMock, controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, GetVVEByImoController);
//
//         const vve = makeDomainVVE("VVE2025000001", "IMO9999999");
//         repoMock.findByImo.mockResolvedValue([vve]);
//
//         mapperMock.toDTO.mockReturnValue({ code: "VVE2025000001", imo: "IMO9999999" });
//
//         const req = { params: { imo: "IMO9999999" } };
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         await controller["executeImpl"]();
//
//         expect(repoMock.findByImo).toHaveBeenCalledWith("IMO9999999");
//         expect(res.status).toHaveBeenCalledWith(200);
//     });
//
//     // -------------------------
//     // GET IN RANGE
//     // -------------------------
//     it("GET IN RANGE -> should return VVEs in date range (HTTP 200)", async () => {
//         const { repoMock, mapperMock, controller, mockRes } =
//             createVveTestContext(VesselVisitExecutionService, GetVVEInRangeController);
//
//         const vve = makeDomainVVE();
//         repoMock.findInRange.mockResolvedValue([vve]);
//         mapperMock.toDTO.mockReturnValue({ code: "VVE2025000001" });
//
//         // Timestamps válidos
//         const start = new Date("2024-01-01").getTime().toString();
//         const end = new Date("2024-01-02").getTime().toString();
//
//         const req = { query: { timeStart: start, timeEnd: end } };
//         const res = mockRes();
//         (controller as any).req = req;
//         (controller as any).res = res;
//
//         await controller["executeImpl"]();
//
//         expect(repoMock.findInRange).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
//         expect(res.status).toHaveBeenCalledWith(200);
//     });
// });