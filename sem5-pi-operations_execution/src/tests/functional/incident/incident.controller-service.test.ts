import { describe, it, expect, beforeEach, vi } from "vitest";

import { createIncidentTestContext } from "./_incidentTestContext";

import IncidentService from "../../../services/incidentService";

import CreateIncidentController from "../../../controllers/incident/createIncidentController";
import UpdateIncidentController from "../../../controllers/incident/updateIncidentController";
import DeleteIncidentController from "../../../controllers/incident/deleteIncidentController";
import GetAllIncidentsController from "../../../controllers/incident/getAllIncidentsController";
import GetIncidentByCodeController from "../../../controllers/incident/getIncidentByCodeController";
import GetIncidentsByVVEController from "../../../controllers/incident/getIncidentsByVVEController";
import GetIncidentsBySeverityController from "../../../controllers/incident/getIncidentsBySeverityController";
import GetIncidentsByDataRangeController from "../../../controllers/incident/getIncidentsByDataRangeController";
import GetActiveIncidentsController from "../../../controllers/incident/getActiveIncidentsController";
import GetResolvedIncidentsController from "../../../controllers/incident/getResolvedIncidentsController";
import MarkIncidentResolvedController from "../../../controllers/incident/markIncidentResolvedController";
import AddVVEToIncidentController from "../../../controllers/incident/addVVEToIncidentController";
import RemoveVVEFromIncidentController from "../../../controllers/incident/removeVVEFromIncidentController";
import UpdateListsVVEsController from "../../../controllers/incident/updateListsVVEsController";

import { Incident } from "../../../domain/incident/incident";
import { ImpactMode } from "../../../domain/incident/impactMode";
import { Severity } from "../../../domain/incidentTypes/severity";

function makeVve(code = "VVE1") {
    return { code: { value: code } };
}

function makeIncidentDomain(overrides: Partial<any> = {}) {
    const now = new Date("2025-01-10T10:00:00Z");
    const start = overrides.startTime ?? new Date("2025-01-10T08:00:00Z");

    return Incident.create({
        code: overrides.code ?? "INC-2025-00001",
        incidentTypeCode: overrides.incidentTypeCode ?? "T-INC001",
        vveList: overrides.vveList ?? ["VVE1"],
        startTime: start,
        endTime: overrides.endTime ?? null,
        duration: null,
        severity: overrides.severity ?? Severity.Minor,
        impactMode: overrides.impactMode ?? ImpactMode.Specific,
        description: overrides.description ?? "desc",
        createdByUser: overrides.createdByUser ?? "user",
        upcomingWindowStartTime: overrides.upcomingWindowStartTime ?? null,
        upcomingWindowEndTime: overrides.upcomingWindowEndTime ?? null,
        createdAt: overrides.createdAt ?? now,
        updatedAt: null,
    });
}

function makeDTO(overrides: Partial<any> = {}) {
    return {
        code: overrides.code ?? "INC-2025-00001",
        incidentTypeCode: overrides.incidentTypeCode ?? "T-INC001",
        vveList: overrides.vveList ?? ["VVE1"],
        startTime: overrides.startTime ?? new Date("2025-01-10T08:00:00Z"),
        endTime: overrides.endTime ?? null,
        duration: overrides.duration ?? null,
        severity: overrides.severity ?? "Minor",
        impactMode: overrides.impactMode ?? "Specific",
        description: overrides.description ?? "desc",
        createdByUser: overrides.createdByUser ?? "user",
        upcomingWindowStartTime: overrides.upcomingWindowStartTime ?? null,
        upcomingWindowEndTime: overrides.upcomingWindowEndTime ?? null,
    };
}

