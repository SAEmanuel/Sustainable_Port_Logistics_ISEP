
import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../services/ExternalData/vvnService", () => {
  return {
    default: class VvnService {
      fetchById = vi.fn();
    },
  };
});


vi.mock("../../../repos/operationPlanRepo", () => {
  return {
    default: class OperationPlanRepo {
      findLatestByVvnId = vi.fn();
      save = vi.fn();
    },
  };
});

import VesselVisitExecutionService from "../../../services/vesselVisitExecutionService";
import { BusinessRuleValidationError } from "../../../core/logic/BusinessRuleValidationError";
import { VesselVisitExecutionCode } from "../../../domain/vesselVisitExecution/vesselVisitExecutionCode";

describe("VesselVisitExecutionService", () => {
  let service: VesselVisitExecutionService;

  let repoMock: any;
  let vvnServiceMock: any;
  let loggerMock: any;
  let mapMock: any;
  let operationPlanRepoMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    repoMock = {
      save: vi.fn(),
      findByVvnId: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findByImo: vi.fn(),
      getAllInDateRange: vi.fn(),
      getNextSequenceNumber: vi.fn(),
    };

    vvnServiceMock = {
      fetchById: vi.fn(),
    };

    loggerMock = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mapMock = {
      toDTO: (vve: any) => ({
        id: vve?.id?.toString?.() ?? "domain-id",
        code: vve?.code?.value ?? vve?.code ?? "VVE2025000001",
        vvnId: vve?.vvnId ?? "VVN-1",
        vesselImo: vve?.vesselImo ?? "IMO-1",
        actualArrivalTime: vve?.actualArrivalTime ?? new Date().toISOString(),
        status: vve?.status ?? "In Progress",
        creatorEmail: vve?.creatorEmail ?? "creator@test.com",
      }),
    };

    operationPlanRepoMock = {
      findLatestByVvnId: vi.fn(),
      save: vi.fn(),
    };

    service = new VesselVisitExecutionService(
      repoMock,
      vvnServiceMock,
      loggerMock,
      mapMock,
      operationPlanRepoMock
    );
  });

  // =========================================================================
  // CREATE
  // =========================================================================
  describe("createAsync", () => {
    const validDTO: any = {
      vvnId: "VVN-123",
      actualArrivalTime: new Date(Date.now() - 60_000).toISOString(),
      creatorEmail: "creator@test.com",
    };

    it("should create successfully when VVN exists and no existing VVE", async () => {
      vvnServiceMock.fetchById.mockResolvedValue({ vesselImo: "1000021" });
      repoMock.findByVvnId.mockResolvedValue(null);

      repoMock.getNextSequenceNumber.mockResolvedValue(1);
      repoMock.save.mockImplementation(async (v: any) => v);

      const result = await service.createAsync(validDTO);

      expect(vvnServiceMock.fetchById).toHaveBeenCalledWith("VVN-123");
      expect(repoMock.findByVvnId).toHaveBeenCalledWith("VVN-123");
      expect(repoMock.getNextSequenceNumber).toHaveBeenCalled();
      expect(repoMock.save).toHaveBeenCalledTimes(1);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveProperty("vvnId", "VVN-123");
    });

    it("should throw if external VVN not found", async () => {
      vvnServiceMock.fetchById.mockResolvedValue(null);

      await expect(service.createAsync(validDTO)).rejects.toBeInstanceOf(
        BusinessRuleValidationError
      );

      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it("should throw if VVE already exists for VVN", async () => {
      vvnServiceMock.fetchById.mockResolvedValue({ vesselImo: "1000021" });
      repoMock.findByVvnId.mockResolvedValue({ some: "existing" });

      await expect(service.createAsync(validDTO)).rejects.toBeInstanceOf(
        BusinessRuleValidationError
      );

      expect(repoMock.save).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GET ALL
  // =========================================================================
  describe("getAllAsync", () => {
    it("should return ok list when repo succeeds", async () => {
      repoMock.findAll.mockResolvedValue([
        { code: { value: "VVE2026000001" }, status: "In Progress" },
        { code: { value: "VVE2026000002" }, status: "Completed" },
      ]);

      const result = await service.getAllAsync();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(2);
      expect(repoMock.findAll).toHaveBeenCalled();
    });

    it("should return fail when repo throws", async () => {
      repoMock.findAll.mockRejectedValue(new Error("DB down"));

      const result = await service.getAllAsync();

      expect(result.isFailure).toBe(true);
      expect(String(result.error)).toMatch(/DB down/i);
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GET BY ID
  // =========================================================================
  describe("getByIdAsync", () => {
    it("should return ok when found", async () => {
      const domainVve = { code: { value: "VVE2026000001" }, status: "In Progress" };
      repoMock.findById.mockResolvedValue(domainVve);

      const result = await service.getByIdAsync("ID_OBJ" as any);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().code).toBe("VVE2026000001");
      expect(repoMock.findById).toHaveBeenCalledWith("ID_OBJ");
    });

    it("should throw BusinessRuleValidationError when not found", async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.getByIdAsync("MISSING" as any)).rejects.toBeInstanceOf(
        BusinessRuleValidationError
      );
    });
  });

  // =========================================================================
  // GET BY CODE
  // =========================================================================
  describe("getByCodeAsync", () => {
    it("should return ok when found", async () => {
      const domainVve = { code: { value: "VVE2026000006" }, status: "Completed" };
      repoMock.findByCode.mockResolvedValue(domainVve);

      const codeVO = VesselVisitExecutionCode.create("VVE2026000006");
      const result = await service.getByCodeAsync(codeVO);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().code).toBe("VVE2026000006");
      expect(repoMock.findByCode).toHaveBeenCalledWith(codeVO);
    });

    it("should throw BusinessRuleValidationError when not found", async () => {
      repoMock.findByCode.mockResolvedValue(null);

      const codeVO = VesselVisitExecutionCode.create("VVE2026000999");

      await expect(service.getByCodeAsync(codeVO)).rejects.toBeInstanceOf(
        BusinessRuleValidationError
      );
    });
  });

  // =========================================================================
  // GET BY IMO
  // =========================================================================
  describe("getByImoAsync", () => {
    it("should return ok list", async () => {
      repoMock.findByImo.mockResolvedValue([
        { code: { value: "VVE2026000001" }, vesselImo: "IMO123" },
        { code: { value: "VVE2026000002" }, vesselImo: "IMO123" },
      ]);

      const result = await service.getByImoAsync("IMO123");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(2);
      expect(repoMock.findByImo).toHaveBeenCalledWith("IMO123");
    });
  });

  // =========================================================================
  // GET IN RANGE
  // =========================================================================
  describe("getInRangeAsync", () => {
    it("should throw if start >= end", async () => {
      const start = new Date("2026-01-02T00:00:00.000Z");
      const end = new Date("2026-01-02T00:00:00.000Z");

      await expect(service.getInRangeAsync(start, end)).rejects.toBeInstanceOf(
        BusinessRuleValidationError
      );
    });

    it("should return ok list for valid range", async () => {
      const start = new Date("2026-01-01T00:00:00.000Z");
      const end = new Date("2026-01-31T00:00:00.000Z");

      repoMock.getAllInDateRange.mockResolvedValue([{ code: { value: "VVE2026000001" } }]);

      const result = await service.getInRangeAsync(start, end);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(repoMock.getAllInDateRange).toHaveBeenCalledWith(start, end);
    });
  });

  // =========================================================================
  // UPDATE BERTH + DOCK
  // =========================================================================
  describe("updateBerthAndDockAsync", () => {
    it("should update berth/dock and save (with discrepancy note when planned dock differs)", async () => {
      const domainVve: any = {
        id: { toString: () => "domain-id" },
        vvnId: "VVN-123",
        actualArrivalTime: new Date("2026-01-01T10:00:00.000Z"),
        updateBerthAndDock: vi.fn(),
      };

      repoMock.findById.mockResolvedValue(domainVve);
      vvnServiceMock.fetchById.mockResolvedValue({ dockId: "DK-0002" });
      repoMock.save.mockResolvedValue(domainVve);

      const berthTime = new Date("2026-01-01T11:00:00.000Z");
      const actualDockId = "DK-0001";

      const result = await service.updateBerthAndDockAsync(
        "ID_OBJ" as any,
        berthTime,
        actualDockId,
        "ops@test.com"
      );

      expect(result.isSuccess).toBe(true);

      expect(domainVve.updateBerthAndDock).toHaveBeenCalledTimes(1);
      const args = domainVve.updateBerthAndDock.mock.calls[0];
      expect(args[1]).toBe(actualDockId);
      expect(args[2]).toBe("ops@test.com");
      expect(String(args[3])).toMatch(/differs from planned dock/i);

      expect(repoMock.save).toHaveBeenCalledWith(domainVve);
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it("should throw if VVE not found", async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.updateBerthAndDockAsync(
          "MISSING" as any,
          new Date(),
          "DK-1",
          "ops@test.com"
        )
      ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });

    it("should throw if external VVN not found", async () => {
      repoMock.findById.mockResolvedValue({ vvnId: "VVN-123", updateBerthAndDock: vi.fn() });
      vvnServiceMock.fetchById.mockResolvedValue(null);

      await expect(
        service.updateBerthAndDockAsync(
          "ID_OBJ" as any,
          new Date(),
          "DK-1",
          "ops@test.com"
        )
      ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });
  });

  // =========================================================================
  // UPDATE EXECUTED OPERATIONS
  // =========================================================================
  describe("updateExecutedOperationsAsync", () => {
    it("should update executed ops, save VVE, and sync to plan when plan exists and updateForVvn succeeds", async () => {
      const domainVve: any = {
        vvnId: "VVN-123",
        executedOperations: [
          {
            plannedOperationId: "VVN-123:1000",
            actualStart: new Date("2026-01-01T10:00:00.000Z"),
            actualEnd: new Date("2026-01-01T11:00:00.000Z"),
            resourcesUsed: [],
            status: "completed",
            note: "ok",
            updatedAt: new Date(),
            updatedBy: "operator-1",
          },
        ],
        updateExecutedOperations: vi.fn(),
      };

      repoMock.findById.mockResolvedValue(domainVve);
      repoMock.save.mockResolvedValue(domainVve);

      const plan: any = {
        operations: [
          { vvnId: "VVN-123", startTime: 1000, endTime: 1100 },
          { vvnId: "VVN-999", startTime: 2000, endTime: 2100 },
        ],
        updateForVvn: vi.fn().mockReturnValue({ isSuccess: true }),
      };

      operationPlanRepoMock.findLatestByVvnId.mockResolvedValue(plan);
      operationPlanRepoMock.save.mockResolvedValue(plan);

      const result = await service.updateExecutedOperationsAsync(
        "ID_OBJ" as any,
        [
          {
            plannedOperationId: "VVN-123:1000",
            actualStart: "2026-01-01T10:00:00.000Z",
            actualEnd: "2026-01-01T11:00:00.000Z",
            resourcesUsed: [],
            status: "completed",
            note: "ok",
          },
        ],
        "operator-1"
      );

      expect(result.isSuccess).toBe(true);

      expect(domainVve.updateExecutedOperations).toHaveBeenCalledTimes(1);
      const [normalized, operatorId] = domainVve.updateExecutedOperations.mock.calls[0];
      expect(operatorId).toBe("operator-1");
      expect(normalized[0].actualStart).toBeInstanceOf(Date);
      expect(normalized[0].actualEnd).toBeInstanceOf(Date);

      expect(operationPlanRepoMock.findLatestByVvnId).toHaveBeenCalledWith("VVN-123");
      expect(plan.updateForVvn).toHaveBeenCalled();
      expect(operationPlanRepoMock.save).toHaveBeenCalledWith(plan);
    });

    it("should warn and not save plan when plan updateForVvn fails", async () => {
      const domainVve: any = {
        vvnId: "VVN-123",
        executedOperations: [],
        updateExecutedOperations: vi.fn(),
      };

      repoMock.findById.mockResolvedValue(domainVve);
      repoMock.save.mockResolvedValue(domainVve);

      const plan: any = {
        operations: [{ vvnId: "VVN-123", startTime: 1000, endTime: 1100 }],
        updateForVvn: vi.fn().mockReturnValue({ isSuccess: false }),
      };

      operationPlanRepoMock.findLatestByVvnId.mockResolvedValue(plan);

      const result = await service.updateExecutedOperationsAsync(
        "ID_OBJ" as any,
        [{ plannedOperationId: "VVN-123:1000" }],
        "operator-1"
      );

      expect(result.isSuccess).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalled();
      expect(operationPlanRepoMock.save).not.toHaveBeenCalled();
    });

    it("should throw if VVE not found", async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.updateExecutedOperationsAsync(
          "MISSING" as any,
          [{ plannedOperationId: "x" }],
          "operator-1"
        )
      ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });
  });

  // =========================================================================
  // SET COMPLETED
  // =========================================================================
  describe("setCompletedAsync", () => {
    it("should return fail Result when VVE not found by code", async () => {
      repoMock.findByCode.mockResolvedValue(null);

      const codeVO = VesselVisitExecutionCode.create("VVE2026000006");

      const result = await service.setCompletedAsync(
        codeVO,
        new Date("2026-01-01T10:00:00.000Z"),
        new Date("2026-01-01T11:00:00.000Z"),
        "ops@test.com"
      );

      expect(result.isFailure).toBe(true);
      expect(String(result.error)).toMatch(/No VVE found with code/i);
    });

    it("should complete, save and return ok when domain succeeds", async () => {
      const domainVve: any = {
        setCompleted: vi.fn(),
        code: { value: "VVE2026000006" },
      };

      repoMock.findByCode.mockResolvedValue(domainVve);
      repoMock.save.mockResolvedValue(domainVve);

      const codeVO = VesselVisitExecutionCode.create("VVE2026000006");

      const unberth = new Date("2026-01-01T10:00:00.000Z");
      const leave = new Date("2026-01-01T11:00:00.000Z");

      const result = await service.setCompletedAsync(codeVO, unberth, leave, "ops@test.com");

      expect(result.isSuccess).toBe(true);
      expect(domainVve.setCompleted).toHaveBeenCalledWith(unberth, leave, "ops@test.com");
      expect(repoMock.save).toHaveBeenCalledWith(domainVve);
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it("should return fail Result when domain throws", async () => {
      const domainVve: any = {
        setCompleted: vi.fn(() => {
          throw new Error("Invalid status");
        }),
        code: { value: "VVE2026000006" },
      };

      repoMock.findByCode.mockResolvedValue(domainVve);

      const codeVO = VesselVisitExecutionCode.create("VVE2026000006");

      const result = await service.setCompletedAsync(
        codeVO,
        new Date("2026-01-01T10:00:00.000Z"),
        new Date("2026-01-01T11:00:00.000Z"),
        "ops@test.com"
      );

      expect(result.isFailure).toBe(true);
      expect(String(result.error)).toMatch(/Invalid status/i);
      expect(loggerMock.error).toHaveBeenCalled();
      expect(repoMock.save).not.toHaveBeenCalled();
    });
  });
});
