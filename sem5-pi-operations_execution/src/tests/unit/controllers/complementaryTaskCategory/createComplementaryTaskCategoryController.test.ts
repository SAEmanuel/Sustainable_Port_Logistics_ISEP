import { describe, it, beforeEach, expect, vi } from "vitest";
import CreateComplementaryTaskCategoryController
    from "../../../../controllers/complementaryTaskCategory/createComplementaryTaskCategoryController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { createAsync: vi.fn() };
const mockLogger = { warn: vi.fn(), error: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {} };
    res = mockRes();

    controller = new CreateComplementaryTaskCategoryController(
        mockService as any,
        mockLogger as any
    );
});

describe("CreateComplementaryTaskCategoryController", () => {

    it("returns 200 on success", async () => {

        mockService.createAsync.mockResolvedValue({
            getValue: () => ({ code: "CTC01" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        mockService.createAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        mockService.createAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});