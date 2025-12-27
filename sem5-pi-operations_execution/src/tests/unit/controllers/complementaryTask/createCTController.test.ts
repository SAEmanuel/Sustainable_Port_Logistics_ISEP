import { describe, it, beforeEach, expect, vi } from "vitest";
import CreateCTController from "../../../../controllers/complementaryTask/createCTController";
import {BusinessRuleValidationError} from "../../../../core/logic/BusinessRuleValidationError";


// ==========================
// MOCKS
// ==========================

const mockService = {
    createAsync: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

let mockReq: any;
let mockRes: any;

let controller: CreateCTController;

beforeEach(() => {
    vi.clearAllMocks();

    mockReq = { body: {} };

    mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };

    controller = new CreateCTController(
        mockService as any,
        mockLogger as any
    );
});

// ==========================
// TESTS
// ==========================

describe("CreateCTController", () => {

    it("should return 200 when task is created successfully", async () => {

        mockReq.body = {
            category: "CAT123",
            staff: "John",
            timeStart: new Date(),
            vve: "VVE123"
        };

        mockService.createAsync.mockResolvedValue({
            getValue: () => ({ code: "CTC001[1]" })
        });

        await controller.execute(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ code: "CTC001[1]" });
    });


    it("should return 400 when BusinessRuleValidationError is thrown", async () => {

        mockService.createAsync.mockRejectedValue(
            new BusinessRuleValidationError(
                "Rule",
                "Validation failed",
                "details"
            )
        );

        await controller.execute(mockReq, mockRes);

        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });


    it("should return 500 on unexpected error", async () => {

        mockService.createAsync.mockRejectedValue(
            new Error("Unexpected DB error")
        );

        await controller.execute(mockReq, mockRes);

        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

});