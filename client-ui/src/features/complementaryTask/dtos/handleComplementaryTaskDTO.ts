import type {CTStatus} from "../domain/complementaryTask.ts";

export interface HandleComplementaryTaskDTO {
    category: string;
    staff: string;
    timeStart: Date;
    timeEnd: Date;
    status: CTStatus;
    vve: string;
}