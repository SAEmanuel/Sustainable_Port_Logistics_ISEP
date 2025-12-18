import { Service, Inject } from 'typedi';
import IVesselVisitExecutionRepo from "../services/IRepos/IVesselVisitExecutionRepo";
import { VesselVisitExecution } from "../domain/vesselVisitExecution/vesselVisitExecution";
import { IVesselVisitExecutionPersistence } from "../dataschema/IVesselVisitExecutionPersistence";
import { Document, Model } from 'mongoose';
import VesselVisitExecutionMap from "../mappers/VesselVisitExecutionMap";

@Service()
export default class VesselVisitExecutionRepo implements IVesselVisitExecutionRepo {
    constructor(
        @Inject('vesselVisitExecutionSchema')
        private vveSchema: Model<IVesselVisitExecutionPersistence & Document>,
        @Inject('VesselVisitExecutionMap')
        private vesselVisitExecutionMap: VesselVisitExecutionMap

    ) {}

    public async save(vve: VesselVisitExecution): Promise<VesselVisitExecution> {
        const query = { domainId: vve.id.toString() };
        const vvePersistence = this.vesselVisitExecutionMap.toPersistence(vve);

        await this.vveSchema.findOneAndUpdate(query, vvePersistence, { upsert: true, new: true });
        return vve;
    }

    public async findByVvnId(vvnId: string): Promise<VesselVisitExecution | null> {
        const record = await this.vveSchema.findOne({ vvnId });
        return record ? this.vesselVisitExecutionMap.toDomain(record) : null;
    }

    public async getNextSequenceNumber(): Promise<number> {
        const count = await this.vveSchema.countDocuments();
        return count + 1;
    }

    public async exists(vve: VesselVisitExecution): Promise<boolean> { return !!(await this.findByVvnId(vve.vvnId)); }

    public async findAll(): Promise<VesselVisitExecution[]> {
        const records = await this.vveSchema.find();
        return records.map(record => this.vesselVisitExecutionMap.toDomain(record));
    }

}