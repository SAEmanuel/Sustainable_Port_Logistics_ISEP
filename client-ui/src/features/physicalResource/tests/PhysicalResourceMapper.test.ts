import { describe, it, expect } from "vitest";

import {
    mapToPhysicalResource,
    mapToCreatePhysicalResourceRequest,
    mapToUpdatePhysicalResourceRequest
} from "../mappers/physicalResourceMapper";

import { PhysicalResourceType, PhysicalResourceStatus } from "../domain/physicalResource";

describe('Physical Resource Mapper', () => {

    it('deve mapear a resposta da API para o domínio PhysicalResource corretamente', () => {
        const apiResponse = {
            id: "res-123",
            code: "STS-001",
            description: "Grua Principal",
            operationalCapacity: 500,
            setupTime: 30,
            physicalResourceType: "STSCrane",
            physicalResourceStatus: "Available",
            qualificationID: "qualif-001",
            extra_field: "ignored_by_mapper"
        };

        const result = mapToPhysicalResource(apiResponse);

        expect(result).toEqual({
            id: "res-123",
            code: { value: "STS-001" },
            description: "Grua Principal",
            operationalCapacity: 500,
            setupTime: 30,
            physicalResourceType: PhysicalResourceType.STSCrane,
            physicalResourceStatus: PhysicalResourceStatus.Available,
            qualificationID: "qualif-001"
        });
    });

    it('deve mapear dados para CreatePhysicalResourceRequest', () => {
        const formData = {
            description: "Nova Empilhadeira",
            operationalCapacity: 100,
            setupTime: 10,
            physicalResourceType: PhysicalResourceType.Forklift,
            qualificationCode: "Q-DRIVER"
        };

        const result = mapToCreatePhysicalResourceRequest(formData);

        expect(result).toEqual({
            description: "Nova Empilhadeira",
            operationalCapacity: 100,
            setupTime: 10,
            physicalResourceType: PhysicalResourceType.Forklift,
            qualificationCode: "Q-DRIVER"
        });
    });

    it('deve mapear dados parciais para UpdatePhysicalResourceRequest', () => {
        const updateData = {
            description: "Descrição Atualizada",
            operationalCapacity: 200,
            qualificationID: "Q-OLD"
        };

        const result = mapToUpdatePhysicalResourceRequest(updateData);

        expect(result).toEqual({
            description: "Descrição Atualizada",
            operationalCapacity: 200,
            setupTime: undefined,
            qualificationId: "Q-OLD"
        });
    });
});