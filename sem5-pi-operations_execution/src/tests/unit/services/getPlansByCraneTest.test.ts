import { describe, it, beforeEach, expect, vi } from "vitest";
import OperationPlanService from "../../../services/operationPlanService";
import { Result } from "../../../core/logic/Result";

// Mocks
const mockRepo = { searchByCraneAndInterval: vi.fn() };
const mockMap = { toDTO: vi.fn() };

let service: OperationPlanService;

const startDate = "2025-01-01";
const endDate = "2025-01-01";

beforeEach(() => {
    vi.clearAllMocks();
    service = new OperationPlanService(mockRepo as any, mockMap as any, mockMap as any);
});

describe("OperationPlanService.getPlansByCraneAsync", () => {

    it("returns an empty array if no plans found", async () => {
        mockRepo.searchByCraneAndInterval.mockResolvedValue([]);

        const result = await service.getPlansByCraneAsync(
            "CR01",
            startDate,
            endDate
        );

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([]);
    });

    it("returns mapped plans when plans are found", async () => {
        const mockPlan = {
            planDate: new Date(),
            operations: [],
            algorithm: "Algo1",
            status: "SAVED"
        };

        const mockDTO = {
            planDate: mockPlan.planDate,
            operations: [],
            algorithm: "Algo1",
            status: "SAVED"
        };

        mockRepo.searchByCraneAndInterval.mockResolvedValue([mockPlan]);
        mockMap.toDTO.mockReturnValue(mockDTO);

        const result = await service.getPlansByCraneAsync(
            "CR01",
            startDate,
            endDate
        );

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toHaveLength(1);
        expect(result.getValue()[0]).toEqual(mockDTO);
    });

    it("returns failure Result when repo throws", async () => {
        mockRepo.searchByCraneAndInterval.mockRejectedValue(
            new Error("Repo error")
        );

        const result = await service.getPlansByCraneAsync(
            "CR01",
            startDate,
            endDate
        );

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("Repo error");
    });

    it("returns failure when startDate or endDate is missing", async () => {
        const result = await service.getPlansByCraneAsync("CR01");

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("startDate and endDate are required");
    });
});
