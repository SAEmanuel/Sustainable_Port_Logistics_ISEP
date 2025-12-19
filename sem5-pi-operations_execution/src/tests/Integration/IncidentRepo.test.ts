import 'reflect-metadata';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// --- Imports de Infraestrutura e Domínio ---
import IncidentRepo from '../../repos/incidentRepo';
import IncidentSchema from '../../persistence/schemas/incidentSchema';
import IncidentMap from '../../mappers/IncidentMap';
import { Incident } from '../../domain/incident/incident';
import { UniqueEntityID } from '../../core/domain/UniqueEntityID';
import { Severity } from '../../domain/incidentTypes/severity';
import { ImpactMode } from '../../domain/incident/impactMode';

describe('IncidentRepo Integration', () => {
    let mongoServer: MongoMemoryServer;
    let repo: IncidentRepo;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);

        const loggerMock = {
            debug: () => {},
            info: () => {},
            error: () => {},
            warn: () => {}
        };

        const mapper = new IncidentMap();

        repo = new IncidentRepo(
            IncidentSchema as any,
            mapper,
            loggerMock as any
        );
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await IncidentSchema.deleteMany({});
    });

    // Helper uses Valid Code Format: INC-YYYY-NNNNN
    const createIncidentDomain = (code: string, active: boolean, vveList: string[] = ['VVE-DEFAULT']) => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = active ? null : new Date('2024-01-01T12:00:00Z');

        return Incident.create({
            code: code,
            incidentTypeCode: 'T-INC001',
            vveList: vveList,
            startTime: startTime,
            endTime: endTime,
            duration: null,
            severity: 'Major' as Severity,
            impactMode: 'Specific' as ImpactMode,
            description: `Integration Test ${code}`,
            createdByUser: 'tester@admin.com',
            upcomingWindowStartTime: null,
            upcomingWindowEndTime: null,
            createdAt: new Date(),
            updatedAt: null
        }, new UniqueEntityID());
    };

    // =========================================================
    // 1. Basic CRUD
    // =========================================================
    describe('Basic Persistence', () => {
        it('should save and retrieve an Incident by Code', async () => {
            const code = 'INC-2024-00001';
            const incident = createIncidentDomain(code, true);

            await repo.save(incident);

            const found = await repo.findByCode(code);

            expect(found).not.toBeNull();
            expect(found!.code).toBe(code);
            // Verify data properties since isActive() might fail if mapping is partial
            expect(found!.endTime).toBeNull();
        });

        it('should return null if code does not exist', async () => {
            const found = await repo.findByCode('INC-2099-99999');
            expect(found).toBeNull();
        });

        it('should update an existing incident', async () => {
            const code = 'INC-2024-00002';
            const incident = createIncidentDomain(code, true);
            await repo.save(incident);

            incident.changeDescription('Updated Description');
            incident.markAsResolved();

            await repo.save(incident);

            const updated = await repo.findByCode(code);
            expect(updated!.description).toBe('Updated Description');
            expect(updated!.endTime).not.toBeNull();
        });
    });

    // =========================================================
    // 2. Status Queries
    // =========================================================
    describe('Status Queries', () => {
        beforeEach(async () => {
            // Using Valid Codes
            await repo.save(createIncidentDomain('INC-2024-00010', true)); // Active
            await repo.save(createIncidentDomain('INC-2024-00020', true)); // Active
            await repo.save(createIncidentDomain('INC-2024-00030', false)); // Resolved
        });

        it('getActiveIncidents: should return only incidents with endTime = null', async () => {
            const results = await repo.getActiveIncidents();

            expect(results).toHaveLength(2);
            const codes = results.map(i => i.code).sort();
            expect(codes).toEqual(['INC-2024-00010', 'INC-2024-00020']);
        });

        it('getResolvedIncidents: should return only incidents with endTime != null', async () => {
            const results = await repo.getResolvedIncidents();

            expect(results).toHaveLength(1);
            expect(results[0].code).toBe('INC-2024-00030');
        });
    });

    // =========================================================
    // 3. Advanced Filtering
    // =========================================================
    describe('Advanced Filtering', () => {

        it('getByDataRange: should find incidents started within range', async () => {
            const createWithDate = (code: string, dateStr: string) => {
                const i = createIncidentDomain(code, true);
                i.changeStartTime(new Date(dateStr));
                return i;
            };

            await repo.save(createWithDate('INC-2024-00001', '2024-01-15T10:00:00Z'));
            await repo.save(createWithDate('INC-2024-00002', '2024-02-15T10:00:00Z')); // Target
            await repo.save(createWithDate('INC-2024-00003', '2024-03-15T10:00:00Z'));

            const start = new Date('2024-02-01');
            const end = new Date('2024-02-28');

            const results = await repo.getByDataRange(start, end);

            expect(results).toHaveLength(1);
            expect(results[0].code).toBe('INC-2024-00002');
        });
    });

    // =========================================================
    // 4. Delete
    // =========================================================
    describe('Delete', () => {
        it('should delete an incident by code', async () => {
            const code = 'INC-2024-99999';
            const incident = createIncidentDomain(code, true);
            await repo.save(incident);

            expect(await repo.findByCode(code)).not.toBeNull();

            await repo.deleteIncident(code);

            expect(await repo.findByCode(code)).toBeNull();
        });
    });
});