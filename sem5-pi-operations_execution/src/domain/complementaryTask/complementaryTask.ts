import {AggregateRoot} from "../../core/domain/AggregateRoot";
import {UniqueEntityID} from "../../core/domain/UniqueEntityID";
import {Guard} from "../../core/logic/Guard";
import { ComplementaryTaskCategory } from "../complementaryTaskCategory/complementaryTaskCategory";
import { CTStatus } from "./ctstatus";
import {ComplementaryTaskId} from "./complementaryTaskId";
import { ComplementaryTaskError } from "./errors/ctErrors";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

interface ComplementaryTaskProps{
    code: string,
    category: string,
    staff: string,
    timeStart: Date,
    timeEnd: Date,
    status: CTStatus,
    //vve: vve
}

export class ComplementaryTask extends AggregateRoot<ComplementaryTaskProps> {

    get id(): UniqueEntityID {
        return this._id;
    }

    get userId(): ComplementaryTaskId {
        return ComplementaryTaskId.caller(this.id)
    }

    get code():string{
        return this.props.code;
    }

    get category(): string {
        return this.props.category;
    }

    get staff(): string {
        return this.props.staff;
    }

    get timeStart(): Date {
        return this.props.timeStart;
    }

    get timeEnd(): Date {
        return this.props.timeEnd;
    }

    get status(): CTStatus {
        return this.props.status;
    }

    // get vve(): VVE { 
    //   return this.props.vve;
    // }


    set code(value:string){
        this.props.code = value;
    }

    set category(value: string) {
        this.props.category = value;
    }

    set staff(value: string) {
        this.props.staff = value;
    }

    set timeStart(value: Date) {
        this.props.timeStart = value;
    }

    set timeEnd(value: Date) {
        this.props.timeEnd = value;
    }

    set status(value: CTStatus) {
        this.props.status = value;
    }

    // set vve(value: VVE) {
    //   this.props.vve = value;
    // }

    private constructor(props: ComplementaryTaskProps, id?: UniqueEntityID) {
        super(props, id);
    }

    private static isValidCodeFormat(code: string): boolean {
        const regex = /^CT-(202[5-9]|20[3-9][0-9])-([0-9]{5})$/;
        return regex.test(code);
    }

    public static create(
        props: ComplementaryTaskProps,
        id?: UniqueEntityID
    ): ComplementaryTask {

        const guardedProps = [
        { argument: props.code, argumentName: "code" },
        { argument: props.category, argumentName: "category" },
        { argument: props.staff, argumentName: "staff" },
        { argument: props.timeStart, argumentName: "timeStart" },
        { argument: props.timeEnd, argumentName: "timeEnd" },
        { argument: props.status, argumentName: "status" },
        // { argument: props.vve, argumentName: "vve" }, 
        ];

         const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);

        if (!guardResult.succeeded) {
            throw new BusinessRuleValidationError(
            ComplementaryTaskError.InvalidInput,
            "Invalid complementary task details",
            guardResult.message ?? "Invalid input"
            );
        }

        if (!this.isValidCodeFormat(props.code)) {
            throw new BusinessRuleValidationError(
            ComplementaryTaskError.InvalidCodeFormat,
            "Invalid code format",
            "Code must follow the format CT-YYYY-NNNNN"
            );
        }

        if (!props.timeStart) {
            throw new BusinessRuleValidationError(
            ComplementaryTaskError.InvalidDateStart,
            "Invalid start date",
            "timeStart is required"
            );
        }

        if (!props.timeEnd) {
            throw new BusinessRuleValidationError(
            ComplementaryTaskError.InvalidDateEnd,
            "Invalid end date",
            "timeEnd is required"
            );
        }

        if (props.timeStart >= props.timeEnd) {
            throw new BusinessRuleValidationError(
            ComplementaryTaskError.InvalidDateEnd,
            "Invalid date range",
            "timeEnd must be after timeStart"
            );
        }

        return new ComplementaryTask(
            { ...props },
            id
        );
    }
}