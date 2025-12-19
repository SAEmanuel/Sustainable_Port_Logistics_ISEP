import { CTStatus } from "../domain/complementaryTask/ctstatus";

export interface IComplementaryTaskDTO {
    id?: string;
    code?: string;
    category: string;
    staff: string;
    status: CTStatus;
    timeStart: Date;
    timeEnd: Date;
    vve: string;
}

export interface IComplementaryTaskStatusDTO {
    status: CTStatus;
}