import { Repo } from "../../core/infra/Repo";
import { ComplementaryTask } from "../../domain/complementaryTask/complementaryTask";


export default interface IComplementaryTaskRepo extends Repo<ComplementaryTask> {
    findByCode(code: string): Promise<ComplementaryTask | null>;

    findLastTaskOfYear(year: number): Promise<ComplementaryTask | null>;
}