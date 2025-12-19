import { describe, it, expect, beforeEach } from 'vitest';
import { Incident } from '../../domain/incident/incident'; // Adjust path
import { BusinessRuleValidationError } from '../../core/logic/BusinessRuleValidationError';
import { IncidentError } from '../../domain/incident/errors/incidentErrors';
import { Severity } from '../../domain/incidentTypes/severity'; // Adjust path or mock
import { ImpactMode } from '../../domain/incident/impactMode'; // Adjust path

describe('Incident Domain Entity', () => {

    // Helper: Valid default properties for a clean "Global" incident
    const validGlobalProps = {
        code: 'INC-2024-00001',
        incidentTypeCode: 'T-INC001',
        vveList: [] as string[],
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: null,
        duration: null,
        severity: Severity.Major, // Assuming Enum or String literal
        impactMode: ImpactMode.AllOnGoing, // Assuming 'AllOnGoing' / 'Global'
        description: 'Standard Incident',
        createdByUser: 'user@example.com',
        upcomingWindowStartTime: null,
        upcomingWindowEndTime: null,
        createdAt: new Date(),
        updatedAt: null
    };

    describe('create', () => {

        it('should create a valid Global Incident successfully', () => {
            const incident = Incident.create(validGlobalProps);

            expect(incident).toBeDefined();
            expect(incident.code).toBe(validGlobalProps.code);
            expect(incident.impactMode).toBe(ImpactMode.AllOnGoing);
            expect(incident.duration).toBeNull(); // Active incident
        });

        it('should fail if Code format is invalid', () => {
            const invalidCodes = ['INC-2024-1', 'INC-24-00001', 'BAD-CODE', 'inc-2024-00001'];

            invalidCodes.forEach(code => {
                const props = { ...validGlobalProps, code };
                expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
                try {
                    Incident.create(props);
                } catch (e: any) {
                    expect(e.code).toBe(IncidentError.InvalidCodeFormat);
                }
            });
        });

        it('should fail if IncidentTypeCode format is invalid', () => {
            const props = { ...validGlobalProps, incidentTypeCode: 'INVALID' };
            expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
        });

        it('should fail if required fields are null/undefined', () => {
            const propsMissingDesc = { ...validGlobalProps, description: null } as any;
            expect(() => Incident.create(propsMissingDesc)).toThrow(BusinessRuleValidationError);
        });

        // Time Validations
        it('should fail if EndTime is before StartTime', () => {
            const props = {
                ...validGlobalProps,
                startTime: new Date('2024-01-02T10:00:00Z'),
                endTime: new Date('2024-01-01T10:00:00Z') // Before Start
            };
            expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
        });

        it('should calculate duration automatically if EndTime is provided', () => {
            const start = new Date('2024-01-01T10:00:00Z');
            const end = new Date('2024-01-01T11:00:00Z'); // 1 hour later

            const props = {
                ...validGlobalProps,
                startTime: start,
                endTime: end
            };

            const incident = Incident.create(props);
            expect(incident.endTime).toEqual(end);
            expect(incident.duration).toBe(60); // 60 minutes
        });

        // Impact Mode: Specific
        it('should fail creating SPECIFIC mode incident with empty VVE list', () => {
            const props = {
                ...validGlobalProps,
                impactMode: ImpactMode.Specific,
                vveList: []
            };
            expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
        });

        it('should create SPECIFIC mode incident with valid VVE list', () => {
            const props = {
                ...validGlobalProps,
                impactMode: ImpactMode.Specific,
                vveList: ['VVE-123', 'VVE-456']
            };
            const incident = Incident.create(props);
            expect(incident.vveList).toHaveLength(2);
            expect(incident.impactMode).toBe(ImpactMode.Specific);
        });

        // Impact Mode: Upcoming
        it('should fail creating UPCOMING mode incident without Window Times', () => {
            const props = {
                ...validGlobalProps,
                impactMode: ImpactMode.Upcoming,
                upcomingWindowStartTime: null,
                upcomingWindowEndTime: null
            };
            expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
        });

        it('should fail if Upcoming Window is invalid (Start > End)', () => {
            const props = {
                ...validGlobalProps,
                impactMode: ImpactMode.Upcoming,
                upcomingWindowStartTime: new Date('2024-02-02'),
                upcomingWindowEndTime: new Date('2024-02-01') // End before Start
            };
            expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
        });

        it('should fail if Upcoming Window is before Incident Start Time', () => {
            const incidentStart = new Date('2024-05-01');
            const windowStart = new Date('2024-04-01'); // Before incident start

            const props = {
                ...validGlobalProps,
                startTime: incidentStart,
                impactMode: ImpactMode.Upcoming,
                upcomingWindowStartTime: windowStart,
                upcomingWindowEndTime: new Date('2024-06-01')
            };
            expect(() => Incident.create(props)).toThrow(BusinessRuleValidationError);
        });

        it('should create UPCOMING mode incident with valid windows', () => {
            const start = new Date('2024-01-01');
            const wStart = new Date('2024-01-02');
            const wEnd = new Date('2024-01-03');

            const props = {
                ...validGlobalProps,
                startTime: start,
                impactMode: ImpactMode.Upcoming,
                upcomingWindowStartTime: wStart,
                upcomingWindowEndTime: wEnd
            };

            const incident = Incident.create(props);
            expect(incident.upcomingWindowStartTime).toEqual(wStart);
            expect(incident.upcomingWindowEndTime).toEqual(wEnd);
        });
    });

    describe('Updates & Mutations', () => {
        let incident: Incident;

        beforeEach(() => {
            // Start with a standard active incident
            incident = Incident.create(validGlobalProps);
        });

        it('markAsResolved: should set endTime to now and compute duration', () => {
            // Mock Date.now to control time
            const now = new Date('2024-01-01T12:00:00Z');
            const originalDateNow = Date.now;
            Date.now = () => now.getTime();

            incident.markAsResolved();

            expect(incident.endTime).toEqual(now);
            expect(incident.duration).toBe(120); // 10:00 to 12:00 = 2 hours = 120m
            expect(incident.updatedAt).not.toBeNull();

            // Restore Date.now
            Date.now = originalDateNow;
        });

        it('changeStartTime: should update start time and re-validate windows', () => {
            const newStart = new Date('2023-12-31T10:00:00Z');
            incident.changeStartTime(newStart);
            expect(incident.startTime).toEqual(newStart);
        });

        it('changeStartTime: should fail if new start time is after existing end time', () => {
            // First resolve it
            const end = new Date('2024-01-01T11:00:00Z');
            // We can cheat via private/protected props via 'any' or create a resolved incident directly
            // Or define a method `changeEndTime` exposed publicly if your code allows (it is private in your class)
            // Assuming we use markAsResolved for this test scenario:

            // Let's create a resolved one directly for clarity
            const resolvedProps = {
                ...validGlobalProps,
                endTime: new Date('2024-01-01T12:00:00Z')
            };
            const resolvedIncident = Incident.create(resolvedProps);

            // Try to set Start Time AFTER the existing End Time
            const badStart = new Date('2024-01-01T13:00:00Z');
            expect(() => resolvedIncident.changeStartTime(badStart)).toThrow(BusinessRuleValidationError);
        });

        it('changeDescription: should update description', () => {
            const newDesc = "Updated Description";
            incident.changeDescription(newDesc);
            expect(incident.description).toBe(newDesc);
        });

        it('changeSeverity: should update severity', () => {
            incident.changeSeverity(Severity.Critical);
            expect(incident.severity).toBe(Severity.Critical);
        });

        describe('Impact Mode & VVE List Changes', () => {

            it('changeImpactMode: switching to SPECIFIC without VVEs should fail (if VVE list is currently empty)', () => {
                // incident has empty vveList by default in setup
                expect(() => incident.changeImpactMode(ImpactMode.Specific)).toThrow(BusinessRuleValidationError);
            });

            it('changeImpactMode: switching to SPECIFIC with VVEs already present should succeed', () => {
                incident.addAffectedVve("VVE-111"); // Prepare list first
                incident.changeImpactMode(ImpactMode.Specific);
                expect(incident.impactMode).toBe(ImpactMode.Specific);
            });

            it('changeImpactMode: switching to UPCOMING fails without setting windows first?', () => {
                // Your implementation validates windows inside changeImpactMode/create logic
                // If switch to UPCOMING, it calls validateUpcomingWindowRules
                // Since current instance has null windows, it should fail.
                expect(() => incident.changeImpactMode(ImpactMode.Upcoming)).toThrow(BusinessRuleValidationError);
            });

            it('addAffectedVve: should add unique VVEs', () => {
                incident.addAffectedVve("VVE-001");
                incident.addAffectedVve("VVE-002");
                incident.addAffectedVve("VVE-001"); // Duplicate

                expect(incident.vveList).toHaveLength(2); // Should dedup
                expect(incident.vveList).toContain("VVE-001");
                expect(incident.vveList).toContain("VVE-002");
            });

            it('addAffectedVve: should normalize strings', () => {
                incident.addAffectedVve("  VVE-SPACES  ");
                expect(incident.vveList).toContain("VVE-SPACES");
            });

            it('removeAffectedVve: should remove VVE', () => {
                incident.addAffectedVve("VVE-001");
                incident.addAffectedVve("VVE-002");

                incident.removeAffectedVve("VVE-001");
                expect(incident.vveList).toHaveLength(1);
                expect(incident.vveList[0]).toBe("VVE-002");
            });

            it('removeAffectedVve: should fail/throw if removing results in empty list for SPECIFIC mode', () => {
                // Setup specific mode
                incident.addAffectedVve("VVE-ONLY-ONE");
                incident.changeImpactMode(ImpactMode.Specific); // Allowed now

                // Try to remove the last one
                expect(() => incident.removeAffectedVve("VVE-ONLY-ONE")).toThrow(BusinessRuleValidationError);
            });
        });

        describe('Upcoming Windows', () => {
            it('changeUpComingWindowTimes: should fail if not in UPCOMING mode', () => {
                // Current mode is Global
                expect(() => incident.changeUpComingWindowTimes(new Date(), new Date())).toThrow(BusinessRuleValidationError);
            });

            it('changeUpComingWindowTimes: should update windows if in UPCOMING mode', () => {
                // Setup
                const props = {
                    ...validGlobalProps,
                    impactMode: ImpactMode.Upcoming,
                    upcomingWindowStartTime: new Date('2024-01-02'),
                    upcomingWindowEndTime: new Date('2024-01-03')
                };
                const upIncident = Incident.create(props);

                const newStart = new Date('2024-01-04');
                const newEnd = new Date('2024-01-05');

                upIncident.changeUpComingWindowTimes(newStart, newEnd);

                expect(upIncident.upcomingWindowStartTime).toEqual(newStart);
                expect(upIncident.upcomingWindowEndTime).toEqual(newEnd);
            });
        });
    });
});