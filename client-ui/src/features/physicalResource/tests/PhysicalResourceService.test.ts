import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as mapper from "../mappers/physicalResourceMapper";
import { PhysicalResourceType } from "../domain/physicalResource";
import type { PhysicalResource } from "../domain/physicalResource";

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

let service: typeof import('../services/physicalResourceService');

const mapToDomainSpy = vi.spyOn(mapper, 'mapToPhysicalResource');

describe('PhysicalResource Service', () => {

    beforeAll(async () => {
        service = await import('../services/physicalResourceService');
    });

    beforeEach(() => {
        vi.clearAllMocks();

        mapToDomainSpy.mockImplementation((data: unknown) => {
            const raw = data as { id: string | number; code: string | { value: string } };

            return {
                ...raw,
                id: String(raw.id),
                code: typeof raw.code === 'string' ? { value: raw.code } : raw.code,
            } as unknown as PhysicalResource;
        });
    });

    it('getAllPhysicalResources deve chamar GET e usar o mapeador em todos os resultados', async () => {
        const mockData = [
            { id: 1, description: 'R1', code: 'TRUCK-0001', physicalResourceType: 'Truck' },
            { id: 2, description: 'R2', code: 'FORKLIFT-002', physicalResourceType: 'Forklift' }
        ];

        mockGet.mockResolvedValue({ data: mockData });

        const result = await service.getAllPhysicalResources();

        expect(mockGet).toHaveBeenCalledWith("/api/PhysicalResource");
        expect(mapToDomainSpy).toHaveBeenCalledTimes(2);

        expect(result[0].id).toBe('1');
        expect(result[0].code.value).toBe('TRUCK-0001');
    });

    it('getPhysicalResourceByCode deve chamar GET com a URL correta', async () => {
        const code = 'TRUCK-0001';
        const mockData = { id: 3, description: 'R3', code: code, physicalResourceType: 'Truck' };

        mockGet.mockResolvedValue({ data: mockData });

        await service.getPhysicalResourceByCode(code);

        expect(mockGet).toHaveBeenCalledWith(`/api/PhysicalResource/get/code/${code}`);
        expect(mapToDomainSpy).toHaveBeenCalledTimes(1);
    });

    it('createPhysicalResource deve chamar POST com o payload correto', async () => {
        const request = {
            description: 'New Truck',
            physicalResourceType: PhysicalResourceType.Truck,
            operationalCapacity: 100
        };

        const mockResponse = { id: 4, code: 'TRUCK-NEW-01', ...request };

        mockPost.mockResolvedValue({ data: mockResponse });

        await service.createPhysicalResource(request);

        expect(mockPost).toHaveBeenCalledWith("/api/PhysicalResource", expect.objectContaining(request));
    });

    it('updatePhysicalResource deve chamar PATCH com o ID e o DTO de atualização', async () => {
        const id = '5';
        const request = { description: 'Updated Desc' };

        const mockResponse = { id: 5, code: 'TRUCK-0005', description: 'Updated Desc' };

        mockPatch.mockResolvedValue({ data: mockResponse });

        await service.updatePhysicalResource(id, request);

        expect(mockPatch).toHaveBeenCalledWith(`/api/PhysicalResource/update/${id}`, request);
    });
});