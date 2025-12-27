import { describe, it, beforeEach, expect, vi } from "vitest";

import GetCTByVveController
    from "../../../../controllers/complementaryTask/getCTByVveController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

const mockService = {
    getByVveAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetCTByVveController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { query: {} };

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetCTByVveController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetCTByVveController", () => {

    it("returns 400 when vve missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 on success", async () => {

        req.query.vve = "VVE1";

        mockService.getByVveAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ({ code: "CTC001[1]" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when service fails", async () => {

        req.query.vve = "VVE1";

        mockService.getByVveAsync.mockResolvedValue({
            isFailure: true,
            error: "Invalid"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.query.vve = "VVE1";

        mockService.getByVveAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Err", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.query.vve = "VVE1";

        mockService.getByVveAsync.mockRejectedValue(
            new Error("Boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});