import type {CTStatus} from "../domain/complementaryTask.ts";

export interface ComplementaryTaskDTO {
    id : string
    code: string;
    category: string;
    staff: string;
    timeStart: Date;
    timeEnd: Date;
    status: CTStatus;
    vve: string;
}