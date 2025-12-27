import { describe, it, beforeEach, expect, vi } from "vitest";

import GetCTByStaffController
    from "../../../../controllers/complementaryTask/getCTByStaffController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getByStaffAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetCTByStaffController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { query: {} };

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetCTByStaffController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetCTByStaffController", () => {

    it("returns 400 when staff param missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 on success", async () => {

        req.query.staff = "John";

        mockService.getByStaffAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC001[1]" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when service fails", async () => {

        req.query.staff = "John";

        mockService.getByStaffAsync.mockResolvedValue({
            isFailure: true,
            error: "Invalid"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.query.staff = "John";

        mockService.getByStaffAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Error", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.query.staff = "John";

        mockService.getByStaffAsync.mockRejectedValue(
            new Error("Crash")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});