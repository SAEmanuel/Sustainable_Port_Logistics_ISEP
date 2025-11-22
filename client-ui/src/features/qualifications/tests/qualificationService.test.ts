import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as mapper from "../mappers/qualificationMapper";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();

vi.mock("../../../services/api", async () => ({
    default: {
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
    }
}));


let service: typeof import('../services/qualificationService');


const mapToDomainSpy = vi.spyOn(mapper, 'mapToQualificationDomain');

describe('Qualification Service', () => {


    beforeAll(async () => {
        service = await import('../services/qualificationService');
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mapToDomainSpy.mockImplementation((data) => ({
            ...data,
            id: String(data.id),
            qualificationCodes: data.qualificationCodes || []
        }));
    });

    it('getQualifications deve chamar GET e usar o mapeador em todos os resultados', async () => {
        const mockData = [{ id: 1, name: 'A', code: 'A1' }, { id: 2, name: 'B', code: 'B1' }];
        mockGet.mockResolvedValue({ data: mockData });

        const result = await service.getQualifications();

        expect(mockGet).toHaveBeenCalledWith("/api/Qualifications");
        expect(mapToDomainSpy).toHaveBeenCalledTimes(2);
        expect(result[0].id).toBe('1');
    });

    it('getQualificationByCode deve chamar GET com o código correto', async () => {
        const mockData = { id: 3, name: 'C', code: 'C3' };
        mockGet.mockResolvedValue({ data: mockData });

        await service.getQualificationByCode('C3');

        expect(mockGet).toHaveBeenCalledWith("/api/Qualifications/code/C3");
    });

    it('createQualification deve chamar POST com o request DTO', async () => {
        const request = { name: 'New', code: 'N1' };
        const mockResponse = { id: 4, ...request };
        mockPost.mockResolvedValue({ data: mockResponse });

        await service.createQualification(request);

        expect(mockPost).toHaveBeenCalledWith("/api/Qualifications", request);
    });

    it('updateQualification deve chamar PATCH com o ID e o DTO de atualização', async () => {
        const id = '5';
        const request = { name: 'Update' };
        const mockResponse = { id, name: 'Update', code: 'U5' };
        mockPatch.mockResolvedValue({ data: mockResponse });

        await service.updateQualification(id, request);

        expect(mockPatch).toHaveBeenCalledWith(`/api/Qualifications/${id}`, request);
    });
});