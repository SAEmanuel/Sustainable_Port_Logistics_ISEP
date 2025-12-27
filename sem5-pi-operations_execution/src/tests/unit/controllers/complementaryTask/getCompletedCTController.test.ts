import { describe, it, beforeEach, expect, vi } from "vitest";
import GetCompletedCTController from "../../../../controllers/complementaryTask/getCompletedCTController";
import {BusinessRuleValidationError} from "../../../../core/logic/BusinessRuleValidationError";


const mockService = {
    getCompletedAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let req: any;
let res: any;
let controller: GetCompletedCTController;

beforeEach(() => {
    vi.clearAllMocks();

    req = {};
    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new GetCompletedCTController(
        mockService as any,
        mockLogger as any
    );
});


describe("GetCompletedCTController", () => {

    it("returns 200 when service succeeds", async () => {

        mockService.getCompletedAsync.mockResolvedValue({
            isFailure: false,
            getValue: () => ([{ code: "CTC001[1]" }])
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ code: "CTC001[1]" }]);
    });


    it("returns 400 when service returns failure", async () => {

        mockService.getCompletedAsync.mockResolvedValue({
            isFailure: true,
            error: "Service error"
        });

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 400 when BusinessRuleValidationError is thrown", async () => {

        mockService.getCompletedAsync.mockRejectedValue(
            new BusinessRuleValidationError("Rule", "Error", "details")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });


    it("returns 500 when unexpected error occurs", async () => {

        mockService.getCompletedAsync.mockRejectedValue(
            new Error("Unexpected failure")
        );

        await controller.execute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});