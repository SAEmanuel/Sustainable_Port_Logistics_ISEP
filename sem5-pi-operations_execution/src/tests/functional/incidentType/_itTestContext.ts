import { vi } from "vitest";

export function createItTestContext(ServiceClass: any, ControllerClass: any) {
    const repoMock = {
        // Repo base (se existir no teu Repo<T>)
        exists: vi.fn(),
        save: vi.fn(),

        // Métodos usados no IncidentTypeService
        getAllAsyn: vi.fn(),
        findByCode: vi.fn(),
        findByName: vi.fn(),
        getRootTypes: vi.fn(),
        getDirectChilds: vi.fn(),
        getSubTreeFromParentNode: vi.fn(),
        removeType: vi.fn(),
    };

    const mapperMock = {
        toDTO: vi.fn(),
    };

    const loggerMock = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    };

    const service = new ServiceClass(
        repoMock as any,
        mapperMock as any,
        loggerMock as any
    );

    const controller = new ControllerClass(service, loggerMock as any);

    const mockRes = () => ({
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        send: vi.fn(),
    });

    return {
        repoMock,
        mapperMock,
        loggerMock,
        service,
        controller,
        mockRes,
    };
}
