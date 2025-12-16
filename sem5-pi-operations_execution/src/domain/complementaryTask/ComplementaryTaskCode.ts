import { ValueObject } from "../../core/domain/ValueObject";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import { CTError } from "./errors/ctErrors";

interface ComplementaryTaskCodeProps {
    value: string;
}

export class ComplementaryTaskCode extends ValueObject<ComplementaryTaskCodeProps> {

    get value(): string {
        return this.props.value;
    }

    private constructor(props: ComplementaryTaskCodeProps) {
        super(props);
    }


    public static create(prefix: string, number: number): ComplementaryTaskCode {

        if (!prefix || prefix.trim().length === 0) {
            throw new BusinessRuleValidationError(
                CTError.InvalidCode,
                "Code prefix must not be empty"
            );
        }

        if (!Number.isInteger(number) || number < 0) {
            throw new BusinessRuleValidationError(
                CTError.InvalidCode,
                "Code number must be a positive integer"
            );
        }

        const normalizedPrefix = prefix.trim().toUpperCase();
        const value = `${normalizedPrefix}[${number}]`;

        return new ComplementaryTaskCode({ value });
    }


    public static createFromString(raw: string): ComplementaryTaskCode {

        if (!raw || raw.trim().length === 0) {
            throw new BusinessRuleValidationError(
                CTError.InvalidCode,
                "Code must not be empty"
            );
        }

        const normalized = raw.trim().toUpperCase();

        const match = /^([A-Z]+)\[(\d+)]$/.exec(normalized);

        if (!match) {
            throw new BusinessRuleValidationError(
                CTError.InvalidCode,
                "Invalid complementary task code format",
                "Expected format: PREFIX[NUMBER]"
            );
        }

        const prefix = match[1];
        const number = Number(match[2]);

        return ComplementaryTaskCode.create(prefix, number);
    }

    public toString(): string {
        return this.props.value;
    }
}