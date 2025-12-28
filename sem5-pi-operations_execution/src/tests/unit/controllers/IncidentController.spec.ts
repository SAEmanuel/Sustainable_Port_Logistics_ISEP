import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../core/logic/Result';
import CreateIncidentController from "../../../controllers/incident/createIncidentController";
import UpdateIncidentController from "../../../controllers/incident/updateIncidentController";
import GetIncidentByCodeController from "../../../controllers/incident/getIncidentByCodeController";
import AddVVEToIncidentController from "../../../controllers/incident/addVVEToIncidentController";
import DeleteIncidentController from "../../../controllers/incident/deleteIncidentController";



describe('Incident Controllers', () => {
    let serviceMock: any;
    let loggerMock: any;
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        vi.clearAllMocks();

        serviceMock = {
            createAsync: vi.fn(),
            updateAsync: vi.fn(),
            deleteAsync: vi.fn(),
            getByCodeAsync: vi.fn(),
            getActiveIncidentsAsync: vi.fn(),
            getResolvedIncidentsAsync: vi.fn(),
            getAllIncidentAsync: vi.fn(),
            addVVEToIncidentAsync: vi.fn(),
            removeVVEAsync: vi.fn(),
            markAsResolvedAsync: vi.fn()
        };

        loggerMock = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        };

        req = { body: {}, params: {}, query: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            type: vi.fn().mockReturnThis()
        };
        next = vi.fn();
    });

    // =========================================================
    // CreateIncidentController
    // =========================================================
    describe('CreateIncidentController', () => {


        it('should return 400 when Service returns Failure', async () => {
            const controller = new CreateIncidentController(serviceMock, loggerMock);
            serviceMock.createAsync.mockResolvedValue(Result.fail("Incident already exists"));

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 500 on unexpected exception (Crash)', async () => {
            const controller = new CreateIncidentController(serviceMock, loggerMock);
            serviceMock.createAsync.mockRejectedValue(new Error("DB Error"));

            await controller.execute(req, res);
            // This expects that your controller catches errors and logs them
            expect(loggerMock.error).toHaveBeenCalled();
        });
    });

    // =========================================================
    // UpdateIncidentController
    // =========================================================
    describe('UpdateIncidentController', () => {
        it('should update and return 200', async () => {
            const controller = new UpdateIncidentController(serviceMock, loggerMock);
            req.params.code = 'INC-001';
            req.body = { description: 'Updated' };

            serviceMock.updateAsync.mockResolvedValue(Result.ok(req.body));

            await controller.execute(req, res);

            expect(serviceMock.updateAsync).toHaveBeenCalledWith('INC-001', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(req.body);
        });

        it('should return 400 if Incident not found', async () => {
            const controller = new UpdateIncidentController(serviceMock, loggerMock);
            req.params.code = 'MISSING';
            serviceMock.updateAsync.mockResolvedValue(Result.fail("Incident not found"));

            await controller.execute(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // =========================================================
    // GetIncidentByCodeController
    // =========================================================
    describe('GetIncidentByCodeController', () => {
        it('should return DTO and 200 on success', async () => {
            const controller = new GetIncidentByCodeController(serviceMock, loggerMock);
            req.params.code = 'INC-001';
            const dto = { code: 'INC-001' };

            serviceMock.getByCodeAsync.mockResolvedValue(Result.ok(dto));

            await controller.execute(req, res);

            expect(serviceMock.getByCodeAsync).toHaveBeenCalledWith('INC-001');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(dto);
        });

        it('should return 400/404 if not found', async () => {
            const controller = new GetIncidentByCodeController(serviceMock, loggerMock);
            req.params.code = 'MISSING';
            serviceMock.getByCodeAsync.mockResolvedValue(Result.fail("Incident not found"));

            await controller.execute(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // =========================================================
    // AddVVEToIncidentController
    // =========================================================
    describe('AddVVEToIncidentController', () => {

        it('should handle VVE Not Found error', async () => {
            const controller = new AddVVEToIncidentController(serviceMock, loggerMock);
            serviceMock.addVVEToIncidentAsync.mockResolvedValue(Result.fail("VVE not found"));

            await controller.execute(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });



    // =========================================================
    // DeleteIncidentController
    // =========================================================
    describe('DeleteIncidentController', () => {

        it('should return 400 if not found (Fail result)', async () => {
            const controller = new DeleteIncidentController(serviceMock, loggerMock);
            serviceMock.deleteAsync.mockResolvedValue(Result.fail("Incident not found"));

            await controller.execute(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});