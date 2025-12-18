import IComplementaryTaskRepo from "../services/IRepos/IComplementaryTaskRepo";
import { Inject, Service } from "typedi";
import { Document, Model } from "mongoose";
import ComplementaryTaskMap from "../mappers/ComplementaryTaskMap";
import { IComplementaryTaskPersistence } from "../dataschema/IComplementaryTaskPersistence";
import { ComplementaryTask } from "../domain/complementaryTask/complementaryTask";
import { ComplementaryTaskCategoryId } from "../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import { ComplementaryTaskCode } from "../domain/complementaryTask/ComplementaryTaskCode";
import { VesselVisitExecutionId } from "../domain/vesselVisitExecution/vesselVisitExecutionId";
import { CTStatus } from "../domain/complementaryTask/ctstatus";

@Service()
export default class ComplementaryTaskRepo implements IComplementaryTaskRepo {

    constructor(
        @Inject("complementaryTaskSchema")
        private complementaryTaskSchema: Model<IComplementaryTaskPersistence & Document>,

        @Inject("ComplementaryTaskMap")
        private complementaryTaskMap: ComplementaryTaskMap,

        @Inject("logger")
        private logger: any
    ) {}


    public async exists(task: ComplementaryTask): Promise<boolean> {
        const record = await this.complementaryTaskSchema.findOne({
            domainId: task.id.toString()
        });
        return !!record;
    }

    public async save(task: ComplementaryTask): Promise<ComplementaryTask | null> {
        const raw = this.complementaryTaskMap.toPersistence(task);

        try {
            const existing = await this.complementaryTaskSchema.findOne({
                domainId: raw.domainId
            });

            if (existing) {
                existing.set(raw);
                await existing.save();
                return this.complementaryTaskMap.toDomain(existing);
            }

            const created = await this.complementaryTaskSchema.create(raw);
            return this.complementaryTaskMap.toDomain(created);

        } catch (e) {
            this.logger.error("Error saving ComplementaryTask", { e });
            return null;
        }
    }


    public async findAll(): Promise<ComplementaryTask[]> {
        const now = new Date();

        const records = await this.complementaryTaskSchema.find();

        for (const r of records) {
            if (r.status !== CTStatus.Completed && r.timeEnd.getTime() < now.getTime()) {
                r.status = CTStatus.Completed;
                await r.save();
            }
        }

        return records
            .map(r => this.complementaryTaskMap.toDomain(r))
            .filter(Boolean) as ComplementaryTask[];
    }

    public async findByCategory(category: ComplementaryTaskCategoryId): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema.find({
            category: category.id.toString()
        });

        return records
            .map(r => this.complementaryTaskMap.toDomain(r))
            .filter(Boolean) as ComplementaryTask[];
    }

    public async findByCode(code: ComplementaryTaskCode): Promise<ComplementaryTask | null> {
        const record = await this.complementaryTaskSchema.findOne({
            code: code.value
        });

        return record ? this.complementaryTaskMap.toDomain(record) : null;
    }

    public async findByStaff(staff: string): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema.find({ staff });
        return records
            .map(r => this.complementaryTaskMap.toDomain(r))
            .filter(Boolean) as ComplementaryTask[];
    }

    public async findByVve(vve: VesselVisitExecutionId): Promise<ComplementaryTask | null> {
        const record = await this.complementaryTaskSchema.findOne({
            vve: vve.id.toString()
        });

        return record ? this.complementaryTaskMap.toDomain(record) : null;
    }

    public async findCompleted(): Promise<ComplementaryTask[]> {
        return this.findByStatus(CTStatus.Completed);
    }

    public async findInProgress(): Promise<ComplementaryTask[]> {
        return this.findByStatus(CTStatus.InProgress);
    }

    public async findScheduled(): Promise<ComplementaryTask[]> {
        return this.findByStatus(CTStatus.Scheduled);
    }

    private async findByStatus(status: CTStatus): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema.find({ status });
        return records
            .map(r => this.complementaryTaskMap.toDomain(r))
            .filter(Boolean) as ComplementaryTask[];
    }

    public async findInRange(start: Date, end: Date): Promise<ComplementaryTask[]> {
        const records = await this.complementaryTaskSchema.find({
            timeStart: { $lt: end },
            timeEnd: { $gt: start }
        });

        return records
            .map(r => this.complementaryTaskMap.toDomain(r))
            .filter(Boolean) as ComplementaryTask[];
    }


    public async getNextSequenceNumber(): Promise<number> {
        const count = await this.complementaryTaskSchema.countDocuments();
        return count + 1;
    }
}