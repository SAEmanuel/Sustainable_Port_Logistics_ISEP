
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose, { Model, Document } from "mongoose";

import IncidentRepo from "../../../repos/incidentRepo";
import { Incident } from "../../../domain/incident/incident";
import { ImpactMode } from "../../../domain/incident/impactMode";
import { Severity } from "../../../domain/incidentTypes/severity";
import { IIncidentPersistence } from "../../../dataschema/IIncidentPersistence";

/**
 * Liga a Mongo apenas se ainda não houver ligação (compatível com setup global).
 * Só faz disconnect/stop se a ligação foi criada aqui.
 */
let mongoServer: any | null = null;
let ownsConnection = false;

async function ensureMongoConnection() {
    if (mongoose.connection.readyState === 1) return;

    const envUri = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (envUri) {
        await mongoose.connect(envUri);
        ownsConnection = true;
        return;
    }

    try {
        const mod = await import("mongodb-memory-server");
        const { MongoMemoryServer } = mod as any;
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        ownsConnection = true;
    } catch {
        // Se tens setup global a ligar mongoose, isto não é necessário.
        // Se não tens, instala mongodb-memory-server em devDependencies.
    }
}

const mockMap = {
    toPersistence: vi.fn((i: any) => ({
        id: i.id.toString(),
        code: i.code,
        incidentTypeCode: i.incidentTypeCode,
        vveList: i.vveList,
        startTime: i.startTime,
        endTime: i.endTime,
        duration: i.duration,
        severity: i.severity,
        impactMode: i.impactMode,
        description: i.description,
        createdByUser: i.createdByUser,
        upcomingWindowStartTime: i.upcomingWindowStartTime,
        upcomingWindowEndTime: i.upcomingWindowEndTime,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
    })),
    toDomain: vi.fn((r: any) => r as any),
};

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

