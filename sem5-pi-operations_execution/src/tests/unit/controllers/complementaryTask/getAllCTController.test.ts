import { describe, it, beforeEach, expect, vi } from "vitest";
import GetAllCTController from "../../../../controllers/complementaryTask/getAllCTController";
import {BusinessRuleValidationError} from "../../../../core/logic/BusinessRuleValidationError";




const mockService = {
    getAllAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetAllCTController;

beforeEach(() => {
    vi.clearAllMocks();

    req = {};
    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetAllCTController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetAllCTController", () => {

    it("returns 200 when service succeeds", async () => {

        mockService.getAllAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC001[1]" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ code: "CTC001[1]" }]);
    });


    it("returns 400 when service returns failure", async () => {

        mockService.getAllAsync.mockResolvedValue({
            isFailure: true,
            error: "Something failed"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 400 when business rule error is thrown", async () => {

        mockService.getAllAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Error", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 500 when unexpected error occurs", async () => {

        mockService.getAllAsync.mockRejectedValue(
            new Error("Database failure")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});