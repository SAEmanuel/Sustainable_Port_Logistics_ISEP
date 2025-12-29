import { describe, it, expect, beforeEach } from "vitest";

import { createItTestContext } from "./_itTestContext";

import IncidentTypeService from "../../../services/incidentTypeService";

// Controllers (ajusta paths/names se necessário)
import CreateITController from "../../../controllers/incidentType/createdITController";
import UpdateITController from "../../../controllers/incidentType/updateITController";
import GetAllITController from "../../../controllers/incidentType/getAllITController";
import GetIncidentTypeDTO from "../../../controllers/incidentType/getITByCodeController";
import GetITByNameController from "../../../controllers/incidentType/getITByNameController";
import GetITRootTypesController from "../../../controllers/incidentType/getITRootController";
import GetITDirectChildController from "../../../controllers/incidentType/getITDirectChildController";
import GetITSubTreeController from "../../../controllers/incidentType/getITSubTreeController";
import RemoveIncidentTypeController from "../../../controllers/incidentType/removeIncidentTypeController";

// Para construir objetos domínio reais nos testes de update/children/etc.
import { IncidentType } from "../../../domain/incidentTypes/incidentType";
import { Severity } from "../../../domain/incidentTypes/severity";

function makeDomainIT(code = "T-INC001", parent: string | null = null) {
    return IncidentType.creat({
        code,
        name: `Name ${code}`,
        description: `Desc ${code}`,
        severity: Severity.Minor,
        parent,
        createdAt: new Date(),
        updatedAt: null,
    });
}

