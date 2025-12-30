import { describe, it, beforeEach, expect, vi } from "vitest";
import UpdateVVEActualBerthAndDockController from "../../../controllers/vve/updateVVEActualBerthAndDockController";
import { mockRes } from "../../helpers/mockHttp";

import { VesselVisitExecutionId } from "../../../domain/vesselVisitExecution/vesselVisitExecutionId";

vi.mock("../../../domain/vesselVisitExecution/vesselVisitExecutionId", () => {
    return {
        VesselVisitExecutionId: {
            create: vi.fn()
        }
    };
});

const mockService = {
    updateBerthAndDockAsync: vi.fn()
};

let req: any;
let res: any;
let next: any;
let controller: UpdateVVEActualBerthAndDockController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { params: {}, body: {} };
    res = mockRes();
    next = vi.fn();

    controller = new UpdateVVEActualBerthAndDockController(mockService as any);
});

describe("UpdateVVEActualBerthAndDockController.execute", () => {
    it("returns 200 and body when service succeeds", async () => {
        req.params.id = "vve-123";
        req.body = {
            actualBerthTime: "2025-01-01T10:00:00.000Z",
            actualDockId: "dock-1",
            updaterEmail: "ops@test.com"
        };

        (VesselVisitExecutionId.create as any).mockReturnValue("ID_OBJ");

        mockService.updateBerthAndDockAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ({ ok: true })
        });

        await controller.execute(req, res, next);

        expect(VesselVisitExecutionId.create).toHaveBeenCalledWith("vve-123");

        expect(mockService.updateBerthAndDockAsync).toHaveBeenCalledTimes(1);

        const call = mockService.updateBerthAndDockAsync.mock.calls[0];
        expect(call[0]).toBe("ID_OBJ");
        expect(call[1]).toBeInstanceOf(Date);
        expect(call[1].toISOString()).toBe("2025-01-01T10:00:00.000Z");
        expect(call[2]).toBe("dock-1");
        expect(call[3]).toBe("ops@test.com");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ ok: true });
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 400 when service returns failure", async () => {
        req.params.id = "vve-123";
        req.body = {
            actualBerthTime: "2025-01-01T10:00:00.000Z",
            actualDockId: "dock-1",
            updaterEmail: "ops@test.com"
        };

        (VesselVisitExecutionId.create as any).mockReturnValue("ID_OBJ");

        mockService.updateBerthAndDockAsync.mockResolvedValue({
            isFailure: true,
            errorValue: () => "Validation error"
        });

        await controller.execute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Validation error" });
        expect(next).not.toHaveBeenCalled();
    });

    it("calls next(e) when VesselVisitExecutionId.create throws", async () => {
        req.params.id = "bad-id";
        req.body = {
            actualBerthTime: "2025-01-01T10:00:00.000Z",
            actualDockId: "dock-1",
            updaterEmail: "ops@test.com"
        };

        (VesselVisitExecutionId.create as any).mockImplementation(() => {
            throw new Error("Invalid id");
        });

        await controller.execute(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);

        expect(res.status).not.toHaveBeenCalled();
    });

    it("calls next(e) when service throws", async () => {
        req.params.id = "vve-123";
        req.body = {
            actualBerthTime: "2025-01-01T10:00:00.000Z",
            actualDockId: "dock-1",
            updaterEmail: "ops@test.com"
        };

        (VesselVisitExecutionId.create as any).mockReturnValue("ID_OBJ");

        mockService.updateBerthAndDockAsync.mockRejectedValue(
            new Error("DB crash")
        );

        await controller.execute(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);

        expect(res.status).not.toHaveBeenCalled();
    });
});
