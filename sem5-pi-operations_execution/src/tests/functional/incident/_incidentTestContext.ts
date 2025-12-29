import { vi } from "vitest";

export function createIncidentTestContext(ServiceClass: any, ControllerClass: any) {
    const incidentRepoMock = {
        findByCode: vi.fn(),
        save: vi.fn(),
        deleteIncident: vi.fn(),
        findAll: vi.fn(),
        findByVVE: vi.fn(),
        getByDataRange: vi.fn(),
        getBySeverity: vi.fn(),
        getResolvedIncidents: vi.fn(),
        getActiveIncidents: vi.fn(),
    };

    const incidentTypeRepoMock = {
        findByCode: vi.fn(),
    };

    const vveRepoMock = {
        findByCode: vi.fn(),
        findAll: vi.fn(),
        findAllOngoing: vi.fn(), // opcional (o teu service faz fallback)
        getAllInDateRange: vi.fn(),
    };

    const incidentMapMock = {
        toDTO: vi.fn(),
    };

    const loggerMock = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    };

    const service = new ServiceClass(
        incidentRepoMock as any,
        incidentTypeRepoMock as any,
        vveRepoMock as any,
        incidentMapMock as any,
        loggerMock as any
    );

    const controller = new ControllerClass(service as any, loggerMock as any);

    const mockRes = () => ({
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
    });

    return {
        incidentRepoMock,
        incidentTypeRepoMock,
        vveRepoMock,
        incidentMapMock,
        loggerMock,
        service,
        controller,
        mockRes,
    };
}
