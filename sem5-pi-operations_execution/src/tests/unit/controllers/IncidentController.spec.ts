import { describe, it, beforeEach, expect, vi } from "vitest";

import CreateITController from "../../../controllers/incidentType/createdITController";
import UpdateITController from "../../../controllers/incidentType/updateITController";
import GetAllITController from "../../../controllers/incidentType/getAllITController";
import GetIncidentTypeDTO from "../../../controllers/incidentType/getITByCodeController";
import GetITByNameController from "../../../controllers/incidentType/getITByNameController";
import GetITRootTypesController from "../../../controllers/incidentType/getITRootController";
import GetITDirectChildController from "../../../controllers/incidentType/getITDirectChildController";
import GetITSubTreeController from "../../../controllers/incidentType/getITSubTreeController";
import RemoveIncidentTypeController from "../../../controllers/incidentType/removeIncidentTypeController";

import { BusinessRuleValidationError } from "../../../core/logic/BusinessRuleValidationError";

// ==========================
// Shared mocks
// ==========================
const mockService = {
    createAsync: vi.fn(),
    updateAsync: vi.fn(),
    removeAsync: vi.fn(),
    getAllAsync: vi.fn(),
    getByCode: vi.fn(),
    getByName: vi.fn(),
    getRootTypes: vi.fn(),
    getDirectChilds: vi.fn(),
    getSubTreeFromParentNode: vi.fn(),
};

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
};

const makeRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
});

