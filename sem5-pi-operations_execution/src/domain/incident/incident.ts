import {Severity} from "../incidentTypes/severity";
import {ImpactMode} from "./impactMode";
import {AggregateRoot} from "../../core/domain/AggregateRoot";
import {UniqueEntityID} from "../../core/domain/UniqueEntityID";
import {IncidentId} from "./incidentId";
import {BusinessRuleValidationError} from "../../core/logic/BusinessRuleValidationError";
import {IncidentError} from "./errors/incidentErrors";
import {Guard} from "../../core/logic/Guard";
import {IncidentType} from "../incidentTypes/incidentType";
import {VesselVisitExecutionId} from "../vesselVisitExecution/vesselVisitExecutionId";

interface IncidentProps {
    code : string,
    incidentTypeCode : string,
    startTime : Date,
    endTime : Date | null,
    duration : number | null,
    severity : Severity,
    impactMode : ImpactMode,
    description: string,
    createdByUser : string,
    upcomingWindowStartTime : Date | null,
    upcomingWindowEndTime : Date | null,

    createdAt : Date,
    updatedAt : Date | null
}

export class Incident extends AggregateRoot<IncidentProps>{

    get id(): UniqueEntityID{
        return this._id;
    }

    get incidentId() : IncidentId{
        return IncidentId.caller(this.id);
    }

    get code() : string{
        return this.props.code;
    }

    get incidentTypeCode() : string{
        return this.props.incidentTypeCode;
    }

    get startTime() : Date{
        return this.props.startTime;
    }

    get endTime() : Date | null{
        return this.props.endTime;
    }

    get duration() : number | null{
        return this.props.duration;
    }

    get severity(): Severity{
        return this.props.severity;
    }

    get impactMode(): ImpactMode{
        return this.props.impactMode;
    }

    get description(): string{
        return this.props.description;
    }

    get createdByUser(): string{
        return this.props.createdByUser;
    }

    get upcomingWindowStartTime(): Date | null{
        return this.props.upcomingWindowStartTime;
    }

