import { AggregateRoot } from "../../core/domain/AggregateRoot";
import { UniqueEntityID } from "../../core/domain/UniqueEntityID";
import { VesselVisitExecutionCode } from "./vesselVisitExecutionCode";
import { VesselVisitExecutionId } from "./vesselVisitExecutionId";
import { Guard } from "../../core/logic/Guard";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";

interface VesselVisitExecutionProps {
    code: VesselVisitExecutionCode;
    vvnId: string;
    vesselImo: string;
    actualArrivalTime: Date;
    creatorEmail: string;
    status: string;

    actualBerthTime?: Date;
    actualDockId?: string;
    dockDiscrepancyNote?: string;

    updatedAt?: Date;
    auditLog?: Array<{
        at: Date;
        by: string;
        action: string;
        changes?: any;
        note?: string;
    }>;
}


export class VesselVisitExecution extends AggregateRoot<VesselVisitExecutionProps> {

    get id(): UniqueEntityID {
        return this._id;
    }

    get vesselVisitExecutionId(): VesselVisitExecutionId {
        return VesselVisitExecutionId.create(this.id);
    }

    get code(): VesselVisitExecutionCode {
        return this.props.code;
    }

    get vvnId(): string {
        return this.props.vvnId;
    }

    get vesselImo(): string {
        return this.props.vesselImo;
    }

    get actualArrivalTime(): Date {
        return this.props.actualArrivalTime;
    }

    get status(): string {
        return this.props.status;
    }

    get creatorEmail(): string {
        return this.props.creatorEmail;
    }

    private constructor(props: VesselVisitExecutionProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: VesselVisitExecutionProps, id?: UniqueEntityID): VesselVisitExecution {
        const guardedProps = [
            { argument: props.code, argumentName: "code" },
            { argument: props.vvnId, argumentName: "vvnId" },
            { argument: props.vesselImo, argumentName: "vesselImo" },
            { argument: props.actualArrivalTime, argumentName: "actualArrivalTime" },
            { argument: props.creatorEmail, argumentName: "creatorId" },
            { argument: props.status, argumentName: "status" },
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);

        if (!guardResult.succeeded) {
            throw new BusinessRuleValidationError(
                "Invalid VVE input",
                guardResult.message ?? "Invalid input"
            );
        }

        if (props.actualArrivalTime.getTime() > Date.now()) {
            throw new BusinessRuleValidationError("Invalid date", "The actual arrival time cannot be in the future.");
        }

        if (props.status !== "In Progress") {
            props.status = "In Progress";
        }

        return new VesselVisitExecution({
            ...props,
            auditLog: props.auditLog ?? []
        }, id);
    }

    get actualBerthTime(): Date | undefined {
        return this.props.actualBerthTime;
    }

    get actualDockId(): string | undefined {
        return this.props.actualDockId;
    }

    get dockDiscrepancyNote(): string | undefined {
        return this.props.dockDiscrepancyNote;
    }

    get updatedAt(): Date | undefined {
        return this.props.updatedAt;
    }

    get auditLog(): any[] {
        return this.props.auditLog ?? [];
    }

    public updateBerthAndDock(
        berthTime: Date,
        dockId: string,
        updatedBy: string,
        discrepancyNote?: string
    ): void {

        if (this.props.status !== "In Progress") {
            throw new BusinessRuleValidationError(
                "Invalid status",
                "Only 'In Progress' VVEs can be updated with berth time and dock."
            );
        }

        if (berthTime.getTime() < this.props.actualArrivalTime.getTime()) {
            throw new BusinessRuleValidationError(
                "Invalid berth time",
                "Actual berth time cannot be before actual arrival time."
            );
        }

        const now = new Date();

        const previous = {
            actualBerthTime: this.props.actualBerthTime,
            actualDockId: this.props.actualDockId
        };

        this.props.actualBerthTime = berthTime;
        this.props.actualDockId = dockId;
        this.props.dockDiscrepancyNote = discrepancyNote;

        this.props.updatedAt = now;

        this.props.auditLog = this.props.auditLog ?? [];
        this.props.auditLog.push({
            at: now,
            by: updatedBy,
            action: "UPDATE_BERTH_DOCK",
            changes: {
                from: previous,
                to: { actualBerthTime: berthTime, actualDockId: dockId }
            },
            note: discrepancyNote
        });
    }

}