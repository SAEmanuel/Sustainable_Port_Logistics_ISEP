import { describe, it, beforeEach, expect, vi } from "vitest";
import GetCTCByCategoryController
    from "../../../../controllers/complementaryTaskCategory/getCTCByCategoryController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { getByCategoryAsync: vi.fn() };
const mockLogger = { error: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = { query: {} };
    res = mockRes();

    controller = new GetCTCByCategoryController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetCTCByCategoryController", () => {

    it("returns 200 on success", async () => {

        req.query.category = "Maintenance";

        mockService.getByCategoryAsync.mockResolvedValue({
            getValue: () => [{ category: "Maintenance" }]
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.query.category = "Maintenance";

        mockService.getByCategoryAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.query.category = "Maintenance";

        mockService.getByCategoryAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});