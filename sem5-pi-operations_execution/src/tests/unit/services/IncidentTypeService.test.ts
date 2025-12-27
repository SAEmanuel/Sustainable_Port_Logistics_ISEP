import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncidentTypeService from "../../../services/incidentTypeService";


// Helper para criar um Mock da Entidade de Domínio
const createMockIncidentType = (code: string, parentCode: string | null = null) => ({
    code: code,
    props: { parent: parentCode },
    changeName: vi.fn(),
    changeDescription: vi.fn(),
    changeSeverity: vi.fn(),
    changeParent: vi.fn(),
});

describe('IncidentTypeService', () => {
    let service: IncidentTypeService;
    let repoMock: any;
    let loggerMock: any;
    let mapMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mocks das dependências
        repoMock = {
            findByCode: vi.fn(),
            findByName: vi.fn(),
            save: vi.fn(),
            getSubTreeFromParentNode: vi.fn(),
            getDirectChilds: vi.fn(),
            getRootTypes: vi.fn(),
            exists: vi.fn()
        };

        loggerMock = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        };

        mapMock = {
            toDTO: (item: any) => ({
                code: item.code,
                name: item.props?.name || 'Mapped Name',
                parentCode: item.props?.parent || null,
                severity: item.props?.severity || 'Minor'
            })
        };

        service = new IncidentTypeService(repoMock, mapMock, loggerMock);
    });

    // =========================================================================
    // CREATE
    // =========================================================================
    describe('createAsync', () => {
        const validDTO = {
            code: 'T-INC001',
            name: 'Fire',
            severity: 'Major',
            description: 'Description',
            parentCode: null
        };

        it('deve criar com sucesso se não existir', async () => {
            repoMock.findByCode.mockResolvedValue(null);
            repoMock.save.mockImplementation((item: any) => Promise.resolve(item));

            const result = await service.createAsync(validDTO as any);

            expect(result.isSuccess).toBe(true);
            expect(repoMock.findByCode).toHaveBeenCalledWith(validDTO.code);
            expect(repoMock.save).toHaveBeenCalled();
        });

        it('deve falhar se já existir (Duplicate)', async () => {
            repoMock.findByCode.mockResolvedValue({ code: 'T-INC001' });

            await expect(service.createAsync(validDTO as any))
                .rejects.toThrow(/Incident Type already exists/); // CORRIGIDO

            expect(repoMock.save).not.toHaveBeenCalled();
        });

        it('deve falhar se o Parent Code for fornecido mas não existir na BD', async () => {
            const dtoWithParent = { ...validDTO, parentCode: 'PARENT-999' };

            repoMock.findByCode.mockResolvedValueOnce(null); // código do próprio
            repoMock.findByCode.mockResolvedValueOnce(null); // código do pai

            await expect(service.createAsync(dtoWithParent as any))
                .rejects.toThrow(/Parent Incident Type not found/);
        });

        it('deve falhar se o Repo.save retornar null (Erro de Persistência)', async () => {
            repoMock.findByCode.mockResolvedValue(null);
            repoMock.save.mockResolvedValue(null);

            await expect(service.createAsync(validDTO as any))
                .rejects.toThrow(/Error saving Incident Type/);
        });
    });

    // =========================================================================
    // UPDATE
    // =========================================================================
    describe('updateAsync', () => {
        const targetCode = 'T-INC001';

        it('deve atualizar campos simples com sucesso', async () => {
            const domainItem = createMockIncidentType(targetCode);
            repoMock.findByCode.mockResolvedValue(domainItem);
            repoMock.save.mockResolvedValue(domainItem);

            const updateDTO = { name: 'New Name', description: 'New Desc', severity: 'Critical', parentCode: null };

            const result = await service.updateAsync(targetCode, updateDTO as any);

            expect(result.isSuccess).toBe(true);
            expect(domainItem.changeName).toHaveBeenCalledWith('New Name');
            expect(repoMock.save).toHaveBeenCalled();
        });

        it('deve falhar se o Incident Type não existir', async () => {
            repoMock.findByCode.mockResolvedValue(null);

            // CORRIGIDO: Agora espera a mensagem curta "Incident Type not found"
            await expect(service.updateAsync('MISSING', {} as any))
                .rejects.toThrow(/Incident Type not found/);
        });

        it('deve falhar se tentar ser pai de si mesmo (Self-Parenting)', async () => {
            const domainItem = createMockIncidentType(targetCode);
            repoMock.findByCode.mockResolvedValue(domainItem);

            const dto = { parentCode: targetCode, severity: 'Minor' };

            // CORRIGIDO: Agora espera "Invalid hierarchy"
            await expect(service.updateAsync(targetCode, dto as any))
                .rejects.toThrow(/Invalid hierarchy/);
        });

        it('deve falhar se o novo pai não existir', async () => {
            const domainItem = createMockIncidentType(targetCode);
            const newParent = 'T-INC999';

            repoMock.findByCode.mockResolvedValueOnce(domainItem);
            repoMock.findByCode.mockResolvedValueOnce(null); // pai não existe

            const dto = { parentCode: newParent, severity: 'Minor' };

            await expect(service.updateAsync(targetCode, dto as any))
                .rejects.toThrow(/Parent Incident Type not found/);
        });

        it('deve impedir Ciclos: Novo pai é descendente do item atual', async () => {
            const domainItem = createMockIncidentType(targetCode);
            const newParentCode = 'T-INC002';

            repoMock.findByCode.mockResolvedValueOnce(domainItem);
            repoMock.findByCode.mockResolvedValueOnce(createMockIncidentType(newParentCode));

            repoMock.getSubTreeFromParentNode.mockResolvedValue([
                { code: 'T-INC002' },
                { code: 'T-INC003' }
            ]);

            const dto = { parentCode: newParentCode, severity: 'Minor' };

            // CORRIGIDO: Agora espera "Invalid hierarchy"
            await expect(service.updateAsync(targetCode, dto as any))
                .rejects.toThrow(/Invalid hierarchy/);

            expect(repoMock.save).not.toHaveBeenCalled();
        });

        it('deve permitir mudar de pai se não houver ciclo', async () => {
            const domainItem = createMockIncidentType(targetCode);
            const newParentCode = 'T-ROOT';

            repoMock.findByCode.mockResolvedValueOnce(domainItem);
            repoMock.findByCode.mockResolvedValueOnce(createMockIncidentType(newParentCode));

            repoMock.getSubTreeFromParentNode.mockResolvedValue([]);
            repoMock.save.mockResolvedValue(domainItem);

            const dto = { parentCode: newParentCode, severity: 'Minor', name: 'Ok', description: 'Ok' };

            const result = await service.updateAsync(targetCode, dto as any);

            expect(result.isSuccess).toBe(true);
            expect(domainItem.changeParent).toHaveBeenCalledWith(newParentCode);
            expect(repoMock.save).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // QUERIES (Getters)
    // =========================================================================
    describe('getByCode', () => {
        it('deve retornar DTO se encontrado', async () => {
            const item = createMockIncidentType('T-INC001');
            repoMock.findByCode.mockResolvedValue(item);

            const result = await service.getByCode('T-INC001');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().code).toBe('T-INC001');
        });

        it('deve lançar erro se não encontrado', async () => {
            repoMock.findByCode.mockResolvedValue(null);

            // CORRIGIDO: Mensagem curta
            await expect(service.getByCode('MISSING'))
                .rejects.toThrow(/Incident Type not found/);
        });
    });

    describe('getByName', () => {
        it('deve retornar lista de DTOs', async () => {
            const list = [createMockIncidentType('A'), createMockIncidentType('B')];
            repoMock.findByName.mockResolvedValue(list);

            const result = await service.getByName('Fire');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(2);
        });
    });

    describe('getSubTreeFromParentNode', () => {
        it('deve retornar subárvore se o pai existir', async () => {
            repoMock.findByCode.mockResolvedValue(createMockIncidentType('PARENT'));
            repoMock.getSubTreeFromParentNode.mockResolvedValue([createMockIncidentType('CHILD')]);

            const result = await service.getSubTreeFromParentNode('PARENT');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(1);
        });

        it('deve lançar erro se o pai não existir', async () => {
            repoMock.findByCode.mockResolvedValue(null);

            // CORRIGIDO: Mensagem curta
            await expect(service.getSubTreeFromParentNode('MISSING'))
                .rejects.toThrow(/Parent Incident Type not found/);
        });
    });

    describe('getDirectChilds', () => {
        it('deve retornar filhos diretos se o pai existir', async () => {
            repoMock.findByCode.mockResolvedValue(createMockIncidentType('PARENT'));
            repoMock.getDirectChilds.mockResolvedValue([createMockIncidentType('CHILD')]);

            const result = await service.getDirectChilds('PARENT');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(1);
        });

        it('deve lançar erro se o pai não existir', async () => {
            repoMock.findByCode.mockResolvedValue(null);

            // CORRIGIDO: Mensagem curta
            await expect(service.getDirectChilds('MISSING'))
                .rejects.toThrow(/Parent Incident Type not found/);
        });
    });

    describe('getRootTypes', () => {
        it('deve retornar tipos raiz', async () => {
            repoMock.getRootTypes.mockResolvedValue([createMockIncidentType('ROOT')]);

            const result = await service.getRootTypes();

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(1);
        });
    });
});