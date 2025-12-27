import { describe, it, expect ,beforeEach} from 'vitest';
import {IncidentType} from "../../../domain/incidentTypes/incidentType";
import {BusinessRuleValidationError} from "../../../core/logic/BusinessRuleValidationError";
import {IncidentTypeError} from "../../../domain/incidentTypes/errors/incidentTypeErrors";


// Mock simples para Severity se não for um enum exportado,
// ou usa os valores reais se tiveres acesso ao ficheiro.
const SeverityMock = {
    Minor: "Minor",
    Major: "Major",
    Critical: "Critical"
} as any;

describe('IncidentType Domain Entity', () => {

    // Dados base válidos para usar nos testes
    const validProps = {
        code: 'T-INC001',
        name: 'Fire',
        description: 'Fire incident',
        severity: SeverityMock.Major,
        parent: null,
        createdAt: new Date(),
        updatedAt: null
    };

    describe('create (creat)', () => {
        it('deve criar um IncidentType válido com sucesso', () => {
            const incident = IncidentType.creat(validProps);

            expect(incident).toBeDefined();
            expect(incident.code).toBe(validProps.code);
            expect(incident.name).toBe(validProps.name);
            expect(incident.severity).toBe(validProps.severity);
            expect(incident.parentCode).toBeNull();
        });

        it('deve criar um IncidentType com um Parent válido', () => {
            const propsWithParent = { ...validProps, parent: 'T-INC002' };
            const incident = IncidentType.creat(propsWithParent);

            expect(incident.parentCode).toBe('T-INC002');
        });

        it('deve falhar se o Code tiver formato inválido', () => {
            const invalidCodes = ['INC-001', 'T-INC1', 'T-INC1234', 't-inc001'];

            invalidCodes.forEach(code => {
                const props = { ...validProps, code };
                expect(() => IncidentType.creat(props)).toThrow(BusinessRuleValidationError);
            });
        });

        it('deve falhar se o Parent Code tiver formato inválido na criação', () => {
            const props = { ...validProps, parent: 'INVALID-CODE' };

            expect(() => IncidentType.creat(props)).toThrow(BusinessRuleValidationError);
            try {
                IncidentType.creat(props);
            } catch (e: any) {
                expect(e.code).toBe(IncidentTypeError.InvalidCodeFormat);
            }
        });

        it('deve falhar se propriedades obrigatórias forem nulas ou indefinidas', () => {
            // Teste para nome nulo/undefined (simulado com cast any para ultrapassar TS check)
            const propsMissingName = { ...validProps, name: null } as any;

            expect(() => IncidentType.creat(propsMissingName)).toThrow(BusinessRuleValidationError);
        });
    });

    describe('Updates & Logic', () => {
        let incident: IncidentType;

        beforeEach(() => {
            incident = IncidentType.creat(validProps);
        });

        it('changeName: deve atualizar o nome e a data de atualização', () => {
            const newName = 'Forest Fire';
            const oldUpdate = incident.updatedAt;

            // Pequeno delay para garantir diferença de timestamp
            const start = Date.now();
            while (Date.now() - start < 1) {}

            incident.changeName(newName);

            expect(incident.name).toBe(newName);
            expect(incident.updatedAt).not.toBe(oldUpdate);
            expect(incident.updatedAt).toBeInstanceOf(Date);
        });

        it('changeName: deve lançar erro se o nome for vazio', () => {
            expect(() => incident.changeName('')).toThrow(BusinessRuleValidationError);
            expect(() => incident.changeName(null as any)).toThrow(BusinessRuleValidationError);
        });

        it('changeDescription: deve atualizar a descrição', () => {
            const newDesc = 'Major forest fire';
            incident.changeDescription(newDesc);
            expect(incident.description).toBe(newDesc);
        });

        it('changeDescription: deve lançar erro se a descrição for vazia', () => {
            expect(() => incident.changeDescription('')).toThrow(BusinessRuleValidationError);
        });

        it('changeSeverity: deve atualizar a severidade', () => {
            incident.changeSeverity(SeverityMock.Critical);
            expect(incident.severity).toBe(SeverityMock.Critical);
        });

        describe('Parent Handling', () => {
            it('changeParent: deve atualizar para um código válido', () => {
                incident.changeParent('T-INC005');
                expect(incident.parentCode).toBe('T-INC005');
            });

            it('changeParent: deve limpar o parent se passar null ou string vazia', () => {
                // Definir um pai primeiro
                incident.changeParent('T-INC005');
                expect(incident.parentCode).toBe('T-INC005');

                // Testar null
                incident.changeParent(null);
                expect(incident.parentCode).toBeNull();

                // Testar string vazia
                incident.changeParent('T-INC005'); // reset
                incident.changeParent('');
                expect(incident.parentCode).toBeNull();
            });

            it('changeParent: deve lançar erro se o formato do código for inválido', () => {
                expect(() => incident.changeParent('BAD-FORMAT')).toThrow(BusinessRuleValidationError);
            });

            it('clearParent: deve definir o parent como null', () => {
                incident.changeParent('T-INC005');
                incident.clearParent();
                expect(incident.parentCode).toBeNull();
                expect(incident.updatedAt).toBeInstanceOf(Date);
            });
        });
    });
});