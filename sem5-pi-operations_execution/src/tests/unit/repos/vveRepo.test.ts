import { describe, it, beforeEach, expect, vi } from "vitest";
import VesselVisitExecutionRepo from "../../../repos/vesselVisitExecutionRepo";
import { VesselVisitExecutionCode } from "../../../domain/vesselVisitExecution/vesselVisitExecutionCode";
import { VesselVisitExecutionId } from "../../../domain/vesselVisitExecution/vesselVisitExecutionId";

describe("VesselVisitExecutionRepo", () => {
    let repo: VesselVisitExecutionRepo;

    const mockSchema = {
        find: vi.fn(),
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
        countDocuments: vi.fn()
    };

    const mockMap = {
        toDomain: vi.fn(),
        toPersistence: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new VesselVisitExecutionRepo(mockSchema as any, mockMap as any);
    });

    it("getAllInDateRange should query by actualArrivalTime range and map to domain", async () => {
        const start = new Date("2025-01-01T00:00:00.000Z");
        const end = new Date("2025-01-02T00:00:00.000Z");

        const record1 = { _id: "1" };
        const record2 = { _id: "2" };

        mockSchema.find.mockResolvedValue([record1, record2]);

        mockMap.toDomain
            .mockReturnValueOnce({ domain: "A" })
            .mockReturnValueOnce({ domain: "B" });

        const result = await repo.getAllInDateRange(start, end);

        expect(mockSchema.find).toHaveBeenCalledWith({
            actualArrivalTime: { $gte: start, $lte: end }
        });

        expect(mockMap.toDomain).toHaveBeenCalledTimes(2);
        expect(result).toEqual([{ domain: "A" }, { domain: "B" }]);
    });

    it("findByCode should use code.value and map to domain when found", async () => {
        const code = VesselVisitExecutionCode.create("VVE2025000001");

        const record = { _id: "x" };
        mockSchema.findOne.mockResolvedValue(record);

        mockMap.toDomain.mockReturnValue({ id: "DOMAIN" });

        const result = await repo.findByCode(code);

        expect(mockSchema.findOne).toHaveBeenCalledWith({ code: code.value });
        expect(mockMap.toDomain).toHaveBeenCalledWith(record);
        expect(result).toEqual({ id: "DOMAIN" });
    });

    it("findByCode should return null when not found", async () => {
        const code = VesselVisitExecutionCode.create("VVE2025000001");

        mockSchema.findOne.mockResolvedValue(null);

        const result = await repo.findByCode(code);

        expect(mockSchema.findOne).toHaveBeenCalledWith({ code: code.value });
        expect(result).toBeNull();
    });

    it("findById should query domainId and map to domain when found", async () => {
        const id = { id: { toString: () => "ID123" } } as unknown as VesselVisitExecutionId;

        const record = { _id: "r" };
        mockSchema.findOne.mockResolvedValue(record);
        mockMap.toDomain.mockReturnValue({ ok: true });

        const result = await repo.findById(id);

        expect(mockSchema.findOne).toHaveBeenCalledWith({ domainId: "ID123" });
        expect(result).toEqual({ ok: true });
    });

    it("findById should return null when record not found", async () => {
        const id = { id: { toString: () => "ID123" } } as unknown as VesselVisitExecutionId;

        mockSchema.findOne.mockResolvedValue(null);

        const result = await repo.findById(id);

        expect(result).toBeNull();
    });

    it("findById should return null if schema throws", async () => {
        const id = { id: { toString: () => "ID123" } } as unknown as VesselVisitExecutionId;

        mockSchema.findOne.mockRejectedValue(new Error("DB down"));

        const result = await repo.findById(id);

        expect(result).toBeNull();
    });

    it("save should upsert using domainId and toPersistence", async () => {
        const vve = { id: { toString: () => "DOMAIN-1" } } as any;
        const persistence = { domainId: "DOMAIN-1", code: "VVE2025000001" };

        mockMap.toPersistence.mockReturnValue(persistence);
        mockSchema.findOneAndUpdate.mockResolvedValue({}); // não interessa, repo devolve vve

        const result = await repo.save(vve);

        expect(mockMap.toPersistence).toHaveBeenCalledWith(vve);
        expect(mockSchema.findOneAndUpdate).toHaveBeenCalledWith(
            { domainId: "DOMAIN-1" },
            persistence,
            { upsert: true, new: true }
        );
        expect(result).toBe(vve);
    });

    it("findByVvnId should return domain when found", async () => {
        mockSchema.findOne.mockResolvedValue({ _id: "1" });
        mockMap.toDomain.mockReturnValue({ vvnId: "VVN-1" });

        const result = await repo.findByVvnId("VVN-1");

        expect(mockSchema.findOne).toHaveBeenCalledWith({ vvnId: "VVN-1" });
        expect(result).toEqual({ vvnId: "VVN-1" });
    });

    it("findByVvnId should return null when not found", async () => {
        mockSchema.findOne.mockResolvedValue(null);

        const result = await repo.findByVvnId("VVN-1");

        expect(result).toBeNull();
    });

    it("getNextSequenceNumber should return count + 1", async () => {
        mockSchema.countDocuments.mockResolvedValue(41);

        const result = await repo.getNextSequenceNumber();

        expect(mockSchema.countDocuments).toHaveBeenCalled();
        expect(result).toBe(42);
    });

    it("exists should return true when findByVvnId finds a record", async () => {
        mockSchema.findOne.mockResolvedValue({ _id: "1" });
        mockMap.toDomain.mockReturnValue({ vvnId: "VVN-1" });

        const vve = { vvnId: "VVN-1" } as any;

        const result = await repo.exists(vve);

        expect(result).toBe(true);
    });

    it("exists should return false when findByVvnId returns null", async () => {
        mockSchema.findOne.mockResolvedValue(null);

        const vve = { vvnId: "VVN-1" } as any;

        const result = await repo.exists(vve);

        expect(result).toBe(false);
    });

    it("findAll should return mapped domain list", async () => {
        mockSchema.find.mockResolvedValue([{ _id: "1" }, { _id: "2" }]);
        mockMap.toDomain.mockReturnValueOnce({ a: 1 }).mockReturnValueOnce({ a: 2 });

        const result = await repo.findAll();

        expect(mockSchema.find).toHaveBeenCalled();
        expect(result).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it("findByImo should query by vesselImo and filter falsy mappings", async () => {
        mockSchema.find.mockResolvedValue([{ _id: "1" }, { _id: "2" }, { _id: "3" }]);

        mockMap.toDomain
            .mockReturnValueOnce({ imo: "IMO123" })
            .mockReturnValueOnce(null)        // simula record inválido
            .mockReturnValueOnce({ imo: "IMO123" });

        const result = await repo.findByImo("IMO123");

        expect(mockSchema.find).toHaveBeenCalledWith({ vesselImo: "IMO123" });
        expect(result).toEqual([{ imo: "IMO123" }, { imo: "IMO123" }]);
    });
});
