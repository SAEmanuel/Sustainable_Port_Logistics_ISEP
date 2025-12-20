export type Severity = "Minor" | "Major" | "Critical";
export type ImpactMode = "Specific" | "AllOnGoing" | "Upcoming";

export interface Incident {
    id?: string;

    code: string;
    incidentTypeCode: string;
    vveList: string[];

    startTime: string;          // ISO
    endTime: string | null;     // ISO | null
    duration: number | null;

    severity: Severity;
    impactMode: ImpactMode;

    description: string;

    // Se o backend pode devolver vazio/nulo, muda para string | null
    createdByUser: string;

    upcomingWindowStartTime: string | null;
    upcomingWindowEndTime: string | null;

    // Estes estavam a faltar (por isso o TS2335)
    createdAt?: string;
    updatedAt?: string | null;
}
