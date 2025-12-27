import {describe, it, expect, beforeEach, vi} from "vitest";
import mongoose, {Model, Document} from "mongoose";

import ComplementaryTaskCategoryRepo from "../../../repos/complementaryTaskCategoryRepo";
import {ComplementaryTaskCategory} from "../../../domain/complementaryTaskCategory/complementaryTaskCategory";
import {ComplementaryTaskCategoryId} from "../../../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {Category} from "../../../domain/complementaryTaskCategory/category";
import {IComplementaryTaskCategoryPersistence} from "../../../dataschema/IComplementaryTaskCategoryPersistence";

const mockMap = {
    toPersistence: vi.fn((c: any) => ({
        domainId: c.id.toString(),
        code: c.code,
        name: c.name,
        description: c.description,
        category: c.category,
        defaultDuration: c.defaultDuration,
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
    })),
    toDomain: vi.fn((r: any) => r as any)
};

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

describe("ComplementaryTaskCategoryRepo", () => {

    let repo: ComplementaryTaskCategoryRepo;
    let schema: Model<IComplementaryTaskCategoryPersistence & Document>;

    const SCHEMA_NAME = "CTC_Test";

    beforeEach(async () => {

        // Reusar schema se já existir (evita OverwriteModelError)
        if (mongoose.models[SCHEMA_NAME]) {
            schema = mongoose.model(
                SCHEMA_NAME
            ) as Model<IComplementaryTaskCategoryPersistence & Document>;
        } else {
            schema = mongoose.model<IComplementaryTaskCategoryPersistence & Document>(
                SCHEMA_NAME,
                new mongoose.Schema({
                    domainId: String,
                    code: String,
                    name: String,
                    description: String,
                    category: String,
                    defaultDuration: Number,
                    isActive: Boolean,
                    createdAt: Date,
                    updatedAt: Date
                })
            );
        }

        // Limpar documentos entre testes
        await schema.deleteMany({});

        repo = new ComplementaryTaskCategoryRepo(
            schema,
            mockMap as any,
            mockLogger as any
        );

        vi.clearAllMocks();
    });

    function makeCategory(overrides: Partial<any> = {}) {

        return ComplementaryTaskCategory.create({
            code: overrides.code ?? "CTC001",
            category: overrides.category ?? Category.Maintenance,
            name: overrides.name ?? "Test Category",
            description: overrides.description ?? "Test desc",
            defaultDuration: overrides.defaultDuration ?? 60,
            isActive: overrides.isActive ?? true,
            createdAt: overrides.createdAt ?? new Date(),
            updatedAt: null
        });
    }

    it("should save a new category", async () => {
        const c = makeCategory();
        await repo.save(c);

        const docs = await schema.find();
        expect(docs.length).toBe(1);
    });

    it("should update an existing category instead of creating duplicate", async () => {
        const c = makeCategory();

        await repo.save(c);

        c.changeDetails(
            "Updated Name",
            c.description,
            c.defaultDuration,
            c.category
        );

        await repo.save(c);

        const docs = await schema.find();
        expect(docs.length).toBe(1);
        expect(docs[0].name).toBe("Updated Name");
    });

    it("should return true when category exists", async () => {
        const c = makeCategory();
        await repo.save(c);

        const exists = await repo.exists(c);
        expect(exists).toBe(true);
    });

    it("should return false when category does not exist", async () => {
        const c = makeCategory();
        const exists = await repo.exists(c);
        expect(exists).toBe(false);
    });

    it("should find category by code", async () => {
        const c = makeCategory();
        await repo.save(c);

        await repo.findByCode("CTC001");

        expect(mockMap.toDomain).toHaveBeenCalled();
    });

    it("should return null if category not found by code", async () => {
        const result = await repo.findByCode("CTC999");
        expect(result).toBeNull();
    });

    it("should find category by id", async () => {
        const c = makeCategory();
        await repo.save(c);

        const id = ComplementaryTaskCategoryId.create(c.id.toString());

        await repo.findById(id);

        expect(mockMap.toDomain).toHaveBeenCalled();
    });

    it("should search by name (case-insensitive)", async () => {
        const c = makeCategory({name: "Cleaning Equipment"});
        await repo.save(c);

        const results = await repo.findByName("clean");
        expect(results.length).toBe(1);
    });

    it("should search by description", async () => {
        const c = makeCategory({description: "Routine maintenance"});
        await repo.save(c);

        const results = await repo.findByDescription("maintenance");
        expect(results.length).toBe(1);
    });

    it("should search by category enum", async () => {
        const c = makeCategory({category: Category.Maintenance});
        await repo.save(c);

        const results = await repo.findByCategory(Category.Maintenance);
        expect(results.length).toBe(1);
    });

    it("should count total categories", async () => {
        await repo.save(makeCategory());
        await repo.save(makeCategory());

        const total = await repo.getTotalCategories();
        expect(total).toBe(2);
    });

    it("should fetch all categories", async () => {
        await repo.save(makeCategory());
        await repo.save(makeCategory());

        const results = await repo.findAll();
        expect(results.length).toBe(2);
    });

    it("should log error and return null on failed save", async () => {
        mockMap.toPersistence.mockImplementationOnce(() => {
            throw new Error("mapping failure");
        });

        const c = makeCategory();
        const result = await repo.save(c);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();
    });
});