describe("IncidentType Controllers", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        vi.clearAllMocks();
        req = { body: {}, params: {}, query: {} };
        res = makeRes();
    });

    // --------------------------
    // CreateITController
    // --------------------------
    describe("CreateITController", () => {
        it("returns 200 on success", async () => {
            const controller = new CreateITController(mockService as any, mockLogger as any);

            req.body = {
                code: "T-INC001",
                name: "Fire",
                description: "Fire related incidents",
                severity: "Major",
                parentCode: null,
            };

            mockService.createAsync.mockResolvedValue({
                getValue: () => ({ id: "1", ...req.body }),
            });

            await controller.execute(req, res);

            expect(mockService.createAsync).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: "1", ...req.body });
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new CreateITController(mockService as any, mockLogger as any);

            mockService.createAsync.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Validation failed", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new CreateITController(mockService as any, mockLogger as any);

            mockService.createAsync.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // UpdateITController
    // --------------------------
    describe("UpdateITController", () => {
        it("returns 200 on success", async () => {
            const controller = new UpdateITController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";
            req.body = {
                name: "Fire Updated",
                description: "Updated desc",
                severity: "Critical",
                parentCode: "T-INC010",
            };

            mockService.updateAsync.mockResolvedValue({
                getValue: () => ({ code: req.params.code, ...req.body }),
            });

            await controller.execute(req, res);

            expect(mockService.updateAsync).toHaveBeenCalledWith("T-INC001", req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ code: "T-INC001", ...req.body });
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new UpdateITController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.updateAsync.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Invalid hierarchy", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new UpdateITController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";
            mockService.updateAsync.mockRejectedValue(new Error("Unexpected"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // GetAllITController
    // --------------------------
    describe("GetAllITController", () => {
        it("returns 200 on success", async () => {
            const controller = new GetAllITController(mockService as any, mockLogger as any);

            mockService.getAllAsync.mockResolvedValue({
                isFailure: false,
                getValue: () => [{ code: "T-INC001" }, { code: "T-INC002" }],
            });

            await controller.execute(req, res);

            expect(mockService.getAllAsync).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "T-INC001" }, { code: "T-INC002" }]);
        });

        it("returns 500 when service Result isFailure", async () => {
            const controller = new GetAllITController(mockService as any, mockLogger as any);

            mockService.getAllAsync.mockResolvedValue({
                isFailure: true,
                errorValue: () => "Service failure",
            });

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new GetAllITController(mockService as any, mockLogger as any);

            mockService.getAllAsync.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // GetIncidentTypeDTO (by code)
    // --------------------------
    describe("GetIncidentTypeDTO", () => {
        it("returns 200 on success", async () => {
            const controller = new GetIncidentTypeDTO(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.getByCode.mockResolvedValue({
                getValue: () => ({ code: "T-INC001", name: "Fire" }),
            });

            await controller.execute(req, res);

            expect(mockService.getByCode).toHaveBeenCalledWith("T-INC001");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ code: "T-INC001", name: "Fire" });
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new GetIncidentTypeDTO(mockService as any, mockLogger as any);

            req.params.code = "T-INC999";

            mockService.getByCode.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Not Found", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new GetIncidentTypeDTO(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";
            mockService.getByCode.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // GetITByNameController
    // --------------------------
    describe("GetITByNameController", () => {
        it("returns 200 on success", async () => {
            const controller = new GetITByNameController(mockService as any, mockLogger as any);

            req.query.name = "fire";

            mockService.getByName.mockResolvedValue({
                getValue: () => [{ code: "T-INC001" }],
            });

            await controller.execute(req, res);

            expect(mockService.getByName).toHaveBeenCalledWith("fire");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "T-INC001" }]);
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new GetITByNameController(mockService as any, mockLogger as any);

            req.query.name = "fire";

            mockService.getByName.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Invalid", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new GetITByNameController(mockService as any, mockLogger as any);

            req.query.name = "fire";
            mockService.getByName.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // GetITRootTypesController
    // --------------------------
    describe("GetITRootTypesController", () => {
        it("returns 200 on success", async () => {
            const controller = new GetITRootTypesController(mockService as any, mockLogger as any);

            mockService.getRootTypes.mockResolvedValue({
                getValue: () => [{ code: "T-INC001", parentCode: null }],
            });

            await controller.execute(req, res);

            expect(mockService.getRootTypes).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "T-INC001", parentCode: null }]);
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new GetITRootTypesController(mockService as any, mockLogger as any);

            mockService.getRootTypes.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Invalid", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new GetITRootTypesController(mockService as any, mockLogger as any);

            mockService.getRootTypes.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // GetITDirectChildController
    // --------------------------
    describe("GetITDirectChildController", () => {
        it("returns 400 if parentCode is missing", async () => {
            const controller = new GetITDirectChildController(mockService as any, mockLogger as any);

            // parentCode undefined everywhere
            req.params = {};
            req.query = {};

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 200 on success using params.code", async () => {
            const controller = new GetITDirectChildController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.getDirectChilds.mockResolvedValue({
                getValue: () => [{ code: "T-INC002", parentCode: "T-INC001" }],
            });

            await controller.execute(req, res);

            expect(mockService.getDirectChilds).toHaveBeenCalledWith("T-INC001");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "T-INC002", parentCode: "T-INC001" }]);
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new GetITDirectChildController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.getDirectChilds.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Not Found", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new GetITDirectChildController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";
            mockService.getDirectChilds.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // GetITSubTreeController
    // --------------------------
    describe("GetITSubTreeController", () => {
        it("returns 400 if parentCode is missing", async () => {
            const controller = new GetITSubTreeController(mockService as any, mockLogger as any);

            req.params = {};
            req.query = {};

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 200 on success using params.code", async () => {
            const controller = new GetITSubTreeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.getSubTreeFromParentNode.mockResolvedValue({
                getValue: () => [
                    { code: "T-INC002", parentCode: "T-INC001" },
                    { code: "T-INC003", parentCode: "T-INC002" },
                ],
            });

            await controller.execute(req, res);

            expect(mockService.getSubTreeFromParentNode).toHaveBeenCalledWith("T-INC001");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                { code: "T-INC002", parentCode: "T-INC001" },
                { code: "T-INC003", parentCode: "T-INC002" },
            ]);
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new GetITSubTreeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.getSubTreeFromParentNode.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Not Found", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new GetITSubTreeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";
            mockService.getSubTreeFromParentNode.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --------------------------
    // RemoveIncidentTypeController
    // --------------------------
    describe("RemoveIncidentTypeController", () => {
        it("returns 204 on success", async () => {
            const controller = new RemoveIncidentTypeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.removeAsync.mockResolvedValue({
                isFailure: false,
            });

            await controller.execute(req, res);

            expect(mockService.removeAsync).toHaveBeenCalledWith("T-INC001");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("returns 400 when service returns Result failure", async () => {
            const controller = new RemoveIncidentTypeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";

            mockService.removeAsync.mockResolvedValue({
                isFailure: true,
                errorValue: () => "Cannot delete with children",
            });

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 400 on BusinessRuleValidationError", async () => {
            const controller = new RemoveIncidentTypeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC999";

            mockService.removeAsync.mockRejectedValue(
                new BusinessRuleValidationError("Rule", "Not Found", "details")
            );

            await controller.execute(req, res);

            expect(mockLogger.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("returns 500 on unexpected error", async () => {
            const controller = new RemoveIncidentTypeController(mockService as any, mockLogger as any);

            req.params.code = "T-INC001";
            mockService.removeAsync.mockRejectedValue(new Error("DB crash"));

            await controller.execute(req, res);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
