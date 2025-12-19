import {CTStatus} from "../domain/complementaryTask/ctstatus";


export interface IComplementaryTaskPersistence {
    domainId: string,
    code: string,
    category: string,
    staff: string,
    timeStart: Date,
    timeEnd: Date | null,
    status: CTStatus,
    vve: string,
    createdAt: Date;
    updatedAt: Date | null;
}