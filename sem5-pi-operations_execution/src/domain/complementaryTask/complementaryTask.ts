import {ComplementaryTaskCategoryId} from "../complementaryTaskCategory/complementaryTaskCategoryId";
import {CTStatus} from "./ctstatus";
import {VesselVisitExecutionId} from "../vesselVisitExecution/vesselVisitExecutionId";
import {ComplementaryTaskCode} from "./ComplementaryTaskCode";
import {AggregateRoot} from "../../core/domain/AggregateRoot";
import {UniqueEntityID} from "../../core/domain/UniqueEntityID";
import {Guard} from "../../core/logic/Guard";
import {BusinessRuleValidationError} from "../../core/logic/BusinessRuleValidationError";
import {CTError} from "./errors/ctErrors";
import {ComplementaryTaskId} from "./complementaryTaskId";

interface ComplementaryTaskProps {
    code: ComplementaryTaskCode;
    category: ComplementaryTaskCategoryId;
    staff: string;
    timeStart: Date;
    timeEnd: Date;
    status: CTStatus;
    vve: VesselVisitExecutionId;
    createdAt: Date;
    updatedAt: Date | null;
}

export class ComplementaryTask extends AggregateRoot<ComplementaryTaskProps> {
    private constructor(props: ComplementaryTaskProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: ComplementaryTaskProps, id?: UniqueEntityID): ComplementaryTask {
        const guardResult = Guard.againstNullOrUndefinedBulk([
            {argument: props.code, argumentName: "code"},
            {argument: props.category, argumentName: "categoryId"},
            {argument: props.staff, argumentName: "staff"},
            {argument: props.timeStart, argumentName: "timeStart"},
            {argument: props.timeEnd, argumentName: "timeEnd"},
            {argument: props.status, argumentName: "status"},
            {argument: props.vve, argumentName: "vveId"},
            {argument: props.createdAt, argumentName: "createdAt"},
        ]);

        if (!guardResult.succeeded) {
            throw new BusinessRuleValidationError(
                CTError.InvalidInput,
                "Invalid complementary task input",
                guardResult.message ?? "Invalid input"
            );
        }

        this.validateTimeWindow(props.timeStart, props.timeEnd);

        if (!props.staff.trim()) {
            throw new BusinessRuleValidationError(CTError.InvalidInput, "Staff is required");
        }

        return new ComplementaryTask(
            {
                ...props,
                updatedAt: props.updatedAt ?? null,
            },
            id
        );
    }

    public static rehydrate(props: ComplementaryTaskProps, id: UniqueEntityID): ComplementaryTask {
        return new ComplementaryTask(props, id);
    }

    get id(): UniqueEntityID {
        return this._id;
    }

    get taskId(): ComplementaryTaskId {
        return ComplementaryTaskId.caller(this.id);
    }

    get code(): ComplementaryTaskCode {
        return this.props.code;
    }

    get category(): ComplementaryTaskCategoryId {
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

    get vve(): VesselVisitExecutionId {
        return this.props.vve;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date | null {
        return this.props.updatedAt;
    }

    public changeDetails(
        category: ComplementaryTaskCategoryId,
        staff: string,
        timeStart: Date,
        timeEnd: Date,
        vve: VesselVisitExecutionId
    ): void {
        this.ensureNotCompleted();

        if (!staff.trim()) {
            throw new BusinessRuleValidationError(CTError.InvalidInput, "Staff is required");
        }

        ComplementaryTask.validateTimeWindow(timeStart, timeEnd);

        this.props.category = category;
        this.props.staff = staff;
        this.props.timeStart = timeStart;
        this.props.timeEnd = timeEnd;
        this.props.vve = vve;

        this.touch();
    }


    public changeStatus(targetStatus: CTStatus, now: Date = new Date()): void {
        this.ensureNotCompleted();

        switch (targetStatus) {
            case CTStatus.Scheduled:
                this.scheduled();
                return;

            case CTStatus.InProgress:
                this.inProgress(now);
                return;

            case CTStatus.Completed:
                this.complete(now);
                return;

            default:
                throw new BusinessRuleValidationError(
                    CTError.InvalidInput,
                    "Invalid status transition",
                    `Unsupported target status: ${String(targetStatus)}`
                );
        }
    }

    private inProgress(now: Date): void {
        if (this.props.status !== CTStatus.Scheduled) {
            throw new BusinessRuleValidationError(
                CTError.NotScheduled,
                "Complementary task must be scheduled to start",
                `Current status: ${this.props.status}`
            );
        }

        const start = this.props.timeStart.getTime();
        const end = this.props.timeEnd.getTime();
        const t = now.getTime();

        if (t < start || t > end) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeWindow,
                "Cannot start task outside its time window",
                `Now=${now.toISOString()} start=${this.props.timeStart.toISOString()} end=${this.props.timeEnd.toISOString()}`
            );
        }

        this.props.status = CTStatus.InProgress;
        this.touch();
    }

    private complete(now: Date): void {
        if (this.props.status !== CTStatus.InProgress) {
            throw new BusinessRuleValidationError(
                CTError.NotInProgress,
                "Complementary task must be in progress to complete",
                `Current status: ${this.props.status}`
            );
        }

        const end = this.props.timeEnd.getTime();
        if (now.getTime() < end) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeWindow,
                "Cannot complete task before timeEnd",
                `Now=${now.toISOString()} end=${this.props.timeEnd.toISOString()}`
            );
        }

        this.props.status = CTStatus.Completed;
        this.touch();
    }

    private scheduled(): void {
        this.props.status = CTStatus.Scheduled;
        this.touch();
    }

    private ensureNotCompleted(): void {
        if (this.props.status === CTStatus.Completed) {
            throw new BusinessRuleValidationError(
                CTError.AlreadyCompleted,
                "Cannot modify a completed complementary task"
            );
        }
    }

    private static validateTimeWindow(start: Date, end: Date): void {
        if (start >= end) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeWindow,
                "Invalid time window",
                "Start time must be before end time"
            );
        }

        if (start.getTime() < Date.now()) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeWindow,
                "Start time cannot be in the past"
            );
        }
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}