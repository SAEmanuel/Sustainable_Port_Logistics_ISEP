import { describe, it, expect } from "vitest";
import {Category, CategoryFactory} from "../../../domain/complementaryTaskCategory/category";
import {BusinessRuleValidationError} from "../../../core/logic/BusinessRuleValidationError";


describe("CategoryFactory", () => {

    it("should return valid category when value exists", () => {
        const cat = CategoryFactory.fromString("Maintenance");

        expect(cat).toBe(Category.Maintenance);
    });

    it("should throw when category is invalid", () => {
        expect(() => CategoryFactory.fromString("InvalidCategory"))
            .toThrow(BusinessRuleValidationError);
    });

});