describe("Incident | Controller + Service (functional style)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------
    // CREATE
    // -------------------------
    describe("CreateIncidentController + IncidentService", () => {


        it("should CREATE -> 400 when Incident already exists", async () => {
            const { incidentRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, CreateIncidentController);

            incidentRepoMock.findByCode.mockResolvedValue(makeIncidentDomain());

            const req = { body: makeDTO() };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should CREATE -> 400 when IncidentType does NOT exist", async () => {
            const { incidentRepoMock, incidentTypeRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, CreateIncidentController);

            incidentRepoMock.findByCode.mockResolvedValue(null);
            incidentTypeRepoMock.findByCode.mockResolvedValue(null);

            const req = { body: makeDTO({ incidentTypeCode: "T-INC999" }) };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should CREATE (Upcoming) -> 400 if window times missing", async () => {
            const { incidentRepoMock, incidentTypeRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, CreateIncidentController);

            incidentRepoMock.findByCode.mockResolvedValue(null);
            incidentTypeRepoMock.findByCode.mockResolvedValue({ code: "T-INC001" });

            const req = { body: makeDTO({ impactMode: "Upcoming", upcomingWindowStartTime: null, upcomingWindowEndTime: null }) };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // -------------------------
    // UPDATE
    // -------------------------
    describe("UpdateIncidentController + IncidentService", () => {

        it("should UPDATE -> 400 when Incident not found", async () => {
            const { incidentRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, UpdateIncidentController);

            incidentRepoMock.findByCode.mockResolvedValue(null);

            const req = { params: { code: "INC-2025-00001" }, body: makeDTO() };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // -------------------------
    // GET ALL
    // -------------------------
    describe("GetAllIncidentsController + IncidentService", () => {
        it("should GET ALL -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetAllIncidentsController);

            incidentRepoMock.findAll.mockResolvedValue([makeIncidentDomain(), makeIncidentDomain({ code: "INC-2025-00002" })]);
            incidentMapMock.toDTO.mockImplementation((i: any) => ({ code: i.code }));

            const req = {};
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(incidentRepoMock.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "INC-2025-00001" }, { code: "INC-2025-00002" }]);
        });
    });

    // -------------------------
    // GET BY CODE
    // -------------------------
    describe("GetIncidentByCodeController + IncidentService", () => {
        it("should GET BY CODE -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetIncidentByCodeController);

            incidentRepoMock.findByCode.mockResolvedValue(makeIncidentDomain());
            incidentMapMock.toDTO.mockReturnValue({ code: "INC-2025-00001" });

            const req = { params: { code: "INC-2025-00001" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ code: "INC-2025-00001" });
        });

        it("should GET BY CODE -> 400 when not found", async () => {
            const { incidentRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetIncidentByCodeController);

            incidentRepoMock.findByCode.mockResolvedValue(null);

            const req = { params: { code: "INC-2025-99999" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // -------------------------
    // GET BY VVE
    // -------------------------
    describe("GetIncidentsByVVEController + IncidentService", () => {
        it("should GET BY VVE -> 400 when VVE does not exist", async () => {
            const { vveRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetIncidentsByVVEController);

            vveRepoMock.findByCode.mockResolvedValue(null);

            const req = { params: { vveCode: "VVE404" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // -------------------------
    // GET BY SEVERITY
    // -------------------------
    describe("GetIncidentsBySeverityController + IncidentService", () => {
        it("should GET BY SEVERITY -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetIncidentsBySeverityController);

            incidentRepoMock.getBySeverity.mockResolvedValue([makeIncidentDomain({ severity: Severity.Critical })]);
            incidentMapMock.toDTO.mockImplementation((i: any) => ({ code: i.code, severity: i.severity }));

            const req = { query: { severity: "Critical" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(incidentRepoMock.getBySeverity).toHaveBeenCalledWith("Critical");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "INC-2025-00001", severity: "Critical" }]);
        });
    });

    // -------------------------
    // GET BY DATE RANGE
    // -------------------------
    describe("GetIncidentsByDataRangeController + IncidentService", () => {
        it("should GET BY DATE RANGE -> 400 if invalid dates", async () => {
            const { controller, mockRes } =
                createIncidentTestContext(IncidentService, GetIncidentsByDataRangeController);

            const req = { query: { start: "invalid", end: "invalid" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should GET BY DATE RANGE -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetIncidentsByDataRangeController);

            incidentRepoMock.getByDataRange.mockResolvedValue([makeIncidentDomain()]);
            incidentMapMock.toDTO.mockImplementation((i: any) => ({ code: i.code }));

            const req = {
                query: {
                    start: "2025-01-01T00:00:00Z",
                    end: "2025-01-31T23:59:59Z",
                },
            };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(incidentRepoMock.getByDataRange).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "INC-2025-00001" }]);
        });
    });

    // -------------------------
    // ACTIVE / RESOLVED
    // -------------------------
    describe("GetActive/Resolved Controllers + IncidentService", () => {
        it("should GET ACTIVE -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetActiveIncidentsController);

            incidentRepoMock.getActiveIncidents.mockResolvedValue([makeIncidentDomain({ endTime: null })]);
            incidentMapMock.toDTO.mockImplementation((i: any) => ({ code: i.code }));

            const req = {};
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "INC-2025-00001" }]);
        });

        it("should GET RESOLVED -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, GetResolvedIncidentsController);

            incidentRepoMock.getResolvedIncidents.mockResolvedValue([
                makeIncidentDomain({ endTime: new Date("2025-01-10T09:00:00Z") }),
            ]);
            incidentMapMock.toDTO.mockImplementation((i: any) => ({ code: i.code }));

            const req = {};
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ code: "INC-2025-00001" }]);
        });
    });

    // -------------------------
    // MARK AS RESOLVED
    // -------------------------
    describe("MarkIncidentResolvedController + IncidentService", () => {
        it("should MARK RESOLVED -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, MarkIncidentResolvedController);

            vi.useFakeTimers();
            vi.setSystemTime(new Date("2025-01-10T10:00:00Z"));

            const existing = makeIncidentDomain({ startTime: new Date("2025-01-10T08:00:00Z"), endTime: null });
            incidentRepoMock.findByCode.mockResolvedValue(existing);
            incidentRepoMock.save.mockResolvedValue(existing);
            incidentMapMock.toDTO.mockReturnValue({ code: "INC-2025-00001" });

            const req = { params: { code: "INC-2025-00001" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(incidentRepoMock.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);

            vi.useRealTimers();
        });

        it("should MARK RESOLVED -> 400 when startTime is in the future", async () => {
            const { incidentRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, MarkIncidentResolvedController);

            const future = makeIncidentDomain({ startTime: new Date("2099-01-01T10:00:00Z"), endTime: null });
            incidentRepoMock.findByCode.mockResolvedValue(future);

            const req = { params: { code: "INC-2025-00001" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // -------------------------
    // ADD / REMOVE VVE
    // -------------------------
    describe("Add/Remove VVE Controllers + IncidentService", () => {

        it("should REMOVE VVE -> 200", async () => {
            const { incidentRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, RemoveVVEFromIncidentController);

            const existing = makeIncidentDomain({ impactMode: ImpactMode.Specific, vveList: ["VVE1", "VVE2"] });
            incidentRepoMock.findByCode.mockResolvedValue(existing);
            incidentRepoMock.save.mockResolvedValue(existing);

            incidentMapMock.toDTO.mockReturnValue({ code: "INC-2025-00001", vveList: ["VVE1"] });

            const req = { params: { code: "INC-2025-00001", vveCode: "VVE2" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(incidentRepoMock.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // -------------------------
    // UPDATE LISTS OF VVEs
    // -------------------------
    describe("UpdateListsVVEsController + IncidentService", () => {
        it("should UPDATE LISTS -> 200 for AllOnGoing", async () => {
            const { incidentRepoMock, vveRepoMock, incidentMapMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, UpdateListsVVEsController);

            const existing = makeIncidentDomain({ impactMode: ImpactMode.AllOnGoing, vveList: [] });
            incidentRepoMock.findByCode.mockResolvedValue(existing);

            vveRepoMock.findAll.mockResolvedValue([makeVve("VVE10"), makeVve("VVE11")]);

            incidentRepoMock.save.mockResolvedValue(existing);
            incidentMapMock.toDTO.mockReturnValue({ code: "INC-2025-00001", vveList: ["VVE10", "VVE11"] });

            const req = { params: { code: "INC-2025-00001" } };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(vveRepoMock.findAll).toHaveBeenCalled();
            expect(incidentRepoMock.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // -------------------------
    // DELETE
    // -------------------------
    describe("DeleteIncidentController + IncidentService", () => {
        it("should DELETE -> 400 if code missing", async () => {
            const { controller, mockRes } =
                createIncidentTestContext(IncidentService, DeleteIncidentController);

            const req = { params: {}, query: {} };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should DELETE -> 204 when exists", async () => {
            const { incidentRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, DeleteIncidentController);

            incidentRepoMock.findByCode.mockResolvedValue(makeIncidentDomain());
            incidentRepoMock.deleteIncident.mockResolvedValue(undefined);

            const req = { params: { code: "INC-2025-00001" }, query: {} };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(incidentRepoMock.deleteIncident).toHaveBeenCalledWith("INC-2025-00001");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("should DELETE -> 400 when incident not found", async () => {
            const { incidentRepoMock, controller, mockRes } =
                createIncidentTestContext(IncidentService, DeleteIncidentController);

            incidentRepoMock.findByCode.mockResolvedValue(null);

            const req = { params: { code: "INC-2025-40404" }, query: {} };
            const res = mockRes();

            await controller.execute(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
