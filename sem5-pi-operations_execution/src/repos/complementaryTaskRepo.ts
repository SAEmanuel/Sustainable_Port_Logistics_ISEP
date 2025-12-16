import IComplementaryTaskRepo from "../services/IRepos/IComplementaryTaskRepo";
import { Inject, Service } from "typedi";
import { ComplementaryTask } from "../domain/complementaryTask/complementaryTask";
import { IComplementaryTaskPersistence } from "../dataschema/IComplementaryTaskPersistence";
import { Document, Model } from "mongoose";
import { ComplementaryTaskMap } from "../mappers/ComplementaryTaskMap";

@Service()
export default class ComplementaryTaskRepo implements IComplementaryTaskRepo {
  constructor(
    @Inject("complementaryTaskSchema") private complementaryTaskSchema: Model<IComplementaryTaskPersistence & Document>,
    @Inject("logger") private logger: any
  ) {}

  public async exists(task: ComplementaryTask): Promise<boolean> {
    const id = task.id.toString();
    const record = await this.complementaryTaskSchema.findOne({ domainId: id });
    return !!record;
  }

  public async save(task: ComplementaryTask): Promise<ComplementaryTask | null> {
    try {
      const rawTask = ComplementaryTaskMap.toPersistence(task);
      const existing = await this.complementaryTaskSchema.findOne({ code: rawTask.code });
      let persistedDoc;

      if (existing) {
        existing.category = rawTask.category;
        existing.staff = rawTask.staff;
        existing.timeStart = rawTask.timeStart;
        existing.timeEnd = rawTask.timeEnd;
        existing.status = rawTask.status;
        await existing.save();
        persistedDoc = existing;
      } else {
        const created = await this.complementaryTaskSchema.create(rawTask);
        persistedDoc = created;
      }

      return ComplementaryTaskMap.toDomain(persistedDoc);
    } catch (err) {
      this.logger.error("Error in ComplementaryTaskRepo.save:", err);
      throw err;
    }
  }

  public async findByCode(code: string): Promise<ComplementaryTask | null> {
    const taskRecord = await this.complementaryTaskSchema.findOne({ code });
    return taskRecord ? ComplementaryTaskMap.toDomain(taskRecord) : null;
  }

  //to generate ct code
  public async findLastTaskOfYear(year: number): Promise<ComplementaryTask | null> {
  const taskRecord = await this.complementaryTaskSchema
    .findOne({
      code: { $regex: `^CT-${year}-` }
    })
    .sort({ code: -1 }) // highest sequence comes last lexicographically
    .exec();

  return taskRecord ? ComplementaryTaskMap.toDomain(taskRecord) : null;
}
}
