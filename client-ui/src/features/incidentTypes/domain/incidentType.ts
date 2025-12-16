export type Severity = "Minor" | "Major" | "Critical";

export interface IncidentType {
    id: string;
    code: string;              // T-INC001
    name: string;
    description: string;
    severity: Severity;
    parentCode: string | null; // null = root
}