describe("IncidentType | Controller + Service (functional style)", () => {
    beforeEach(() => {
        // cada teste cria o seu próprio context, mas deixo isto por consistência
    });

    // -------------------------
    // CREATE
    // -------------------------
    it("CREATE -> should create an IncidentType (HTTP 200)", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, CreateITController);

        repoMock.findByCode.mockResolvedValue(null);     // não existe ainda
        repoMock.save.mockResolvedValue(makeDomainIT("T-INC001"));
        mapperMock.toDTO.mockReturnValue({
            code: "T-INC001",
            name: "Fire",
            description: "Fire related",
            severity: "Major",
            parentCode: null,
        });

        const req = {
            body: {
                code: "T-INC001",
                name: "Fire",
                description: "Fire related",
                severity: "Major",
                parentCode: null,
            },
        };

        const res = mockRes();
        await controller.execute(req as any, res as any);

        expect(repoMock.findByCode).toHaveBeenCalledWith("T-INC001");
        expect(repoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            code: "T-INC001",
            name: "Fire",
            description: "Fire related",
            severity: "Major",
            parentCode: null,
        });
    });

    it("CREATE -> should return 400 if parentCode does not exist", async () => {
        const { repoMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, CreateITController);

        // 1) check if code exists
        repoMock.findByCode.mockResolvedValueOnce(null);
        // 2) validate parent exists
        repoMock.findByCode.mockResolvedValueOnce(null); // parent not found

        const req = {
            body: {
                code: "T-INC001",
                name: "Child",
                description: "Child desc",
                severity: "Minor",
                parentCode: "T-INC010",
            },
        };

        const res = mockRes();
        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // -------------------------
    // UPDATE
    // -------------------------
    it("UPDATE -> should update an IncidentType (HTTP 200)", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, UpdateITController);

        const existing = makeDomainIT("T-INC001", null);

        repoMock.findByCode.mockResolvedValue(existing);
        repoMock.save.mockResolvedValue(existing);

        mapperMock.toDTO.mockReturnValue({
            code: "T-INC001",
            name: "Updated",
            description: "Updated desc",
            severity: "Critical",
            parentCode: null,
        });

        const req = {
            params: { code: "T-INC001" },
            body: {
                name: "Updated",
                description: "Updated desc",
                severity: "Critical",
                parentCode: null,
            },
        };

        const res = mockRes();
        await controller.execute(req as any, res as any);

        expect(repoMock.findByCode).toHaveBeenCalledWith("T-INC001");
        expect(repoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            code: "T-INC001",
            name: "Updated",
            description: "Updated desc",
            severity: "Critical",
            parentCode: null,
        });
    });

    it("UPDATE -> should return 400 when cycle detected (parent is a descendant)", async () => {
        const { repoMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, UpdateITController);

        const existing = makeDomainIT("T-INC001", null);
        const parentCandidate = makeDomainIT("T-INC002", "T-INC001"); // candidato a pai

        repoMock.findByCode.mockResolvedValueOnce(existing); // find current
        repoMock.findByCode.mockResolvedValueOnce(parentCandidate); // find parent candidate exists
        repoMock.getSubTreeFromParentNode.mockResolvedValue([
            makeDomainIT("T-INC002", "T-INC001"), // descendant list contains T-INC002
        ]);

        const req = {
            params: { code: "T-INC001" },
            body: {
                name: "Updated",
                description: "Updated desc",
                severity: "Major",
                parentCode: "T-INC002", // tenta definir como pai um descendente
            },
        };

        const res = mockRes();
        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // -------------------------
    // GET ALL
    // -------------------------
    it("GET ALL -> should return 200 with list", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetAllITController);

        const a = makeDomainIT("T-INC001", null);
        const b = makeDomainIT("T-INC002", null);

        repoMock.getAllAsyn.mockResolvedValue([a, b]);

        mapperMock.toDTO.mockImplementation((it: any) => ({
            code: it.code,
            name: it.name,
            description: it.description,
            severity: it.severity,
            parentCode: it.parentCode ?? null,
        }));

        const req = {};
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({ code: "T-INC001" }),
            expect.objectContaining({ code: "T-INC002" }),
        ]);
    });

    // -------------------------
    // GET BY CODE
    // -------------------------
    it("GET BY CODE -> should return 200", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetIncidentTypeDTO);

        repoMock.findByCode.mockResolvedValue(makeDomainIT("T-INC001", null));
        mapperMock.toDTO.mockReturnValue({ code: "T-INC001" });

        const req = { params: { code: "T-INC001" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findByCode).toHaveBeenCalledWith("T-INC001");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ code: "T-INC001" });
    });

    it("GET BY CODE -> should return 400 if not found", async () => {
        const { repoMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetIncidentTypeDTO);

        repoMock.findByCode.mockResolvedValue(null);

        const req = { params: { code: "T-INC999" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // -------------------------
    // GET BY NAME
    // -------------------------
    it("GET BY NAME -> should return 200", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetITByNameController);

        repoMock.findByName.mockResolvedValue([makeDomainIT("T-INC001", null)]);
        mapperMock.toDTO.mockReturnValue({ code: "T-INC001" });

        const req = { query: { name: "fire" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findByName).toHaveBeenCalledWith("fire");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ code: "T-INC001" }]);
    });

    // -------------------------
    // ROOT TYPES
    // -------------------------
    it("ROOTS -> should return 200", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetITRootTypesController);

        repoMock.getRootTypes.mockResolvedValue([makeDomainIT("T-INC001", null)]);
        mapperMock.toDTO.mockReturnValue({ code: "T-INC001", parentCode: null });

        const req = {};
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.getRootTypes).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ code: "T-INC001", parentCode: null }]);
    });

    // -------------------------
    // DIRECT CHILDREN
    // -------------------------
    it("CHILDREN -> should return 200 (requires parent exists)", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetITDirectChildController);

        // service valida se parent existe
        repoMock.findByCode.mockResolvedValue(makeDomainIT("T-INC001", null));
        repoMock.getDirectChilds.mockResolvedValue([makeDomainIT("T-INC002", "T-INC001")]);

        mapperMock.toDTO.mockImplementation((it: any) => ({ code: it.code, parentCode: it.parentCode }));

        const req = { params: { code: "T-INC001" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findByCode).toHaveBeenCalledWith("T-INC001");
        expect(repoMock.getDirectChilds).toHaveBeenCalledWith("T-INC001");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ code: "T-INC002", parentCode: "T-INC001" }]);
    });

    // -------------------------
    // SUBTREE
    // -------------------------
    it("SUBTREE -> should return 200 (requires parent exists)", async () => {
        const { repoMock, mapperMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, GetITSubTreeController);

        repoMock.findByCode.mockResolvedValue(makeDomainIT("T-INC001", null));
        repoMock.getSubTreeFromParentNode.mockResolvedValue([
            makeDomainIT("T-INC002", "T-INC001"),
            makeDomainIT("T-INC003", "T-INC002"),
        ]);

        mapperMock.toDTO.mockImplementation((it: any) => ({ code: it.code, parentCode: it.parentCode }));

        const req = { params: { code: "T-INC001" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.getSubTreeFromParentNode).toHaveBeenCalledWith("T-INC001");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { code: "T-INC002", parentCode: "T-INC001" },
            { code: "T-INC003", parentCode: "T-INC002" },
        ]);
    });

    // -------------------------
    // REMOVE
    // -------------------------
    it("REMOVE -> should return 204 when deleted", async () => {
        const { repoMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, RemoveIncidentTypeController);

        repoMock.getDirectChilds.mockResolvedValue([]); // sem filhos
        repoMock.removeType.mockResolvedValue(1);       // apagou 1

        const req = { params: { code: "T-INC001" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.getDirectChilds).toHaveBeenCalledWith("T-INC001");
        expect(repoMock.removeType).toHaveBeenCalledWith("T-INC001");
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it("REMOVE -> should return 400 if has children (Result.fail)", async () => {
        const { repoMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, RemoveIncidentTypeController);

        repoMock.getDirectChilds.mockResolvedValue([makeDomainIT("T-INC002", "T-INC001")]);

        const req = { params: { code: "T-INC001" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("REMOVE -> should return 400 if not found (deletedCount=0 -> throws)", async () => {
        const { repoMock, controller, mockRes } =
            createItTestContext(IncidentTypeService, RemoveIncidentTypeController);

        repoMock.getDirectChilds.mockResolvedValue([]);
        repoMock.removeType.mockResolvedValue(0); // não apagou nada -> NotFound

        const req = { params: { code: "T-INC999" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
