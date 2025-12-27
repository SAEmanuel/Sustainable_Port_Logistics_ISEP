import { describe, it, beforeEach, expect, vi } from "vitest";
import GetAllComplementaryTaskCategoryController
    from "../../../../controllers/complementaryTaskCategory/getAllComplementaryTaskCategoryController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { getAllAsync: vi.fn() };
const mockLogger = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = mockRes();

    controller = new GetAllComplementaryTaskCategoryController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetAllComplementaryTaskCategoryController", () => {

    it("returns 200 on success", async () => {

        mockService.getAllAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC01" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 when service result is failure", async () => {

        mockService.getAllAsync.mockResolvedValue({
            isFailure: true,
            error: "Failed"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        mockService.getAllAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        mockService.getAllAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});