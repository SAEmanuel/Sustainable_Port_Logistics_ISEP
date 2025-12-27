import { describe, it, beforeEach, expect, vi } from "vitest";
import GetCTByCategoryCodeController from "../../../../controllers/complementaryTask/getCTByCategoryCodeController";
import {BusinessRuleValidationError} from "../../../../core/logic/BusinessRuleValidationError";


const mockService = {
    getByCategoryCodeAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetCTByCategoryCodeController;

beforeEach(() => {
    vi.clearAllMocks();

    req = { query: {} };

    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetCTByCategoryCodeController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetCTByCategoryCodeController", () => {

    it("returns 400 if category param is missing", async () => {

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 200 when service succeeds", async () => {

        req.query.category = "CTC001";

        mockService.getByCategoryCodeAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC001[1]" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ code: "CTC001[1]" }]);
    });


    it("returns 400 when service returns failure", async () => {

        req.query.category = "CTC001";

        mockService.getByCategoryCodeAsync.mockResolvedValue({
            isFailure: true,
            error: "Category invalid"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 400 when BusinessRuleValidationError is thrown", async () => {

        req.query.category = "CTC001";

        mockService.getByCategoryCodeAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Error", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 500 when unexpected error occurs", async () => {

        req.query.category = "CTC001";

        mockService.getByCategoryCodeAsync.mockRejectedValue(
            new Error("Failure DB")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});