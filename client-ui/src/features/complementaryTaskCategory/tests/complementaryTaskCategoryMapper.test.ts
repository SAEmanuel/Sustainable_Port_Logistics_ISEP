import { describe, it, expect } from "vitest";
import { mapToCTCDomain } from "../mappers/complementaryTaskCategoryMapper";
import type { ComplementaryTaskCategoryDTO } from "../dtos/complementaryTaskCategoryDTO";

describe("ComplementaryTaskCategory Mapper", () => {
    it("should map DTO to Domain correctly", () => {
        const dto: ComplementaryTaskCategoryDTO = {
            id: "1",
            code: "CAT01",
            name: "Maintenance Tasks",
            description: "General maintenance operations",
            category: "Maintenance",
            defaultDuration: 60,
            isActive: true
        };

        const result = mapToCTCDomain(dto);

        expect(result).toEqual({
            id: "1",
            code: "CAT01",
            name: "Maintenance Tasks",
            description: "General maintenance operations",
            category: "Maintenance",
            defaultDuration: 60,
            isActive: true
        });
    });

    it("should handle optional defaultDuration being undefined in DTO", () => {
        const dto: ComplementaryTaskCategoryDTO = {
            id: "2",
            code: "CLN01",
            name: "Cleaning",
            description: "Standard cleaning category",
            category: "Cleaning and Housekeeping",
            isActive: true

        };

        const result = mapToCTCDomain(dto);

        expect(result.defaultDuration).toBeNull();
    });
});