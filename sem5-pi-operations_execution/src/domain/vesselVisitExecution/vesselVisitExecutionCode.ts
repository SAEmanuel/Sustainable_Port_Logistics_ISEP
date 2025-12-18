import { ValueObject } from "../../core/domain/ValueObject";
import { Guard } from "../../core/logic/Guard";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

interface VesselVisitExecutionCodeProps {
    value: string;
}

export class VesselVisitExecutionCode extends ValueObject<VesselVisitExecutionCodeProps> {

    get value(): string {
        return this.props.value;
    }

    private constructor(props: VesselVisitExecutionCodeProps) {
        super(props);
    }

    public static isValidFormat(code: string): boolean {
        const regex = /^VVE\d{4}\d{6}$/;
        return regex.test(code);
    }

    public static create(value: string): VesselVisitExecutionCode {
        const guardResult = Guard.againstNullOrUndefined(value, 'vesselVisitExecutionCode');
        if (!guardResult.succeeded) {
            throw new BusinessRuleValidationError(
                "Invalid code",
                guardResult.message || "Code is required"
            );
        }

        if (!this.isValidFormat(value)) {
            throw new BusinessRuleValidationError(
                "Invalid VVE code format",
                "O código deve seguir o padrão VVE + Ano(4) + Sequência(6). Ex: VVE2025000001"
            );
        }

        return new VesselVisitExecutionCode({ value });
    }
}