import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as mapper from "../mappers/complementaryTaskCategoryMapper";
import type { ComplementaryTaskCategoryDTO } from "../dtos/complementaryTaskCategoryDTO";
import type { CreateComplementaryTaskCategoryDTO } from "../dtos/createComplementaryTaskCategoryDTO";
import type { UpdateComplementaryTaskCategoryDTO } from "../dtos/updateComplementaryTaskCategoryDTO";
import type { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock("../../../services/api", () => ({
    operationsApi: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
    }
}));

let service: typeof import('../services/complementaryTaskCategoryService');
const mapToDomainSpy = vi.spyOn(mapper, 'mapToCTCDomain');

describe("ComplementaryTaskCategory Service", () => {
    beforeAll(async () => {
        service = await import('../services/complementaryTaskCategoryService');
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mapToDomainSpy.mockImplementation((data: ComplementaryTaskCategoryDTO) => data as unknown as ComplementaryTaskCategory);
    });

    it("getAllCTC should call GET and map results", async () => {
        const mockData: ComplementaryTaskCategoryDTO[] = [{
            id: "1",
            code: "C1",
            name: "N1",
            description: "Desc 1",
            category: "Maintenance",
            isActive: true
        }];
        mockGet.mockResolvedValue({ data: mockData });

        await service.getAllCTC();

        expect(mockGet).toHaveBeenCalledWith("/api/complementary-task-categories");
        expect(mapToDomainSpy).toHaveBeenCalled();
    });

    it("createCTC should call POST with DTO", async () => {
        const dto: CreateComplementaryTaskCategoryDTO = {
            code: "NEW",
            name: "New Cat",
            description: "New description",
            category: "Safety and Security"
        };

        mockPost.mockResolvedValue({ data: { id: "10", ...dto, isActive: true } });

        await service.createCTC(dto);

        expect(mockPost).toHaveBeenCalledWith("/api/complementary-task-categories", dto);
    });

    it("getCTCByCode should call specific endpoint with code", async () => {
        const mockData: ComplementaryTaskCategoryDTO = {
            id: "1",
            code: "TEST",
            name: "Test",
            description: "Test Desc",
            category: "Cleaning and Housekeeping",
            isActive: true
        };
        mockGet.mockResolvedValue({ data: mockData });

        await service.getCTCByCode("TEST");

        // Ajustado para coincidir com o serviço: /api/complementary-task-categories/${code}
        expect(mockGet).toHaveBeenCalledWith("/api/complementary-task-categories/TEST");
    });

    it("updateCTC should call PUT with code and DTO", async () => {
        const code = "CAT01";
        const dto: UpdateComplementaryTaskCategoryDTO = {
            name: "Updated Name",
            description: "Updated description",
            category: "Maintenance"
        };

        mockPut.mockResolvedValue({ data: { id: "1", code, ...dto, isActive: true } });

        await service.updateCTC(code, dto);

        expect(mockPut).toHaveBeenCalledWith(`/api/complementary-task-categories/${code}`, dto);
    });
});