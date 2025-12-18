import { Severity } from "../incidentTypes/severity";
import { ImpactMode } from "./impactMode";
import { AggregateRoot } from "../../core/domain/AggregateRoot";
import { UniqueEntityID } from "../../core/domain/UniqueEntityID";
import { IncidentId } from "./incidentId";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import { IncidentError } from "./errors/incidentErrors";
import { Guard } from "../../core/logic/Guard";
import { IncidentType } from "../incidentTypes/incidentType";

interface IncidentProps {
    code: string;
    incidentTypeCode: string;
    vveList: string[];

    startTime: Date;
    endTime: Date | null;
    duration: number | null;

    severity: Severity;
    impactMode: ImpactMode;

    description: string;
    createdByUser: string;

    upcomingWindowStartTime: Date | null;
    upcomingWindowEndTime: Date | null;

    createdAt: Date;
    updatedAt: Date | null;
}

export class Incident extends AggregateRoot<IncidentProps> {
    get id(): UniqueEntityID {
        return this._id;
    }

    get incidentId(): IncidentId {
        return IncidentId.caller(this.id);
    }

    get code(): string {
        return this.props.code;
    }

    get incidentTypeCode(): string {
        return this.props.incidentTypeCode;
    }

    get vveList(): string[] {
        return this.props.vveList;
    }

    get startTime(): Date {
        return this.props.startTime;
    }

    get endTime(): Date | null {
        return this.props.endTime;
    }

    get duration(): number | null {
        return this.props.duration;
    }

    get severity(): Severity {
        return this.props.severity;
    }

    get impactMode(): ImpactMode {
        return this.props.impactMode;
    }

    get description(): string {
        return this.props.description;
    }

    get createdByUser(): string {
        return this.props.createdByUser;
    }

    get upcomingWindowStartTime(): Date | null {
        return this.props.upcomingWindowStartTime;
    }

    get upcomingWindowEndTime(): Date | null {
        return this.props.upcomingWindowEndTime;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date | null {
        return this.props.updatedAt;
    }

    private constructor(props: IncidentProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: IncidentProps, id?: UniqueEntityID): Incident {
        const guardedProps = [
            { argument: props.code, argumentName: "code" },
            { argument: props.incidentTypeCode, argumentName: "incidentTypeCode" },
            { argument: props.startTime, argumentName: "startTime" },
            { argument: props.severity, argumentName: "severity" },
            { argument: props.impactMode, argumentName: "impactMode" },
            { argument: props.description, argumentName: "description" },
            { argument: props.createdByUser, argumentName: "createdByUser" },
            { argument: props.createdAt, argumentName: "createdAt" },
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);
        if (!guardResult.succeeded) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid incident details",
                guardResult.message ?? "Invalid input"
            );
        }

