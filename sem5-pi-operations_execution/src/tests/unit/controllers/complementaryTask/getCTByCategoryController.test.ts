import { describe, it, beforeEach, expect, vi } from "vitest";

import GetCTByCategoryController
    from "../../../../controllers/complementaryTask/getCTByCategoryController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getByCategoryAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetCTByCategoryController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { query: {} };

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetCTByCategoryController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetCTByCategoryController", () => {

    it("returns 400 when category is missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 on success", async () => {

        req.query.category = "CAT123";

        mockService.getByCategoryAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC001[1]" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when service fails", async () => {

        req.query.category = "CAT123";

        mockService.getByCategoryAsync.mockResolvedValue({
            isFailure: true,
            error: "Invalid category"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.query.category = "CAT123";

        mockService.getByCategoryAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Error", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.query.category = "CAT123";

        mockService.getByCategoryAsync.mockRejectedValue(
            new Error("DB down")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});