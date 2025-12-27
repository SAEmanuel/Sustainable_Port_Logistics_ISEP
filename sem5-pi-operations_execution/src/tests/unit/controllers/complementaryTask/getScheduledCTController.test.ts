import { describe, it, beforeEach, expect, vi } from "vitest";

import GetScheduledCTController
    from "../../../../controllers/complementaryTask/getScheduledCTController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getScheduledAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetScheduledCTController;

beforeEach(() => {
    vi.clearAllMocks();

    req = {};

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetScheduledCTController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetScheduledCTController", () => {

    it("returns 200 on success", async () => {

        mockService.getScheduledAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC1" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when service fails", async () => {

        mockService.getScheduledAsync.mockResolvedValue({
            isFailure: true,
            error: "Service error"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        mockService.getScheduledAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        mockService.getScheduledAsync.mockRejectedValue(
            new Error("Oops")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});