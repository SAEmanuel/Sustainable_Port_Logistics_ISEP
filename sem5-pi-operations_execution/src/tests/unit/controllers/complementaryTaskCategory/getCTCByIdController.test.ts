import { describe, it, beforeEach, expect, vi } from "vitest";
import GetCTCByIdController
    from "../../../../controllers/complementaryTaskCategory/getCTCByIdController";

import { BusinessRuleValidationError }
    from "../../../../core/logic/BusinessRuleValidationError";

import { mockRes } from "../../../helpers/mockHttp";

const mockService = { getByIdAsync: vi.fn() };
const mockLogger = { error: vi.fn() };

let req: any;
let res: any;
let controller: any;

beforeEach(() => {
    vi.clearAllMocks();
    req = { params: {} };
    res = mockRes();

    controller = new GetCTCByIdController(
        mockService as any,
        mockLogger as any
    );
});

describe("GetCTCByIdController", () => {

    it("returns 400 when id missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 on success", async () => {

        req.params.id = "ID1";

        mockService.getByIdAsync.mockResolvedValue({
            getValue: () => ({ id: "ID1" })
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 on BusinessRuleValidationError", async () => {

        req.params.id = "ID1";

        mockService.getByIdAsync.mockRejectedValue(
            new BusinessRuleValidationError("rule", "fail", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 on unexpected error", async () => {

        req.params.id = "ID1";

        mockService.getByIdAsync.mockRejectedValue(
            new Error("boom")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});