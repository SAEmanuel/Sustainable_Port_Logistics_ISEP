export type CTStatus =
    | "Scheduled"
    | "InProgress"
    | "Completed";



export interface ComplementaryTask {
    id : string
    code: string;
    category: string;
    staff: string;
    timeStart: Date;
    timeEnd: Date;
    status: CTStatus;
    vve: string;
}