import { describe, it, expect, vi, beforeEach } from "vitest";

import ComplementaryTaskService from "../../../services/complementaryTaskService";

import { BusinessRuleValidationError } from "../../../core/logic/BusinessRuleValidationError";
import { CTStatus } from "../../../domain/complementaryTask/ctstatus";

import { ComplementaryTaskCode } from "../../../domain/complementaryTask/ComplementaryTaskCode";




const mockRepo = {
    getNextSequenceNumber: vi.fn(),
    save: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    findByCategory: vi.fn(),
    findByStaff: vi.fn(),
    findByVve: vi.fn(),
    findScheduled: vi.fn(),
    findInProgress: vi.fn(),
    findCompleted: vi.fn(),
    findInRange: vi.fn()
};

const mockCategoryRepo = {
    findById: vi.fn(),
    findByCode: vi.fn()
};

const mockVveRepo = {
    findById: vi.fn(),
    findByCode: vi.fn()
};

const mockMapper = {
    toDTO: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
};




let service: ComplementaryTaskService;

beforeEach(() => {
    vi.clearAllMocks();

    service = new ComplementaryTaskService(
        mockRepo as any,
        mockCategoryRepo as any,
        mockVveRepo as any,
        mockMapper as any,
        mockLogger as any
    );
});




const fakeCategory = {
    code: "CTC001",
    categoryId: { id: "CAT123" }
};

const fakeVve = {
    vesselVisitExecutionId: { id: "VVE123" }
};

const fakeTask = {
    code: { value: "CTC001[1]" },
    status: CTStatus.Scheduled,
    changeDetails: vi.fn(),
    changeStatus: vi.fn()
};


// ==========================================================
// CREATE
// ==========================================================

describe("ComplementaryTaskService - createAsync", () => {

    it("should create a complementary task", async () => {

        mockRepo.getNextSequenceNumber.mockResolvedValue(1);

        mockCategoryRepo.findById.mockResolvedValue(fakeCategory);
        mockVveRepo.findById.mockResolvedValue(fakeVve);

        mockRepo.save.mockResolvedValue(fakeTask);
        mockMapper.toDTO.mockReturnValue({ code: "CTC001[1]" });

        const result = await service.createAsync({
            category: "CAT123",
            staff: "John",
            vve: "VVE123",
            timeStart: new Date()
        });

        expect(result.isSuccess).toBe(true);
        expect(mockRepo.save).toHaveBeenCalled();
    });


    it("should throw if category does not exist", async () => {

        mockCategoryRepo.findById.mockResolvedValue(null);

        await expect(
            service.createAsync({
                category: "INVALID",
                staff: "John",
                vve: "VVE123",
                timeStart: new Date()
            })
        ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });


    it("should throw if VVE does not exist", async () => {

        mockCategoryRepo.findById.mockResolvedValue(fakeCategory);
        mockVveRepo.findById.mockResolvedValue(null);

        await expect(
            service.createAsync({
                category: "CAT123",
                staff: "John",
                vve: "INVALID",
                timeStart: new Date()
            })
        ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });
});


// ==========================================================
// UPDATE
// ==========================================================

describe("ComplementaryTaskService - updateAsync", () => {

    it("should update task and change status", async () => {

        mockRepo.findByCode.mockResolvedValue(fakeTask);
        mockCategoryRepo.findById.mockResolvedValue(fakeCategory);
        mockVveRepo.findById.mockResolvedValue(fakeVve);

        mockRepo.save.mockResolvedValue(fakeTask);
        mockMapper.toDTO.mockReturnValue({ code: "CTC001[1]" });

        const code = ComplementaryTaskCode.createFromString("CTC001[1]");

        const result = await service.updateAsync(code, {
            category: "CAT123",
            staff: "John",
            timeStart: new Date(),
            vve: "VVE123",
            status: CTStatus.InProgress
        });

        expect(result.isSuccess).toBe(true);
        expect(fakeTask.changeStatus).toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalled();
    });


    it("should throw if task does not exist", async () => {

        mockRepo.findByCode.mockResolvedValue(null);


        const code = ComplementaryTaskCode.createFromString("CTC999[999]");

        await expect(
            service.updateAsync(code, {
                category: "CAT123",
                staff: "John",
                timeStart: new Date(),
                vve: "VVE123",
                status: CTStatus.Scheduled
            })
        ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });
});


// ==========================================================
// RANGE VALIDATION
// ==========================================================

describe("ComplementaryTaskService - getInRangeAsync", () => {

    it("should throw if start >= end", async () => {

        const now = new Date();

        await expect(
            service.getInRangeAsync(now, now)
        ).rejects.toBeInstanceOf(BusinessRuleValidationError);
    });

    it("should return tasks in range", async () => {

        mockRepo.findInRange.mockResolvedValue([fakeTask]);
        mockMapper.toDTO.mockReturnValue({ code: "CTC001[1]" });

        const result = await service.getInRangeAsync(
            new Date("2025-01-01"),
            new Date("2025-01-10")
        );

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().length).toBe(1);
    });
});


// ==========================================================
// STATUS FILTERS
// ==========================================================

describe("ComplementaryTaskService - status queries", () => {

    it("should return scheduled tasks", async () => {
        mockRepo.findScheduled.mockResolvedValue([fakeTask]);
        mockMapper.toDTO.mockReturnValue({ code: "CTC001[1]" });

        const res = await service.getScheduledAsync();
        expect(res.getValue().length).toBe(1);
    });

    it("should return in-progress tasks", async () => {
        mockRepo.findInProgress.mockResolvedValue([fakeTask]);

        const res = await service.getInProgressAsync();
        expect(res.getValue().length).toBe(1);
    });

    it("should return completed tasks", async () => {
        mockRepo.findCompleted.mockResolvedValue([fakeTask]);

        const res = await service.getCompletedAsync();
        expect(res.getValue().length).toBe(1);
    });
});