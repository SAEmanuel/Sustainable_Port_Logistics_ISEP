import { describe, it, beforeEach, expect, vi } from "vitest";
import DeactivateComplementaryTaskCategoryController
    from "../../../../controllers/complementaryTaskCategory/deactivateComplementaryTaskCategoryController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { deactivateAsync: vi.fn() };
const mockLogger = { warn: vi.fn(), error: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = { params: {} };
    res = mockRes();

    controller = new DeactivateComplementaryTaskCategoryController(
        mockService as any,
        mockLogger as any
    );
});

describe("DeactivateComplementaryTaskCategoryController", () => {

    it("returns 200 on success", async () => {

        req.params.code = "CTC01";

        mockService.deactivateAsync.mockResolvedValue({
            getValue: () => ({ code: "CTC01" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.params.code = "CTC01";

        mockService.deactivateAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.params.code = "CTC01";

        mockService.deactivateAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});