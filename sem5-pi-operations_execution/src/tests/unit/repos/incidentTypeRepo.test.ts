import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose, { Model, Document } from "mongoose";

import IncidentTypeRepo from "../../../repos/incidentTypeRepo";
import { IncidentType } from "../../../domain/incidentTypes/incidentType";
import { Severity } from "../../../domain/incidentTypes/severity";
import { IIncidentTypePersistence } from "../../../dataschema/IIncidentTypePersistence";

/**
 * Optional: if your test environment does NOT connect mongoose anywhere,
 * this will auto-spin an in-memory MongoDB (if mongodb-memory-server is installed).
 * If you already connect in a global setup file, this will keep using that connection.
 */
let mongoServer: any | null = null;

async function ensureMongoConnection() {
    if (mongoose.connection.readyState === 1) return; // connected

    // Prefer env-provided DB for CI if you use it
    const envUri = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (envUri) {
        await mongoose.connect(envUri);
        return;
    }

    // Try mongodb-memory-server if available
    try {
        const mod = await import("mongodb-memory-server");
        const { MongoMemoryServer } = mod as any;
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    } catch {
        // If your project connects mongoose elsewhere, you can ignore this.
        // If you don't, tests may hang due to mongoose buffering.
        // In that case, install mongodb-memory-server as a dev dependency.
    }
}

const mockMap = {
    toPersistence: vi.fn((it: any) => ({
        domainId: it.id.toString(),
        code: it.code,
        name: it.name,
        description: it.description,
        severity: it.severity,
        parent: it.parentCode,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
    })),
    toDomain: vi.fn((r: any) => r as any),
};

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

