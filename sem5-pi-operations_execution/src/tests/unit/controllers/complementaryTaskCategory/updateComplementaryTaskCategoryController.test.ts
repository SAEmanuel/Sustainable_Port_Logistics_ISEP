import { describe, it, beforeEach, expect, vi } from "vitest";
import UpdateComplementaryTaskCategoryController
    from "../../../../controllers/complementaryTaskCategory/updateComplementaryTaskCategoryController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { updateAsync: vi.fn() };
const mockLogger = { warn: vi.fn(), error: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = { params: {}, body: {} };
    res = mockRes();

    controller = new UpdateComplementaryTaskCategoryController(
        mockService as any,
        mockLogger as any
    );
});

describe("UpdateComplementaryTaskCategoryController", () => {

    it("returns 200 on success", async () => {

        req.params.code = "CTC01";

        mockService.updateAsync.mockResolvedValue({
            getValue: () => ({ code: "CTC01" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.params.code = "CTC01";

        mockService.updateAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.params.code = "CTC01";

        mockService.updateAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});