import { describe, it, beforeEach, expect, vi } from "vitest";
import OperationPlanRepo from "../../../repos/operationPlanRepo";
import OperationPlanMap from "../../../mappers/OperationPlanMap";

// Mock mapper
const mockMap = {
  toDomain: vi.fn(),
};

// Mock schema with chainable find().sort()
const mockSchema = {
  find: vi.fn().mockReturnThis(),
  sort: vi.fn(),
};

let repo: OperationPlanRepo;

beforeEach(() => {
  vi.clearAllMocks();
  repo = new OperationPlanRepo(mockSchema as any, mockMap as any);
});

describe("OperationPlanRepo.searchByCraneAndInterval", () => {

  it("returns empty array when no records are found", async () => {
    mockSchema.sort.mockResolvedValue([]);

    const results = await repo.searchByCraneAndInterval(
      new Date("2025-01-01"),
      new Date("2025-01-01"),
      "CR01"
    );

    expect(results).toEqual([]);
  });

  it("maps valid records to domain objects", async () => {
    const today = new Date("2025-01-01");

    const record = {
      planDate: today,
      operations: [{ crane: "CR01" }],
    };

    mockSchema.sort.mockResolvedValue([record]);
    mockMap.toDomain.mockReturnValue(record);

    const results = await repo.searchByCraneAndInterval(
      today,
      today,
      "CR01"
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(record);
    expect(mockMap.toDomain).toHaveBeenCalledWith(record);
  });

  it("builds MongoDB query with strict date interval and crane filter", async () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-01");

    mockSchema.sort.mockResolvedValue([]);
    mockMap.toDomain.mockImplementation(r => r);

    await repo.searchByCraneAndInterval(start, end, "CR01");

    expect(mockSchema.find).toHaveBeenCalledWith({
      planDate: {
        $gte: new Date("2025-01-01T00:00:00.000Z"),
        $lte: new Date("2025-01-01T23:59:59.999Z"),
      },
      "operations.crane": { $regex: "CR01", $options: "i" },
    });
  });

  it("omits crane filter when craneId is not provided", async () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-01");

    mockSchema.sort.mockResolvedValue([]);

    await repo.searchByCraneAndInterval(start, end);

    expect(mockSchema.find).toHaveBeenCalledWith({
      planDate: {
        $gte: new Date("2025-01-01T00:00:00.000Z"),
        $lte: new Date("2025-01-01T23:59:59.999Z"),
      },
    });
  });

  it("throws error when startDate or endDate is missing", async () => {
    await expect(
      // @ts-expect-error intentional misuse
      repo.searchByCraneAndInterval(undefined, new Date(), "CR01")
    ).rejects.toThrow("startDate and endDate are required");
  });
});
