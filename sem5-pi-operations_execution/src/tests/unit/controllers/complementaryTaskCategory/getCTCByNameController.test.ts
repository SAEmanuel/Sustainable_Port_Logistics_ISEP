import { describe, it, beforeEach, expect, vi } from "vitest";
import GetCTCByNameController
    from "../../../../controllers/complementaryTaskCategory/getCTCByNameController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { getByNameAsync: vi.fn() };
const mockLogger = { warn: vi.fn(), error: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = { query: {} };
    res = mockRes();

    controller = new GetCTCByNameController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetCTCByNameController", () => {

    it("returns 200 on success", async () => {

        req.query.name = "Security";

        mockService.getByNameAsync.mockResolvedValue({
            getValue: () => ({ name: "Security" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.query.name = "Security";

        mockService.getByNameAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.query.name = "Security";

        mockService.getByNameAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});