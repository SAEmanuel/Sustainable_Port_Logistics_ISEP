import { describe, it, expect } from "vitest";
import {
    mapToQualificationDomain,
    mapToCreateQualificationRequest,
    mapToUpdateQualificationRequest
} from "../mappers/qualificationMapper";

describe('Qualification Mapper', () => {
    it('deve mapear a resposta da API para o domínio Qualification corretamente', () => {
        const apiResponse = {
            id: 101,
            code: 'ISO9001',
            name: 'Sistema de Gestão de Qualidade',
            extra_field: 'ignored'
        };

        const result = mapToQualificationDomain(apiResponse);

        expect(result).toEqual({
            id: '101',
            code: 'ISO9001',
            name: 'Sistema de Gestão de Qualidade',
        });
        expect(typeof result.id).toBe('string');
    });

    it('deve mapear dados parciais para CreateQualificationRequest', () => {
        const domainData = { name: 'New Qual', code: 'NQ1' };
        const result = mapToCreateQualificationRequest(domainData);
        expect(result).toEqual({ name: 'New Qual', code: 'NQ1' });
    });

    it('deve mapear dados parciais para UpdateQualificationRequest', () => {
        const domainData = { name: 'Updated Name', code: 'UC1' };
        const result = mapToUpdateQualificationRequest(domainData);
        expect(result).toEqual({ name: 'Updated Name', code: 'UC1' });
    });
});