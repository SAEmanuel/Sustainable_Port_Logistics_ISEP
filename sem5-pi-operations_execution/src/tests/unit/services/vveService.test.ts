import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import VesselVisitExecutionService from "../../../services/vesselVisitExecutionService";
import { BusinessRuleValidationError } from "../../../core/logic/BusinessRuleValidationError";
import { VesselVisitExecutionCode } from "../../../domain/vesselVisitExecution/vesselVisitExecutionCode";

describe("VesselVisitExecutionService", () => {
    const mockRepo = {
        findByVvnId: vi.fn(),
        save: vi.fn(),
        getNextSequenceNumber: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        findByCode: vi.fn(),
        findByImo: vi.fn(),
        getAllInDateRange: vi.fn()
    };

    const mockVvnService = {
        fetchById: vi.fn()
    };

    const mockLogger = {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    };

    const mockMap = {
        toDTO: vi.fn()
    };

    let service: VesselVisitExecutionService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new VesselVisitExecutionService(
            mockRepo as any,
            mockVvnService as any,
            mockLogger as any,
            mockMap as any
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // helpers
    const dto = {
        vvnId: "VVN-123",
        actualArrivalTime: "2025-01-01T10:00:00.000Z",
        creatorEmail: "creator@test.com"
    } as any;

    it("createAsync should create VVE when VVN exists and no duplicate", async () => {
        // fixa ano/seq para validar código gerado
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));

        mockVvnService.fetchById.mockResolvedValue({ vesselImo: "IMO1234567" });
        mockRepo.findByVvnId.mockResolvedValue(null);
        mockRepo.getNextSequenceNumber.mockResolvedValue(1);

        const savedVve = { id: { toString: () => "ID1" } };
        mockRepo.save.mockResolvedValue(savedVve);

        mockMap.toDTO.mockReturnValue({ id: "ID1", code: "VVE2025000001" });

        const result = await service.createAsync(dto);

        expect(mockVvnService.fetchById).toHaveBeenCalledWith("VVN-123");
        expect(mockRepo.findByVvnId).toHaveBeenCalledWith("VVN-123");
        expect(mockRepo.getNextSequenceNumber).toHaveBeenCalled();

        // garante que o save foi chamado com um VVE cujo code bate no formato gerado
        const savedArg = mockRepo.save.mock.calls[0][0];
        expect(savedArg.code).toBeInstanceOf(VesselVisitExecutionCode);
        expect(savedArg.code.value).toBe("VVE2025000001");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "ID1", code: "VVE2025000001" });
    });

    it("createAsync should throw when external VVN not found", async () => {
        mockVvnService.fetchById.mockResolvedValue(null);

        await expect(service.createAsync(dto)).rejects.toBeInstanceOf(
            BusinessRuleValidationError
        );
    });

    it("createAsync should throw when VVE already exists for vvnId", async () => {
        mockVvnService.fetchById.mockResolvedValue({ vesselImo: "IMO1234567" });
        mockRepo.findByVvnId.mockResolvedValue({ any: "existing" });

        await expect(service.createAsync(dto)).rejects.toBeInstanceOf(
            BusinessRuleValidationError
        );
    });

    it("getAllAsync should return ok with mapped DTOs", async () => {
        mockRepo.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        mockMap.toDTO.mockReturnValueOnce({ id: 1 }).mockReturnValueOnce({ id: 2 });

        const result = await service.getAllAsync();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("getAllAsync should return fail when repo throws", async () => {
        mockRepo.findAll.mockRejectedValue(new Error("DB down"));

        const result = await service.getAllAsync();

        expect(result.isFailure).toBe(true);
    });

    it("getByIdAsync should throw when VVE not found", async () => {
        mockRepo.findById.mockResolvedValue(null);

        const id = { toString: () => "ID1" } as any;

        await expect(service.getByIdAsync(id)).rejects.toBeInstanceOf(
            BusinessRuleValidationError
        );
    });

    it("getByIdAsync should return ok when found", async () => {
        mockRepo.findById.mockResolvedValue({ id: "domain" });
        mockMap.toDTO.mockReturnValue({ id: "dto" });

        const id = { toString: () => "ID1" } as any;

        const result = await service.getByIdAsync(id);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "dto" });
    });

    it("getByCodeAsync should throw when VVE not found", async () => {
        mockRepo.findByCode.mockResolvedValue(null);
        const code = VesselVisitExecutionCode.create("VVE2025000001");

        await expect(service.getByCodeAsync(code)).rejects.toBeInstanceOf(
            BusinessRuleValidationError
        );
    });

    it("getInRangeAsync should throw when start >= end", async () => {
        const start = new Date("2025-01-02T00:00:00.000Z");
        const end = new Date("2025-01-01T00:00:00.000Z");

        await expect(service.getInRangeAsync(start, end)).rejects.toBeInstanceOf(
            BusinessRuleValidationError
        );
    });

    it("getInRangeAsync should return ok when range valid", async () => {
        const start = new Date("2025-01-01T00:00:00.000Z");
        const end = new Date("2025-01-02T00:00:00.000Z");

        mockRepo.getAllInDateRange.mockResolvedValue([{ id: 1 }]);
        mockMap.toDTO.mockReturnValue({ id: 1 });

        const result = await service.getInRangeAsync(start, end);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: 1 }]);
    });

    it("updateBerthAndDockAsync should throw when VVE not found", async () => {
        mockRepo.findById.mockResolvedValue(null);

        const id = { toString: () => "ID1" } as any;

        await expect(
            service.updateBerthAndDockAsync(id, new Date(), "DOCK-1", "ops@test.com")
        ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });

    it("updateBerthAndDockAsync should throw when external VVN not found", async () => {
        const vve = { vvnId: "VVN-123" };
        mockRepo.findById.mockResolvedValue(vve);

        mockVvnService.fetchById.mockResolvedValue(null);

        const id = { toString: () => "ID1" } as any;

        await expect(
            service.updateBerthAndDockAsync(
                id,
                new Date("2025-01-01T10:00:00.000Z"),
                "DOCK-1",
                "ops@test.com"
            )
        ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });

    it("updateBerthAndDockAsync should update with discrepancy note when planned dock differs", async () => {
        const vve = {
            vvnId: "VVN-123",
            updateBerthAndDock: vi.fn()
        };
        mockRepo.findById.mockResolvedValue(vve);

        // planned dock diferente do actualDockId
        mockVvnService.fetchById.mockResolvedValue({ dockId: "DOCK-PLANNED" });

        mockRepo.save.mockResolvedValue(vve);
        mockMap.toDTO.mockReturnValue({ ok: true });

        const id = { toString: () => "ID1" } as any;
        const berthTime = new Date("2025-01-01T10:00:00.000Z");

        const result = await service.updateBerthAndDockAsync(
            id,
            berthTime,
            "DOCK-ACTUAL",
            "ops@test.com"
        );

        expect(vve.updateBerthAndDock).toHaveBeenCalledTimes(1);

        const args = (vve.updateBerthAndDock as any).mock.calls[0];
        expect(args[0]).toBeInstanceOf(Date);
        expect(args[1]).toBe("DOCK-ACTUAL");
        expect(args[2]).toBe("ops@test.com");
        expect(args[3]).toContain("differs from planned dock");

        expect(mockRepo.save).toHaveBeenCalledWith(vve);
        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ ok: true });
    });

    it("updateBerthAndDockAsync should update without note when planned dock equals actual", async () => {
        const vve = {
            vvnId: "VVN-123",
            updateBerthAndDock: vi.fn()
        };
        mockRepo.findById.mockResolvedValue(vve);

        mockVvnService.fetchById.mockResolvedValue({ dockId: "DOCK-1" });

        mockRepo.save.mockResolvedValue(vve);
        mockMap.toDTO.mockReturnValue({ ok: true });

        const id = { toString: () => "ID1" } as any;

        await service.updateBerthAndDockAsync(
            id,
            new Date("2025-01-01T10:00:00.000Z"),
            "DOCK-1",
            "ops@test.com"
        );

        const args = (vve.updateBerthAndDock as any).mock.calls[0];
        expect(args[3]).toBeUndefined();
    });
});
