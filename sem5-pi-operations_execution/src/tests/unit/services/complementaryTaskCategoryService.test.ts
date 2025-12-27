import { describe, it, expect, vi, beforeEach } from "vitest";
import ComplementaryTaskCategoryService from "../../../services/complementaryTaskCategoryService";
import { BusinessRuleValidationError } from "../../../core/logic/BusinessRuleValidationError";
import { Category } from "../../../domain/complementaryTaskCategory/category";
import { ComplementaryTaskCategory } from "../../../domain/complementaryTaskCategory/complementaryTaskCategory";


const mockRepo = {
    findByCode: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findByDescription: vi.fn(),
    findByCategory: vi.fn(),
    getTotalCategories: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn()
};

const mockMapper = {
    toDTO: vi.fn(),
    toPersistence: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
};




let service: ComplementaryTaskCategoryService;

beforeEach(() => {
    vi.clearAllMocks();
    service = new ComplementaryTaskCategoryService(
        mockRepo as any,
        mockMapper as any,
        mockLogger as any
    );
});



const sampleDto = {
    code: "CTC001",
    name: "Fire Safety Inspection",
    description: "Fire drill & inspection",
    category: Category.SafetyAndSecurity,
    defaultDuration: 30
};

const fakeDomain = {
    code: "CTC001",
    name: "Fire Safety Inspection",
    description: "Fire drill & inspection",
    category: Category.SafetyAndSecurity,
    isActive: true
} as unknown as ComplementaryTaskCategory;


// =======================================================
// CREATE
// =======================================================

describe("ComplementaryTaskCategoryService - createAsync", () => {

    it("should create a new category", async () => {

        mockRepo.findByCode.mockResolvedValue(null);
        mockRepo.save.mockResolvedValue(fakeDomain);
        mockMapper.toDTO.mockReturnValue(sampleDto);

        const result = await service.createAsync(sampleDto);

        expect(result.isSuccess).toBe(true);
        expect(mockRepo.save).toHaveBeenCalled();
        expect(mockMapper.toDTO).toHaveBeenCalledWith(fakeDomain);
    });


    it("should throw when category already exists", async () => {

        mockRepo.findByCode.mockResolvedValue(fakeDomain);

        await expect(service.createAsync(sampleDto))
            .rejects
            .toBeInstanceOf(BusinessRuleValidationError);
    });
});


// =======================================================
// UPDATE
// =======================================================

describe("ComplementaryTaskCategoryService - updateAsync", () => {

    it("should update an existing category", async () => {

        mockRepo.findByCode.mockResolvedValue(fakeDomain);
        mockRepo.save.mockResolvedValue(fakeDomain);
        mockMapper.toDTO.mockReturnValue(sampleDto);

        fakeDomain.changeDetails = vi.fn();

        const result = await service.updateAsync("CTC001", sampleDto);

        expect(result.isSuccess).toBe(true);
        expect(fakeDomain.changeDetails).toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should throw when category does not exist", async () => {

        mockRepo.findByCode.mockResolvedValue(null);

        await expect(service.updateAsync("INVALID", sampleDto))
            .rejects
            .toBeInstanceOf(BusinessRuleValidationError);
    });
});


// =======================================================
// GET BY CODE
// =======================================================

describe("ComplementaryTaskCategoryService - getByCodeAsync", () => {

    it("should return category DTO", async () => {

        mockRepo.findByCode.mockResolvedValue(fakeDomain);
        mockMapper.toDTO.mockReturnValue(sampleDto);

        const result = await service.getByCodeAsync("CTC001");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().code).toBe("CTC001");
    });

    it("should throw when not found", async () => {

        mockRepo.findByCode.mockResolvedValue(null);

        await expect(service.getByCodeAsync("UNKNOWN"))
            .rejects
            .toBeInstanceOf(BusinessRuleValidationError);
    });
});


// =======================================================
// ACTIVATE / DEACTIVATE
// =======================================================

describe("ComplementaryTaskCategoryService - activate/deactivate", () => {

    it("should activate a category", async () => {

        fakeDomain.activate = vi.fn();
        mockRepo.findByCode.mockResolvedValue(fakeDomain);
        mockRepo.save.mockResolvedValue(fakeDomain);
        mockMapper.toDTO.mockReturnValue(sampleDto);

        const result = await service.activateAsync("CTC001");

        expect(result.isSuccess).toBe(true);
        expect(fakeDomain.activate).toHaveBeenCalled();
    });


    it("should deactivate a category", async () => {

        fakeDomain.deactivate = vi.fn();
        mockRepo.findByCode.mockResolvedValue(fakeDomain);
        mockRepo.save.mockResolvedValue(fakeDomain);
        mockMapper.toDTO.mockReturnValue(sampleDto);

        const result = await service.deactivateAsync("CTC001");

        expect(result.isSuccess).toBe(true);
        expect(fakeDomain.deactivate).toHaveBeenCalled();
    });
});


// =======================================================
// GET ALL
// =======================================================

describe("ComplementaryTaskCategoryService - getAllAsync", () => {

    it("should return mapped DTO list", async () => {

        mockRepo.findAll.mockResolvedValue([fakeDomain]);
        mockMapper.toDTO.mockReturnValue(sampleDto);

        const result = await service.getAllAsync();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().length).toBe(1);
    });
});