    get upcomingWindowEndTime(): Date | null{
        return this.props.upcomingWindowEndTime;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date | null {
        return this.props.updatedAt;
    }

    private constructor(
        props: IncidentProps,
        id?: UniqueEntityID) {
        super(props,id);
    }

    public static create(
        props: IncidentProps,
        id?: UniqueEntityID
    ): Incident {
        const guardedProps = [
            { argument: props.code, argumentName: "code" },
            { argument: props.incidentTypeCode, argumentName: "incidentTypeCode" },
            { argument: props.startTime, argumentName: "startTime" },
            { argument: props.severity, argumentName: "severity" },
            { argument: props.impactMode, argumentName: "impactMode" },
            { argument: props.description, argumentName: "description" },
            { argument: props.createdByUser, argumentName: "createdByUser" },
            { argument: props.createdAt, argumentName: "createdAt" }
        ]

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if(!guardResult.succeeded){
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid incident details",
                guardResult.message ?? "Invalid input"
            )
        }

        if (!this.isValidCodeFormat(props.code)) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidCodeFormat,
                "Invalid incident format for code",
                "Code must follow the format INC-YYYY-####"
            )
        }

        if (!IncidentType.isValidCodeFormat(props.incidentTypeCode)){
            throw new BusinessRuleValidationError(
                IncidentError.InvalidCodeFormat,
                "Invalid incident type format for code",
                "Code must follow the format T-INC###",
            )
        }

        this.validateTimeWindow(props.startTime,props.endTime);

        if (props.impactMode == "Upcoming"){
            if (props.upcomingWindowStartTime == null || props.upcomingWindowEndTime == null) {
                throw new BusinessRuleValidationError(
                    IncidentError.InvalidInput,
                    "Invalid details for impact mode type upcoming incident",
                    "When a impact mode incident is 'Upcoming' window start/end time cannot be null."

                )
            }

            if (props.upcomingWindowStartTime < props.startTime || (props.endTime && props.upcomingWindowStartTime > props.endTime)) {
                throw new BusinessRuleValidationError(
                    IncidentError.InvalidInput,
                    "Invalid details for impact mode type upcoming incident",
                    "For a impact mode incident is 'Upcoming' window start time must be grater than start time and les than end time."
                )
            }

            if (props.upcomingWindowStartTime > props.upcomingWindowEndTime){
                throw new BusinessRuleValidationError(
                    IncidentError.InvalidInput,
                    "Invalid details for impact mode type upcoming incident",
                    "For a impact mode incident is 'Upcoming' window start time cannot be less than end time."
                )
            }
        }

        return new Incident({
            ...props,
            endTime : props.endTime ?? null,
            duration : props.duration ?? null,
            upcomingWindowStartTime: props.upcomingWindowStartTime ?? null,
            upcomingWindowEndTime: props.upcomingWindowEndTime ?? null,
            updatedAt: props.updatedAt ?? null,
        }, id)
    }

    public static rehydrate(props: IncidentProps, id: UniqueEntityID): Incident {
        return new Incident(props, id);
    }

    public changeIncidentTypeCode(incidentTypeCode : string) : void {
        this.props.incidentTypeCode = incidentTypeCode;
        this.touch();
    }

    public changeStartTime(startTime : Date) :void{

        if (startTime !== null && startTime !== undefined) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid start time for update",
                `Start time cannot be null or undefined`
            );
        }

        Incident.validateTimeWindow(startTime,this.props.endTime);

        this.props.startTime = startTime;

        if(this.props.endTime != null){
            this.calculateDuration(startTime,this.props.endTime);
        }

        this.touch();
    }

    public changeEndTime(endTime : Date) :void{
        if (endTime !== null && endTime !== undefined) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid end time for update",
                `End time cannot be null or undefined`
            )
        }

        if (endTime < Date.now()) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid end time for update",
                `End time cannot be in the past`
            )
        }

        this.props.endTime = endTime;
        this.touch();
    }

    public changeSeverity(severity : Severity) : void{
        this.props.severity = severity;
        this.touch();
    }

    public changeImpactMode(impactMode : ImpactMode) : void{
        this.props.impactMode = impactMode;
        this.touch();
    }

    public changeDescription(description: string): void {
        if (!description){
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid incident type details",
                "Description is required"
            )
        }
        this.props.description = description;
        this.touch();
    }

    public changeUpComingWindowTimes(windowStartTime : Date, windowEndTime : Date) : void {
        if (this.props.impactMode != "Upcoming"){
            throw new BusinessRuleValidationError(
                IncidentError.NotCompatibleWithUpcomingWindowTimes,
                "Cannot update upcoming window times",
                "Only incident with impactMode = 'Upcoming' are allowed to changes windows time."
            )
        }

        if(this.props.startTime > windowStartTime) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid window start time for update",
                `Window start time ${windowStartTime} cannot be less than the start time ${this.props.startTime} .`
            )
        }

        if (windowStartTime <= windowEndTime) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid window end time for update",
                `Window end time ${windowEndTime} cannot be less than the window start time ${windowStartTime}.`

            )
        }

        this.props.upcomingWindowStartTime = windowStartTime;
        this.props.upcomingWindowEndTime = windowEndTime;
        this.touch();
    }

    private calculateDuration(startTime : Date, endTime: Date) : void {
        this.props.duration = startTime.getTime() - endTime.getTime();
    }

    private static isValidCodeFormat(code: string): boolean {

        return /^INC-2025-\d{4}$/.test(code);
    }

    private static validateTimeWindow(start: Date, end: Date | null): void {
        if (end != null && start >= end) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidTimeWindow,
                "Invalid time window",
                "Start time must be before end time"
            );
        }

        if (start.getTime() < Date.now()) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidTimeWindow,
                "Start time cannot be in the past"
            );
        }
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}