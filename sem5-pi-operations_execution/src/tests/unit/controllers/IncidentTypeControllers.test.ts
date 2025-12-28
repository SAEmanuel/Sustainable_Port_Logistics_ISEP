import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateITController from "../../../controllers/incidentType/createdITController";
import {Result} from "../../../core/logic/Result";
import {BusinessRuleValidationError} from "../../../core/logic/BusinessRuleValidationError";
import UpdateITController from "../../../controllers/incidentType/updateITController";
import GetIncidentTypeDTO from "../../../controllers/incidentType/getITByCodeController";
import GetITByNameController from "../../../controllers/incidentType/getITByNameController";
import GetITDirectChildController from "../../../controllers/incidentType/getITDirectChildController";
import GetITSubTreeController from "../../../controllers/incidentType/getITSubTreeController";
import GetITRootTypesController from "../../../controllers/incidentType/getITRootController";

describe('IncidentType Controllers', () => {
    let serviceMock: any;
    let loggerMock: any;
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        // 1. Mock Service methods
        serviceMock = {
            createAsync: vi.fn(),
            updateAsync: vi.fn(),
            getByCode: vi.fn(),
            getByName: vi.fn(),
            getDirectChilds: vi.fn(),
            getRootTypes: vi.fn(),
            getSubTreeFromParentNode: vi.fn()
        };

        // 2. Mock Logger
        loggerMock = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        };

        // 3. Mock Express Request/Response
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
    // CreateITController
    // =========================================================
    describe('CreateITController', () => {
        it('should return 200/OK with result on success', async () => {
            const controller = new CreateITController(serviceMock, loggerMock);
            const dto = { code: 'T-001', name: 'Fire' };
            req.body = dto;

            serviceMock.createAsync.mockResolvedValue(Result.ok(dto));

            await controller.execute(req, res);

            expect(serviceMock.createAsync).toHaveBeenCalledWith(dto);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(dto);
        });

        it('should return 400 when BusinessRuleValidationError occurs', async () => {
            const controller = new CreateITController(serviceMock, loggerMock);

            // CORREÇÃO: Usar String ("ERROR_CODE") e apenas 2 argumentos
            serviceMock.createAsync.mockRejectedValue(
                new BusinessRuleValidationError("ALREADY_EXISTS", "Already exists")
            );

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Already exists" }));
        });

        it('should return 500 on unexpected error', async () => {
            const controller = new CreateITController(serviceMock, loggerMock);
            serviceMock.createAsync.mockRejectedValue(new Error("DB Explosion"));

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // =========================================================
    // UpdateITController
    // =========================================================
    describe('UpdateITController', () => {
        it('should update and return 200', async () => {
            const controller = new UpdateITController(serviceMock, loggerMock);
            req.params.code = 'T-001';
            req.body = { name: 'New Name' };

            serviceMock.updateAsync.mockResolvedValue(Result.ok(req.body));

            await controller.execute(req, res);

            expect(serviceMock.updateAsync).toHaveBeenCalledWith('T-001', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // =========================================================
    // GetIncidentTypeDTO (Get By Code)
    // =========================================================
    describe('GetIncidentTypeDTO', () => {
        it('should return dto by code (Success 200)', async () => {
            const controller = new GetIncidentTypeDTO(serviceMock, loggerMock);
            req.params.code = 'T-001';

            const expectedResult = { code: 'T-001', name: 'Fire' };
            serviceMock.getByCode.mockResolvedValue(Result.ok(expectedResult));

            await controller.execute(req, res);

            expect(serviceMock.getByCode).toHaveBeenCalledWith('T-001');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResult);
        });

        it('should return 400 when BusinessRuleValidationError occurs', async () => {
            const controller = new GetIncidentTypeDTO(serviceMock, loggerMock);
            req.params.code = 'MISSING';

            // CORREÇÃO: Usar String ("NOT_FOUND") em vez de número (404)
            serviceMock.getByCode.mockRejectedValue(
                new BusinessRuleValidationError("NOT_FOUND", "Incident Type not found")
            );

            await controller.execute(req, res);

            expect(loggerMock.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Incident Type not found" }));
        });

        it('should return 500 on unexpected error', async () => {
            const controller = new GetIncidentTypeDTO(serviceMock, loggerMock);
            req.params.code = 'T-001';

            serviceMock.getByCode.mockRejectedValue(new Error("Unexpected failure"));

            await controller.execute(req, res);

            expect(loggerMock.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // =========================================================
    // GetITByNameController
    // =========================================================
    describe('GetITByNameController', () => {
        it('should return list by name (Success 200)', async () => {
            const controller = new GetITByNameController(serviceMock, loggerMock);
            req.query.name = 'Fire';

            const expectedList = [{ code: 'T-001', name: 'Fire' }];
            serviceMock.getByName.mockResolvedValue(Result.ok(expectedList));

            await controller.execute(req, res);

            expect(serviceMock.getByName).toHaveBeenCalledWith('Fire');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedList);
        });

        it('should return 400 when BusinessRuleValidationError occurs', async () => {
            const controller = new GetITByNameController(serviceMock, loggerMock);
            req.query.name = 'InvalidName';

            // CORREÇÃO: Usar String ("INVALID_FORMAT") em vez de número (400)
            serviceMock.getByName.mockRejectedValue(
                new BusinessRuleValidationError("INVALID_FORMAT", "Invalid name format")
            );

            await controller.execute(req, res);

            expect(loggerMock.warn).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid name format" }));
        });

        it('should return 500 on unexpected error', async () => {
            const controller = new GetITByNameController(serviceMock, loggerMock);
            req.query.name = 'Fire';

            serviceMock.getByName.mockRejectedValue(new Error("DB Connection Lost"));

            await controller.execute(req, res);

            expect(loggerMock.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // =========================================================
    // GetITDirectChildController
    // =========================================================
    describe('GetITDirectChildController', () => {
        it('should handle parentCode from params', async () => {
            const controller = new GetITDirectChildController(serviceMock, loggerMock);
            req.params.code = 'PARENT';

            serviceMock.getDirectChilds.mockResolvedValue(Result.ok([]));

            await controller.execute(req, res);

            expect(serviceMock.getDirectChilds).toHaveBeenCalledWith('PARENT');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if no code provided', async () => {
            const controller = new GetITDirectChildController(serviceMock, loggerMock);
            req.params = {};
            req.query = {};

            await controller.execute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "parentCode is required" }));
        });
    });

    // =========================================================
    // GetITSubTreeController
    // =========================================================
    describe('GetITSubTreeController', () => {
        it('should call getSubTreeFromParentNode', async () => {
            const controller = new GetITSubTreeController(serviceMock, loggerMock);
            req.params.code = 'ROOT';

            serviceMock.getSubTreeFromParentNode.mockResolvedValue(Result.ok(['Child1', 'Child2']));

            await controller.execute(req, res);

            expect(serviceMock.getSubTreeFromParentNode).toHaveBeenCalledWith('ROOT');
            expect(res.json).toHaveBeenCalledWith(['Child1', 'Child2']);
        });
    });

    // =========================================================
    // GetITRootTypesController
    // =========================================================
    describe('GetITRootTypesController', () => {
        it('should return root types', async () => {
            const controller = new GetITRootTypesController(serviceMock, loggerMock);
            serviceMock.getRootTypes.mockResolvedValue(Result.ok([]));

            await controller.execute(req, res);

            expect(serviceMock.getRootTypes).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});