import { describe, it, beforeEach, expect, vi } from "vitest";

import GetInRangeCTController
    from "../../../../controllers/complementaryTask/getInRangeCTController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getInRangeAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetInRangeCTController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { query: {} };

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetInRangeCTController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetInRangeCTController", () => {

    it("returns 400 when timeStart or timeEnd missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when invalid dates", async () => {

        req.query.timeStart = "abc";
        req.query.timeEnd = "123";

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 on success", async () => {

        req.query.timeStart = "1000";
        req.query.timeEnd = "2000";

        mockService.getInRangeAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC1" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.query.timeStart = "1000";
        req.query.timeEnd = "2000";

        mockService.getInRangeAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "range error", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.query.timeStart = "1000";
        req.query.timeEnd = "2000";

        mockService.getInRangeAsync.mockRejectedValue(
            new Error("Crash")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});