describe("IncidentTypeRepo", () => {
    let repo: IncidentTypeRepo;
    let schema: Model<IIncidentTypePersistence & Document>;

    const SCHEMA_NAME = "IncidentType_Test";

    beforeAll(async () => {
        await ensureMongoConnection();
    });

    afterAll(async () => {
        try {
            if (mongoose.connection.readyState === 1) await mongoose.disconnect();
        } finally {
            if (mongoServer) await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        // Reusar model se já existir (evita OverwriteModelError)
        if (mongoose.models[SCHEMA_NAME]) {
            schema = mongoose.model(SCHEMA_NAME) as Model<IIncidentTypePersistence & Document>;
        } else {
            schema = mongoose.model<IIncidentTypePersistence & Document>(
                SCHEMA_NAME,
                new mongoose.Schema(
                    {
                        domainId: String,
                        code: { type: String, index: true },
                        name: String,
                        description: String,
                        severity: String,
                        parent: { type: String, index: true, required: false },
                        createdAt: Date,
                        updatedAt: Date,
                    },
                    { timestamps: false, versionKey: false }
                )
            );
        }

        await schema.deleteMany({});

        repo = new IncidentTypeRepo(schema, mockMap as any, mockLogger as any);

        vi.clearAllMocks();
    });

    function makeIncidentType(overrides: Partial<any> = {}) {
        // Nota: no teu domínio o método chama-se "creat" (typo). Ajusta se renomeares para create.
        return IncidentType.creat({
            code: overrides.code ?? "T-INC001",
            name: overrides.name ?? "Test IncidentType",
            description: overrides.description ?? "Test desc",
            severity: overrides.severity ?? Severity.Minor,
            parent: overrides.parent ?? null,
            createdAt: overrides.createdAt ?? new Date(),
            updatedAt: overrides.updatedAt ?? null,
        });
    }

    it("should save a new IncidentType", async () => {
        const itype = makeIncidentType();
        await repo.save(itype);

        const docs = await schema.find();
        expect(docs.length).toBe(1);
        expect(docs[0].code).toBe("T-INC001");
    });

    it("should update an existing IncidentType instead of creating duplicate", async () => {
        const itype = makeIncidentType();
        await repo.save(itype);

        itype.changeName("Updated Name");
        await repo.save(itype);

        const docs = await schema.find({ code: "T-INC001" });
        expect(docs.length).toBe(1);
        expect(docs[0].name).toBe("Updated Name");
    });

    it("should return true when IncidentType exists", async () => {
        const itype = makeIncidentType();
        await repo.save(itype);

        const exists = await repo.exists(itype);
        expect(exists).toBe(true);
    });

    it("should return false when IncidentType does not exist", async () => {
        const itype = makeIncidentType();
        const exists = await repo.exists(itype);
        expect(exists).toBe(false);
    });

    it("should find IncidentType by code and call mapper.toDomain", async () => {
        const itype = makeIncidentType();
        await repo.save(itype);

        const found = await repo.findByCode("T-INC001");

        expect(found).not.toBeNull();
        expect(mockMap.toDomain).toHaveBeenCalled();
    });

    it("should return null if IncidentType not found by code", async () => {
        const found = await repo.findByCode("T-INC999");
        expect(found).toBeNull();
    });

    it("should find IncidentTypes by name (case-insensitive)", async () => {
        await repo.save(makeIncidentType({ code: "T-INC001", name: "Oil Spill" }));
        await repo.save(makeIncidentType({ code: "T-INC002", name: "Fire Hazard" }));
        await repo.save(makeIncidentType({ code: "T-INC003", name: "Electrical Fault" }));

        const results = await repo.findByName("fiRe");
        expect(results.length).toBe(1);
        expect((results[0] as any).name).toBe("Fire Hazard");
    });

    it("should get all IncidentTypes", async () => {
        await repo.save(makeIncidentType({ code: "T-INC001" }));
        await repo.save(makeIncidentType({ code: "T-INC002" }));

        const results = await repo.getAllAsyn();
        expect(results.length).toBe(2);
    });

    it("should remove an IncidentType by code and return deletedCount", async () => {
        await repo.save(makeIncidentType({ code: "T-INC010" }));

        const deleted = await repo.removeType("T-INC010");
        expect(deleted).toBe(1);

        const after = await schema.find({ code: "T-INC010" });
        expect(after.length).toBe(0);
    });

    it("should get root types (parent null OR parent missing)", async () => {
        // root 1: explicit parent null
        await repo.save(makeIncidentType({ code: "T-INC001", parent: null }));

        // root 2: parent missing (documento antigo)
        await schema.create({
            domainId: "legacy-root-domain",
            code: "T-INC002",
            name: "Legacy Root",
            description: "No parent field",
            severity: "Minor",
            createdAt: new Date(),
            // intentionally omit parent
            updatedAt: null,
        });

        // non-root
        await repo.save(makeIncidentType({ code: "T-INC003", parent: "T-INC001" }));

        const roots = await repo.getRootTypes();

        const codes = roots.map((r: any) => r.code).sort();
        expect(codes).toEqual(["T-INC001", "T-INC002"]);
    });

    it("should get direct children for a parent (sorted by code)", async () => {
        await repo.save(makeIncidentType({ code: "T-INC100", parent: null }));

        // children
        await repo.save(makeIncidentType({ code: "T-INC102", parent: "T-INC100" }));
        await repo.save(makeIncidentType({ code: "T-INC101", parent: "T-INC100" }));

        // other parent
        await repo.save(makeIncidentType({ code: "T-INC200", parent: null }));
        await repo.save(makeIncidentType({ code: "T-INC201", parent: "T-INC200" }));

        const children = await repo.getDirectChilds("T-INC100");

        expect(children.map((c: any) => c.code)).toEqual(["T-INC101", "T-INC102"]);
    });

    it("should get subtree from parent (descendants only, ordered by depth then code)", async () => {
        // Parent
        await repo.save(makeIncidentType({ code: "T-INC300", parent: null }));

        // Level 1 children
        await repo.save(makeIncidentType({ code: "T-INC301", parent: "T-INC300" }));
        await repo.save(makeIncidentType({ code: "T-INC302", parent: "T-INC300" }));

        // Level 2 descendants
        await repo.save(makeIncidentType({ code: "T-INC303", parent: "T-INC301" }));
        await repo.save(makeIncidentType({ code: "T-INC304", parent: "T-INC301" }));

        const subtree = await repo.getSubTreeFromParentNode("T-INC300");
        const codes = subtree.map((d: any) => d.code);

        // Should NOT include parent itself (your repo projects "descendants" only)
        expect(codes).not.toContain("T-INC300");

        // Must include all descendants
        expect(new Set(codes)).toEqual(new Set(["T-INC301", "T-INC302", "T-INC303", "T-INC304"]));

        // Order expectation (depth then code) - depending on Mongo behavior, your sort enforces it.
        // depth 0: 301, 302 ; depth 1: 303, 304 (children of 301)
        expect(codes).toEqual(["T-INC301", "T-INC302", "T-INC303", "T-INC304"]);
    });

    it("should return empty subtree if parent not found", async () => {
        const subtree = await repo.getSubTreeFromParentNode("T-INC999");
        expect(subtree).toEqual([]);
    });

    it("should log error and return [] when getAllAsyn fails", async () => {
        const spy = vi.spyOn(schema, "find").mockImplementationOnce(() => {
            throw new Error("db failure");
        });

        const all = await repo.getAllAsyn();
        expect(all).toEqual([]);
        expect(mockLogger.error).toHaveBeenCalled();

        spy.mockRestore();
    });

    it("should log error and return null on failed save", async () => {
        mockMap.toPersistence.mockImplementationOnce(() => {
            throw new Error("mapping failure");
        });

        const itype = makeIncidentType();
        const result = await repo.save(itype);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
