import { describe, it, expect } from "vitest";
import {ComplementaryTaskCategory} from "../../../domain/complementaryTaskCategory/complementaryTaskCategory";
import {Category} from "../../../domain/complementaryTaskCategory/category";
import {BusinessRuleValidationError} from "../../../core/logic/BusinessRuleValidationError";
import {UniqueEntityID} from "../../../core/domain/UniqueEntityID";



describe("ComplementaryTaskCategory Domain", () => {

    const baseProps = {
        code: "CTC001",
        category: Category.Maintenance,
        name: "Oil System Check",
        description: "Routine maintenance task",
        defaultDuration: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null
    };

    it("should create a valid ComplementaryTaskCategory", () => {
        const ctc = ComplementaryTaskCategory.create(baseProps);

        expect(ctc.code).toBe("CTC001");
        expect(ctc.category).toBe(Category.Maintenance);
        expect(ctc.isActive).toBe(true);
        expect(ctc.updatedAt).toBeNull();
    });

    it("should require mandatory fields", () => {
        expect(() =>
            ComplementaryTaskCategory.create({
                ...baseProps,
                name: ""
            })
        ).toThrow(BusinessRuleValidationError);
    });

    it("should reject invalid code format", () => {
        const invalidCodes = ["CT001", "CTC1", "CTC01A", "ABC123"];

        for (const code of invalidCodes) {
            expect(() =>
                ComplementaryTaskCategory.create({
                    ...baseProps,
                    code
                })
            ).toThrow(BusinessRuleValidationError);
        }
    });

    it("should update details and set updatedAt", () => {
        const ctc = ComplementaryTaskCategory.create(baseProps);

        const beforeUpdate = ctc.updatedAt;

        ctc.changeDetails(
            "Updated Name",
            "Updated Description",
            120,
            Category.SafetyAndSecurity
        );

        expect(ctc.name).toBe("Updated Name");
        expect(ctc.description).toBe("Updated Description");
        expect(ctc.defaultDuration).toBe(120);
        expect(ctc.category).toBe(Category.SafetyAndSecurity);
        expect(ctc.updatedAt).not.toBe(beforeUpdate);
    });

    it("should not allow changing details with missing values", () => {
        const ctc = ComplementaryTaskCategory.create(baseProps);

        expect(() =>
            ctc.changeDetails("", "", null, Category.Maintenance)
        ).toThrow(BusinessRuleValidationError);
    });

    it("should deactivate active category", () => {
        const ctc = ComplementaryTaskCategory.create(baseProps);

        ctc.deactivate();

        expect(ctc.isActive).toBe(false);
        expect(ctc.updatedAt).not.toBeNull();
    });

    it("should not deactivate already inactive category", () => {
        const ctc = ComplementaryTaskCategory.create({
            ...baseProps,
            isActive: false
        });

        expect(() => ctc.deactivate())
            .toThrow(BusinessRuleValidationError);
    });

    it("should activate inactive category", () => {
        const ctc = ComplementaryTaskCategory.create({
            ...baseProps,
            isActive: false
        });

        ctc.activate();

        expect(ctc.isActive).toBe(true);
    });

    it("should not activate already active category", () => {
        const ctc = ComplementaryTaskCategory.create(baseProps);

        expect(() => ctc.activate())
            .toThrow(BusinessRuleValidationError);
    });

    it("should return ComplementaryTaskCategoryId", () => {
        const id = new UniqueEntityID();
        const ctc = ComplementaryTaskCategory.create(baseProps, id);

        expect(ctc.categoryId.id.toString()).toBe(id.toString());
    });

});