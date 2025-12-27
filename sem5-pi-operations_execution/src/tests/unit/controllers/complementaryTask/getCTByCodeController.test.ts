import { describe, it, beforeEach, expect, vi } from "vitest";

import GetCTByCodeController
    from "../../../../controllers/complementaryTask/getCTByCodeController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getByCodeAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetCTByCodeController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { params: {} };

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetCTByCodeController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetCTByCodeController", () => {

    it("returns 400 when code is missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 on success", async () => {

        req.params.code = "CTC001[1]";

        mockService.getByCodeAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ({ code: "CTC001[1]" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.params.code = "CTC001[1]";

        mockService.getByCodeAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Bad", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.params.code = "CTC001[1]";

        mockService.getByCodeAsync.mockRejectedValue(
            new Error("Oops")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});