describe("IncidentRepo", () => {
    let repo: IncidentRepo;
    let schema: Model<IIncidentPersistence & Document>;

    const SCHEMA_NAME = "Incident_Test";

    beforeAll(async () => {
        await ensureMongoConnection();
    });

    afterAll(async () => {
        // IMPORTANT: só desligar se foi esta suite que ligou
        if (!ownsConnection) return;

        try {
            if (mongoose.connection.readyState === 1) await mongoose.disconnect();
        } finally {
            if (mongoServer) await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        if (mongoose.models[SCHEMA_NAME]) {
            schema = mongoose.model(SCHEMA_NAME) as Model<IIncidentPersistence & Document>;
        } else {
            schema = mongoose.model<IIncidentPersistence & Document>(
                SCHEMA_NAME,
                new mongoose.Schema(
                    {
                        id: { type: String, unique: true, index: true, required: true },
                        code: { type: String, unique: true, index: true, required: true },
                        incidentTypeCode: { type: String, index: true, required: true },
                        vveList: { type: [String], default: [], index: true },
                        startTime: { type: Date, required: true },
                        endTime: { type: Date, required: false, default: null },
                        duration: { type: Number, required: false, default: null },
                        severity: { type: String, required: true },
                        impactMode: { type: String, required: true },
                        description: { type: String, required: true },
                        createdByUser: { type: String, required: true },
                        upcomingWindowStartTime: { type: Date, required: false, default: null },
                        upcomingWindowEndTime: { type: Date, required: false, default: null },
                        createdAt: { type: Date, required: true },
                        updatedAt: { type: Date, required: false, default: null },
                    },
                    { timestamps: false, versionKey: false }
                )
            );
        }

        await schema.deleteMany({});
        repo = new IncidentRepo(schema as any, mockMap as any, mockLogger as any);

        vi.clearAllMocks();
    });

    function makeIncident(overrides: Partial<any> = {}) {
        const sev: any = (Severity as any).Minor ?? "Minor";
        const mode: any = overrides.impactMode ?? ImpactMode.Specific;

        const startTime = overrides.startTime ?? new Date("2025-01-10T08:00:00Z");
        const endTime = overrides.endTime ?? null;

        return Incident.create({
            code: overrides.code ?? "INC-2025-00001",
            incidentTypeCode: overrides.incidentTypeCode ?? "T-INC001",
            vveList: overrides.vveList ?? ["VVE123"],
            startTime,
            endTime,
            duration: null,
            severity: overrides.severity ?? sev,
            impactMode: mode,
            description: overrides.description ?? "Test incident",
            createdByUser: overrides.createdByUser ?? "user@test",
            upcomingWindowStartTime: overrides.upcomingWindowStartTime ?? null,
            upcomingWindowEndTime: overrides.upcomingWindowEndTime ?? null,
            createdAt: overrides.createdAt ?? new Date("2025-01-10T08:00:00Z"),
            updatedAt: overrides.updatedAt ?? null,
        });
    }

    it("should save a new Incident", async () => {
        const inc = makeIncident();
        await repo.save(inc);

        const docs = await schema.find({});
        expect(docs.length).toBe(1);
        expect(docs[0].code).toBe("INC-2025-00001");
    });

    it("should update an existing Incident instead of creating duplicate", async () => {
        const inc = makeIncident();
        await repo.save(inc);

        inc.changeDescription("Updated description");
        await repo.save(inc);

        const docs = await schema.find({ code: "INC-2025-00001" });
        expect(docs.length).toBe(1);
        expect(docs[0].description).toBe("Updated description");
    });

    it("should return true when Incident exists", async () => {
        const inc = makeIncident();
        await repo.save(inc);

        const exists = await repo.exists(inc);
        expect(exists).toBe(true);
    });

    it("should return false when Incident does not exist", async () => {
        const inc = makeIncident();
        const exists = await repo.exists(inc);
        expect(exists).toBe(false);
    });

    it("should find Incident by code and call mapper.toDomain", async () => {
        const inc = makeIncident();
        await repo.save(inc);

        const found = await repo.findByCode("INC-2025-00001");
        expect(found).not.toBeNull();
        expect(mockMap.toDomain).toHaveBeenCalled();
    });

    it("should return null if Incident not found by code", async () => {
        const found = await repo.findByCode("INC-2025-99999");
        expect(found).toBeNull();
    });

    it("should find Incidents by VVE", async () => {
        await repo.save(makeIncident({ code: "INC-2025-00001", vveList: ["VVE123"] }));
        await repo.save(makeIncident({ code: "INC-2025-00002", vveList: ["VVE999"] }));

        const list = await repo.findByVVE("VVE123");
        expect(list.length).toBe(1);
        expect(mockMap.toDomain).toHaveBeenCalled();
    });

    it("should find all Incidents", async () => {
        await repo.save(makeIncident({ code: "INC-2025-00001" }));
        await repo.save(makeIncident({ code: "INC-2025-00002" }));

        const all = await repo.findAll();
        expect(all.length).toBe(2);
    });

    it("should delete an Incident by code", async () => {
        await repo.save(makeIncident({ code: "INC-2025-00010" }));

        await repo.deleteIncident("INC-2025-00010");

        const after = await schema.find({ code: "INC-2025-00010" });
        expect(after.length).toBe(0);
    });

    it("should log warn when deleting a non-existing Incident", async () => {
        await repo.deleteIncident("INC-2025-99999");
        expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should get active incidents (endTime is null)", async () => {
        await repo.save(makeIncident({ code: "INC-2025-00001", endTime: null }));
        await repo.save(
            makeIncident({
                code: "INC-2025-00002",
                startTime: new Date("2020-01-01T00:00:00Z"),
                endTime: new Date("2020-01-01T01:00:00Z"),
            })
        );

        const active = await repo.getActiveIncidents();
        expect(active.length).toBe(1);
    });

    it("should get resolved incidents (endTime != null AND endTime <= now)", async () => {
        await repo.save(
            makeIncident({
                code: "INC-2025-00001",
                startTime: new Date("2020-01-01T00:00:00Z"),
                endTime: new Date("2020-01-01T01:00:00Z"), // passado
            })
        );
        await repo.save(
            makeIncident({
                code: "INC-2025-00002",
                startTime: new Date("2099-01-01T00:00:00Z"),
                endTime: new Date("2099-01-01T01:00:00Z"), // futuro -> não entra
            })
        );

        const resolved = await repo.getResolvedIncidents();
        expect(resolved.length).toBe(1);
    });

    it("should get incidents by date range (startTime between range)", async () => {
        await repo.save(makeIncident({ code: "INC-2025-00001", startTime: new Date("2025-01-10T10:00:00Z") }));
        await repo.save(makeIncident({ code: "INC-2025-00002", startTime: new Date("2025-02-10T10:00:00Z") }));

        const list = await repo.getByDataRange(
            new Date("2025-01-01T00:00:00Z"),
            new Date("2025-01-31T23:59:59Z")
        );

        expect(list.length).toBe(1);
    });

    it("should get incidents by severity", async () => {
        const sevMinor: any = (Severity as any).Minor ?? "Minor";
        const sevMajor: any = (Severity as any).Major ?? "Major";

        await repo.save(makeIncident({ code: "INC-2025-00001", severity: sevMinor }));
        await repo.save(makeIncident({ code: "INC-2025-00002", severity: sevMajor }));

        const list = await repo.getBySeverity(sevMinor);
        expect(list.length).toBe(1);
    });

    it("should log error and return [] when findAll fails", async () => {
        const spy = vi.spyOn(schema, "find").mockImplementationOnce(() => {
            throw new Error("db failure");
        });

        const all = await repo.findAll();
        expect(all).toEqual([]);
        expect(mockLogger.error).toHaveBeenCalled();

        spy.mockRestore();
    });

    it("should log error and return null on failed save (mapper failure)", async () => {
        mockMap.toPersistence.mockImplementationOnce(() => {
            throw new Error("mapping failure");
        });

        const inc = makeIncident();

        // Este teste assume o PATCH recomendado no repo.save (toPersistence dentro do try/catch).
        const result = await repo.save(inc);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should log error and return null on failed save (db error)", async () => {
        const inc = makeIncident();

        const spy = vi.spyOn(schema, "create").mockRejectedValueOnce(new Error("db crash") as any);

        const result = await repo.save(inc);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();

        spy.mockRestore();
    });
});
