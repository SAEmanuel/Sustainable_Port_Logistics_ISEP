import { describe, it, expect } from "vitest";
import {ComplementaryTaskCode} from "../../../domain/complementaryTask/ComplementaryTaskCode";
import {BusinessRuleValidationError} from "../../../core/logic/BusinessRuleValidationError";


describe("ComplementaryTaskCode", () => {

    it("should create a valid code from prefix + number", () => {
        const code = ComplementaryTaskCode.create("CTC001", 5);

        expect(code.value).toBe("CTC001[5]");
    });

    it("should normalize prefix to uppercase", () => {
        const code = ComplementaryTaskCode.create("ctc01", 1);

        expect(code.value).toBe("CTC01[1]");
    });

    it("should throw if prefix is empty", () => {
        expect(() => ComplementaryTaskCode.create("", 1))
            .toThrow(BusinessRuleValidationError);
    });

    it("should throw if number is not positive", () => {
        expect(() => ComplementaryTaskCode.create("CTC", 0))
            .toThrow(BusinessRuleValidationError);

        expect(() => ComplementaryTaskCode.create("CTC", -5))
            .toThrow(BusinessRuleValidationError);
    });

    it("should create a valid code from string format", () => {
        const code = ComplementaryTaskCode.createFromString("ctc009[12]");

        expect(code.value).toBe("CTC009[12]");
    });

    it("should reject invalid formatted codes", () => {
        const invalidCodes = [
            "CTC001",
            "CTC[ABC]",
            "123",
            "[]",
            "",
            "  ",
            "CTC-01[1]"
        ];

        for (const c of invalidCodes) {
            expect(() => ComplementaryTaskCode.createFromString(c))
                .toThrow(BusinessRuleValidationError);
        }
    });

});