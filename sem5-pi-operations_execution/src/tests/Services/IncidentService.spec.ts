import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncidentService from '../../services/incidentService';

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
        // ... other props
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

    // Valid formats based on Domain Logic
    // Incident Code: INC-YYYY-NNNNN (5 digits)
    // VVE Code: VVE + Year(4) + Seq(6) (e.g., VVE2024000001)
    const VALID_VVE_CODE = 'VVE2024000001';

    const validDTO = {
        code: 'INC-2024-00001', // Fixed: Added padding to match regex
        incidentTypeCode: 'T-INC001',
        vveList: [VALID_VVE_CODE], // Fixed: Used valid VVE format
        startTime: new Date(),
        endTime: null,
        severity: 'Major',
        impactMode: 'Specific',
        description: 'Desc',
        createdByUser: 'User',
        upcomingWindowStartTime: null,
        upcomingWindowEndTime: null
    };

    // =========================================================================
    // CREATE
    // =========================================================================
    describe('createAsync', () => {

        it('should create successfully (Specific mode)', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({ code: 'T-INC001' });

            // Mock VVE Repo to return true for valid code
            mockVVERepo.findByCode.mockResolvedValue({ code: VALID_VVE_CODE });

            mockIncidentRepo.save.mockImplementation((inc) => Promise.resolve(inc));

            const result = await service.createAsync(validDTO as any);

            expect(result.isSuccess).toBe(true);
            expect(mockIncidentRepo.save).toHaveBeenCalled();
        });

        it('should fail if Incident Code already exists', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue({ code: 'INC-2024-00001' });

            const result = await service.createAsync(validDTO as any);
            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Incident already exists/);
        });

        it('should fail if Incident Type does not exist', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue(null);

            const result = await service.createAsync(validDTO as any);
            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Incident Type dont exists/);
        });

        it('should fail if Specific mode has empty VVE list', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({});

            const invalidDTO = { ...validDTO, vveList: [] };

            const result = await service.createAsync(invalidDTO as any);
            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Invalid number of VVE/);
        });

        it('should handle AllOnGoing mode correctly', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({});
            // Mock objects needs an ID that converts to a string
            mockVVERepo.findAll.mockResolvedValue([{ id: VALID_VVE_CODE }, { id: 'VVE2024000002' }]);
            mockIncidentRepo.save.mockImplementation((inc) => Promise.resolve(inc));

            const dto = { ...validDTO, impactMode: 'AllOnGoing', vveList: [] };

            const result = await service.createAsync(dto as any);

            expect(result.isSuccess).toBe(true);
            expect(mockVVERepo.findAll).toHaveBeenCalled();
        });

        it('should fail Upcoming mode without window dates', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(null);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({});

            const dto = {
                ...validDTO,
                impactMode: 'Upcoming',
                upcomingWindowStartTime: null
            };

            const result = await service.createAsync(dto as any);
            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Invalid parameters/);
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
                changeUpComingWindowTimes: vi.fn()
            };
        });

        it('should update successfully', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue(mockIncident);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({});
            // Ensure VVE check passes
            mockVVERepo.findByCode.mockResolvedValue({ code: VALID_VVE_CODE });
            mockIncidentRepo.save.mockResolvedValue(mockIncident);

            const dto = {
                code: targetCode,
                incidentTypeCode: 'T-INC001',
                vveList: [VALID_VVE_CODE],
                startTime: new Date(),
                severity: 'Minor',
                impactMode: 'Specific',
                description: 'New Desc'
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
            expect(result.error).toMatch(/Error updating Incident/);
        });

        it('should handle switch to Upcoming mode with windows', async () => {
            // Setup Mocks
            mockIncidentRepo.findByCode.mockResolvedValue(mockIncident);
            mockIncidentTypeRepo.findByCode.mockResolvedValue({});
            mockVVERepo.findByCode.mockResolvedValue({ code: VALID_VVE_CODE });
            mockIncidentRepo.save.mockResolvedValue(mockIncident);

            // Create a Full, Valid DTO
            const dto = {
                code: targetCode,
                incidentTypeCode: 'T-INC001',      // Required
                vveList: [VALID_VVE_CODE],         // Required for checkVVEsExist
                startTime: new Date(),             // Required
                severity: 'Major',                 // Required for Factory
                description: 'Switching to Upcoming', // Required
                impactMode: 'Upcoming',            // Target Mode
                upcomingWindowStartTime: new Date(),
                upcomingWindowEndTime: new Date()
            };

            const result = await service.updateAsync(targetCode, dto as any);

            expect(result.isSuccess).toBe(true);
            // Verify the specific logic for Upcoming mode was called
            expect(mockIncident.changeUpComingWindowTimes).toHaveBeenCalled();
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
            mockIncidentRepo.getActiveIncidents.mockResolvedValue([ { code: 'INC-1' } ]);
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
    // ACTIONS (VVE, Resolve)
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
            mockVVERepo.findByCode.mockResolvedValue({}); // Found
            mockIncidentRepo.save.mockResolvedValue(mockInc);

            // Use valid format in call
            const result = await service.addVVEToIncidentAsync('INC-1', VALID_VVE_CODE);

            expect(result.isSuccess).toBe(true);
            expect(mockVVERepo.findByCode).toHaveBeenCalled();
            expect(mockInc.addAffectedVve).toHaveBeenCalledWith(VALID_VVE_CODE);
        });

        it('should fail if VVE does not exist', async () => {
            mockIncidentRepo.findByCode.mockResolvedValue({});

            // We use a VALID format code, but we tell the Mock Repo it doesn't exist (returns null)
            // This ensures we fail on "NotFound" logic, not "InvalidFormat" logic
            mockVVERepo.findByCode.mockResolvedValue(null);

            const result = await service.addVVEToIncidentAsync('INC-1', VALID_VVE_CODE);

            expect(result.isFailure).toBe(true);
            expect(result.error).toMatch(/Error finding VVE/);
        });
    });
});