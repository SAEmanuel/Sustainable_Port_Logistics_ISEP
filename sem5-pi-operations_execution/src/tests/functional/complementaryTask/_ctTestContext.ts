import { vi } from "vitest";

export function createCtTestContext(ServiceClass: any, ControllerClass: any) {

    const repoMock = {
        getNextSequenceNumber: vi.fn(),
        save: vi.fn(),
        findAll: vi.fn(),
        findCompleted: vi.fn(),
        findByCategory: vi.fn(),
        findByCode: vi.fn(),
        findByStaff: vi.fn(),
        findByVve: vi.fn(),
        findScheduled: vi.fn(),
        findInProgress: vi.fn(),
        findInRange: vi.fn()
    };

    const ctcRepoMock = {
        findById: vi.fn(),
        findByCode: vi.fn()
    };

    const vveRepoMock = {
        findById: vi.fn(),
        findByCode: vi.fn()
    };

    const mapperMock = {
        toDTO: vi.fn()
    };

    const loggerMock = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
    };

    const service = new ServiceClass(
        repoMock as any,
        ctcRepoMock as any,
        vveRepoMock as any,
        mapperMock as any,
        loggerMock as any
    );

    const controller = new ControllerClass(service, loggerMock as any);

    const mockRes = () => ({
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
    });

    return {
        repoMock,
        ctcRepoMock,
        vveRepoMock,
        mapperMock,
        loggerMock,
        service,
        controller,
        mockRes
    };
}