        if (!this.isValidCodeFormat(props.code)) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidCodeFormat,
                "Invalid incident format for code",
                "Code must follow the format INC-YYYY-#####"
            );
        }

        if (!IncidentType.isValidCodeFormat(props.incidentTypeCode)) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidCodeFormat,
                "Invalid incident type format for code",
                "Code must follow the format T-INC###"
            );
        }

        const normalizedVves = this.normalizeVveList(props.vveList);

        // Basic time consistency (do NOT block “start in the past”; not required by spec)
        this.validateTimeWindow(props.startTime, props.endTime);

        // Enforce invariants based on impact mode
        this.validateScopeRules(props.impactMode, normalizedVves);

        // Upcoming window rules (only if Upcoming)
        const upcomingWindowStartTime = props.upcomingWindowStartTime ?? null;
        const upcomingWindowEndTime = props.upcomingWindowEndTime ?? null;
        this.validateUpcomingWindowRules(
            props.impactMode,
            props.startTime,
            props.endTime,
            upcomingWindowStartTime,
            upcomingWindowEndTime
        );

        // Duration is ALWAYS derived (minutes) when endTime exists
        const derivedDuration =
            props.endTime != null ? this.computeDurationMinutes(props.startTime, props.endTime) : null;

        return new Incident(
            {
                ...props,
                vveList: normalizedVves,
                endTime: props.endTime ?? null,
                duration: derivedDuration,
                upcomingWindowStartTime,
                upcomingWindowEndTime,
                updatedAt: props.updatedAt ?? null,
            },
            id
        );
    }

    public static rehydrate(props: IncidentProps, id: UniqueEntityID): Incident {
        return new Incident(props, id);
    }

    // ---------------------------
    // Mutations (with invariants)
    // ---------------------------

    public changeIncidentTypeCode(incidentTypeCode: string): void {
        if (!IncidentType.isValidCodeFormat(incidentTypeCode)) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidCodeFormat,
                "Invalid incident type format for code",
                "Code must follow the format T-INC###"
            );
        }
        this.props.incidentTypeCode = incidentTypeCode;
        this.touch();
    }

    public changeVVEList(vveList : string[]): void {
        this.props.vveList = vveList;
    }

    public changeStartTime(startTime: Date): void {
        if (startTime === null || startTime === undefined) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid start time for update",
                "Start time cannot be null or undefined"
            );
        }

        Incident.validateTimeWindow(startTime, this.props.endTime);
        this.props.startTime = startTime;

        // Revalidate upcoming window constraints after shifting start
        Incident.validateUpcomingWindowRules(
            this.props.impactMode,
            this.props.startTime,
            this.props.endTime,
            this.props.upcomingWindowStartTime,
            this.props.upcomingWindowEndTime
        );

        // Recompute duration if resolved
        if (this.props.endTime) this.props.duration = Incident.computeDurationMinutes(this.props.startTime, this.props.endTime);
        else this.props.duration = null;

        this.touch();
    }

    public markAsResolved(): void {
        this.changeEndTime(new Date(Date.now()));
        this.touch();
    }

    private changeEndTime(endTime: Date | null): void {
        if (endTime === undefined) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid end time for update",
                "End time cannot be undefined"
            );
        }

        Incident.validateTimeWindow(this.props.startTime, endTime);
        this.props.endTime = endTime;

        // Revalidate upcoming window constraints after changing end
        Incident.validateUpcomingWindowRules(
            this.props.impactMode,
            this.props.startTime,
            this.props.endTime,
            this.props.upcomingWindowStartTime,
            this.props.upcomingWindowEndTime
        );

        // Duration is derived
        if (endTime) this.props.duration = Incident.computeDurationMinutes(this.props.startTime, endTime);
        else this.props.duration = null;

        this.touch();
    }

    public changeSeverity(severity: Severity): void {
        this.props.severity = severity;
        this.touch();
    }

    public changeImpactMode(impactMode: ImpactMode): void {
        this.props.impactMode = impactMode;

        // Enforce scope invariants immediately
        Incident.validateScopeRules(this.props.impactMode, this.props.vveList);

        // If leaving Upcoming, clear windows (recommended)
        if (!Incident.isUpcomingMode(this.props.impactMode)) {
            this.props.upcomingWindowStartTime = null;
            this.props.upcomingWindowEndTime = null;
        } else {
            // If switching to Upcoming, require windows to be present (caller should set them)
            Incident.validateUpcomingWindowRules(
                this.props.impactMode,
                this.props.startTime,
                this.props.endTime,
                this.props.upcomingWindowStartTime,
                this.props.upcomingWindowEndTime
            );
        }

        this.touch();
    }

    public changeDescription(description: string): void {
        if (!description) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid incident details",
                "Description is required"
            );
        }
        this.props.description = description;
        this.touch();
    }

    public changeUpComingWindowTimes(windowStartTime: Date, windowEndTime: Date): void {
        if (!Incident.isUpcomingMode(this.props.impactMode)) {
            throw new BusinessRuleValidationError(
                IncidentError.NotCompatibleWithUpcomingWindowTimes,
                "Cannot update upcoming window times",
                "Only incidents with impactMode = 'Upcoming' can change window times."
            );
        }

        Incident.validateUpcomingWindowRules(
            this.props.impactMode,
            this.props.startTime,
            this.props.endTime,
            windowStartTime,
            windowEndTime
        );

        this.props.upcomingWindowStartTime = windowStartTime;
        this.props.upcomingWindowEndTime = windowEndTime;
        this.touch();
    }

    // Optional helpers for attach/detach in SPECIFIC mode
    public addAffectedVve(vveId: string): void {
        const v = Incident.normalizeVveId(vveId);
        if (!v) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid VVE id",
                "VVE id cannot be empty"
            );
        }

        this.props.vveList = Incident.normalizeVveList([...this.props.vveList, v]);
        Incident.validateScopeRules(this.props.impactMode, this.props.vveList);
        this.touch();
    }

    public removeAffectedVve(vveId: string): void {
        const v = Incident.normalizeVveId(vveId);
        this.props.vveList = this.props.vveList.filter((x) => x !== v);
        Incident.validateScopeRules(this.props.impactMode, this.props.vveList);
        this.touch();
    }

    // ---------------------------
    // Private validations/helpers
    // ---------------------------

    private static computeDurationMinutes(startTime: Date, endTime: Date): number {
        const ms = endTime.getTime() - startTime.getTime();
        return Math.floor(ms / 60000);
    }

    private static isValidCodeFormat(code: string): boolean {
        // INC-YYYY-##### (5 digits)
        return /^INC-\d{4}-\d{5}$/.test(code);
    }

    private static validateTimeWindow(start: Date, end: Date | null): void {
        if (end != null && end.getTime() < start.getTime()) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidTimeWindow,
                "Invalid time window",
                "End time must be after or equal to start time"
            );
        }
    }

    private static isUpcomingMode(mode: ImpactMode): boolean {
        // Prefer enum usage, but keep string-safe fallback to avoid brittle comparisons.
        return (mode as unknown as string) === "Upcoming" || (mode as unknown as string) === "UPCOMING";
    }

    private static isSpecificMode(mode: ImpactMode): boolean {
        // Adjust to your actual enum values if needed.
        const v = mode as unknown as string;
        return v === "Specific" || v === "SPECIFIC" || v === "SpecificVVEs" || v === "SPECIFIC_VVES";
    }

    private static validateScopeRules(impactMode: ImpactMode, vveList: string[]): void {
        if (Incident.isSpecificMode(impactMode) && (!vveList || vveList.length === 0)) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid details for impact mode type specific incident",
                "When impact mode is 'Specific', vveList must contain at least one VVE id."
            );
        }
    }

    private static validateUpcomingWindowRules(
        impactMode: ImpactMode,
        startTime: Date,
        endTime: Date | null,
        windowStart: Date | null,
        windowEnd: Date | null
    ): void {
        if (!Incident.isUpcomingMode(impactMode)) return;

        if (windowStart == null || windowEnd == null) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid details for impact mode type upcoming incident",
                "When impact mode is 'Upcoming', window start/end time cannot be null."
            );
        }

        if (windowStart.getTime() < startTime.getTime()) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid details for impact mode type upcoming incident",
                "Upcoming window start time must be greater than or equal to incident start time."
            );
        }

        if (windowStart.getTime() > windowEnd.getTime()) {
            throw new BusinessRuleValidationError(
                IncidentError.InvalidInput,
                "Invalid details for impact mode type upcoming incident",
                "Upcoming window start time cannot be greater than window end time."
            );
        }

        if (endTime != null) {
            if (windowStart.getTime() > endTime.getTime() || windowEnd.getTime() > endTime.getTime()) {
                throw new BusinessRuleValidationError(
                    IncidentError.InvalidInput,
                    "Invalid details for impact mode type upcoming incident",
                    "Upcoming window must be within the incident time interval when endTime is set."
                );
            }
        }
    }

    private static normalizeVveId(vveId: string): string {
        return (vveId ?? "").trim();
    }

    private static normalizeVveList(vveList: string[] | null | undefined): string[] {
        const list = Array.isArray(vveList) ? vveList : [];
        const normalized = list.map(Incident.normalizeVveId).filter((x) => x.length > 0);
        // de-duplicate while preserving order
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const v of normalized) {
            if (!seen.has(v)) {
                seen.add(v);
                unique.push(v);
            }
        }
        return unique;
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}
