import { describe, it, beforeEach, expect, vi } from "vitest";

import GetInProgressCTController
    from "../../../../controllers/complementaryTask/getInProgressCTController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getInProgressAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetInProgressCTController;

beforeEach(() => {
    vi.clearAllMocks();

    req = {};
    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetInProgressCTController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetInProgressCTController", () => {

    it("returns 200 on success", async () => {

        mockService.getInProgressAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC1" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when service fails", async () => {

        mockService.getInProgressAsync.mockResolvedValue({
            isFailure: true,
            error: "Service failed"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        mockService.getInProgressAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        mockService.getInProgressAsync.mockRejectedValue(
            new Error("Crash")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});