import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncidentService from "../../../services/incidentService";


// Mock Dependencies
const mockIncidentRepo = {
    save: vi.fn(),
    findByCode: vi.fn(),
    findByVVE: vi.fn(),
    findAll: vi.fn(),
    deleteIncident: vi.fn(),
    getByDataRange: vi.fn(),
    getBySeverity: vi.fn(),
    getResolvedIncidents: vi.fn(),
    getActiveIncidents: vi.fn(),
};

const mockIncidentTypeRepo = {
    findByCode: vi.fn(),
};

const mockVVERepo = {
    findByCode: vi.fn(),
    findAll: vi.fn(),
    getAllInDateRange: vi.fn(),
};

const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
};

const mockMap = {
    toDTO: (incident: any) => ({
        code: incident.code,
        vveList: incident.vveList,
    }),
};

describe('IncidentService', () => {
    let service: IncidentService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new IncidentService(
            mockIncidentRepo as any,
            mockIncidentTypeRepo as any,
            mockVVERepo as any,
            mockMap as any,
            mockLogger as any
        );
    });

    const VALID_VVE_CODE = 'VVE2024000001';

    const validDTO = {
        code: 'INC-2024-00001',
        incidentTypeCode: 'T-INC001',
        vveList: [VALID_VVE_CODE],
        startTime: new Date(),
        endTime: null,
        severity: 'Major',
        impactMode: 'Specific',
        description: 'Desc',
        createdByUser: 'User',
        upcomingWindowStartTime: null,
        upcomingWindowEndTime: null,
    };

    // =========================================================================
    // CREATE
    // =========================================================================
    describe('createAsync', () => {
        it('should create successfully (Specific mode)', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            // checkIfVVEsExist chama repoVVE.findByCode(vveCodeVO) -> basta devolver algo truthy
            mockVVERepo.findByCode.mockResolvedValue({});

            mockIncidentRepo.save.mockImplementation((inc) => Promise.resolve(inc));

            const result = await service.createAsync(validDTO as any);

            expect(result.isSuccess).toBe(true);
            expect(mockIncidentRepo.save).toHaveBeenCalled();
        });

        it('should fail if Incident Code already exists', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue({ code: 'INC-2024-00001' });

            const result = await service.createAsync(validDTO as any);

            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Incident already exists/i);
        });

        it('should fail if Incident Type does not exist', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue(null);

            const result = await service.createAsync(validDTO as any);

            expect(result.isFailure).toBe(true);
            // mensagem real do service:
            expect(result.error).toMatch(/Incident Type does not exist/i);
        });

        it('should fail if Specific mode has empty VVE list', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            const invalidDTO = { ...validDTO, vveList: [] };

            const result = await service.createAsync(invalidDTO as any);

            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Invalid number of VVE/i);
        });

        it('should handle AllOnGoing mode correctly', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            // IMPORTANTE: buildVveListForMode(AllOnGoing) faz v.code.value
            mockVVERepo.findAll.mockResolvedValue([
                { code: { value: VALID_VVE_CODE } },
                { code: { value: 'VVE2024000002' } },
            ]);

            mockIncidentRepo.save.mockImplementation((inc) => Promise.resolve(inc));

            const dto = { ...validDTO, impactMode: 'AllOnGoing', vveList: [] };

            const result = await service.createAsync(dto as any);

            expect(result.isSuccess).toBe(true);
            expect(mockVVERepo.findAll).toHaveBeenCalled();
        });

        it('should fail Upcoming mode without window dates', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            const dto = {
                ...validDTO,
                impactMode: 'Upcoming',
                upcomingWindowStartTime: null,
                upcomingWindowEndTime: null,
            };

            const result = await service.createAsync(dto as any);

            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Invalid parameters/i);
        });
    });

    // =========================================================================
    // UPDATE
    // =========================================================================
    describe('updateAsync', () => {
        const targetCode = 'INC-2024-00001';
        let mockIncident: any;

        beforeEach(() => {
            mockIncident = {
                code: targetCode,
                changeIncidentTypeCode: vi.fn(),
                changeVVEList: vi.fn(),
                changeStartTime: vi.fn(),
                changeSeverity: vi.fn(),
                changeImpactMode: vi.fn(),
                changeDescription: vi.fn(),
                changeUpComingWindowTimes: vi.fn(),
            };
        });

        it('should update successfully', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(mockIncident);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            // Se o mode for Specific, buildVveListForMode chama checkIfVVEsExist -> repoVVE.findByCode
            mockVVERepo.findByCode.mockResolvedValue({});

            mockIncidentRepo.save.mockResolvedValue(mockIncident);

            const dto = {
                code: targetCode,
                incidentTypeCode: 'T-INC001',
                vveList: [VALID_VVE_CODE],
                startTime: new Date(),
                severity: 'Minor',
                impactMode: 'Specific',
                description: 'New Desc',
            };

            const result = await service.updateAsync(targetCode, dto as any);

            expect(result.isSuccess).toBe(true);
            expect(mockIncident.changeDescription).toHaveBeenCalledWith('New Desc');
            expect(mockIncidentRepo.save).toHaveBeenCalled();
        });

        it('should fail if incident not found', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);

            const result = await service.updateAsync('MISSING', {} as any);

            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Error updating Incident/i);
        });

        it('should handle switch to Upcoming mode with windows', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(mockIncident);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            // IMPORTANTE: para Upcoming, buildVveListForMode chama getAllInDateRange e faz v.code.value
            mockVVERepo.getAllInDateRange.mockResolvedValue([{ code: { value: VALID_VVE_CODE } }]);

            mockIncidentRepo.save.mockResolvedValue(mockIncident);

            const dto = {
                code: targetCode,
                incidentTypeCode: 'T-INC001',
                vveList: [VALID_VVE_CODE], // não é usado no Upcoming list builder, mas pode existir no DTO
                startTime: new Date(),
                severity: 'Major',
                description: 'Switching to Upcoming',
                impactMode: 'Upcoming',
                upcomingWindowStartTime: new Date(),
                upcomingWindowEndTime: new Date(),
            };

            const result = await service.updateAsync(targetCode, dto as any);

            expect(result.isSuccess).toBe(true);
            expect(mockIncident.changeUpComingWindowTimes).toHaveBeenCalled();
            expect(mockVVERepo.getAllInDateRange).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // DELETE
    // =========================================================================
    describe('deleteAsync', () => {
        it('should delete if exists', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue({ code: 'INC-1' });

            const result = await service.deleteAsync('INC-1');

            expect(result.isSuccess).toBe(true);
        });

        it('should return fail if not found', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);

            const result = await service.deleteAsync('MISSING');

            expect(result.isFailure).toBe(true);
        });
    });

    // =========================================================================
    // QUERIES
    // =========================================================================
    describe('getByCode', () => {
        it('should return DTO if found', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue({ code: 'INC-1' });

            const result = await service.getByCodeAsync('INC-1');

            expect(result.isSuccess).toBe(true);
        });
    });

    describe('getActiveIncidents', () => {
        it('should return list', async () => {
            mockIncidentRepo.getActiveIncidents.mockResolvedValue([{ code: 'INC-1' }]);

            const result = await service.getActiveIncidentsAsync();

            expect(result.isSuccess).toBe(true);
        });
    });

    describe('getByDataRangeAsync', () => {
        it('should fail if Start > End', async () => {
            const start = new Date('2024-02-01');
            const end = new Date('2024-01-01');

            const result = await service.getByDataRangeAsync(start, end);

            expect(result.isFailure).toBe(true);
        });

        it('should return incidents if valid range', async () => {
            const start = new Date('2024-01-01');
            const end = new Date('2024-02-01');

            mockIncidentRepo.getByDataRange.mockResolvedValue([]);

            const result = await service.getByDataRangeAsync(start, end);

            expect(result.isSuccess).toBe(true);
        });
    });

    // =========================================================================
    // ACTIONS (Resolve, VVE)
    // =========================================================================
    describe('markAsResolvedAsync', () => {
        it('should mark resolved and save', async () => {
            const mockInc = { markAsResolved: vi.fn(), code: 'INC-1' };
            mockIncidentRepo.findByCode.mockResolvedValue(mockInc);
            mockIncidentRepo.save.mockResolvedValue(mockInc);

            const result = await service.markAsResolvedAsync('INC-1');

            expect(result.isSuccess).toBe(true);
        });
    });

    describe('addVVEToIncidentAsync', () => {
        it('should check VVE exist and add', async () => {
            const mockInc = { addAffectedVve: vi.fn(), code: 'INC-1' };
            mockIncidentRepo.findByCode.mockResolvedValue(mockInc);

            // checkIfVVEsExist -> repoVVE.findByCode(...) -> devolve truthy
            mockVVERepo.findByCode.mockResolvedValue({});

            mockIncidentRepo.save.mockResolvedValue(mockInc);

            const result = await service.addVVEToIncidentAsync('INC-1', VALID_VVE_CODE);

            expect(result.isSuccess).toBe(true);
            expect(mockVVERepo.findByCode).toHaveBeenCalled();
            expect(mockInc.addAffectedVve).toHaveBeenCalledWith(VALID_VVE_CODE);
        });

        it('should fail if VVE does not exist', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue({});
            mockVVERepo.findByCode.mockResolvedValue(null);

            const result = await service.addVVEToIncidentAsync('INC-1', VALID_VVE_CODE);

            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Error finding VVE/i);
        });
    });
});
