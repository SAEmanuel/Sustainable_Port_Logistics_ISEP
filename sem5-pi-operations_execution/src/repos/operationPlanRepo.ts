import { Service, Inject } from 'typedi';
import { Document, Model } from 'mongoose';
import { IOperationPlanDTO } from '../dto/IOperationPlanDTO';
import { OperationPlan } from '../domain/operationPlan/operationPlan';
import OperationPlanMap from '../mappers/OperationPlanMap';

@Service()
export default class OperationPlanRepo {
    constructor(
        @Inject('operationPlanSchema') private schema: Model<IOperationPlanDTO & Document>,
        @Inject('OperationPlanMap')
        private operationPlanMap: OperationPlanMap
    ) {}

    public async findByDomainId(domainId: string): Promise<OperationPlan | null> {
        const record = await this.schema.findOne({ domainId });
        if (!record) return null;
        return this.operationPlanMap.toDomain(record);
    }

    public async exists(plan: OperationPlan): Promise<boolean> {
        const idX = plan.id instanceof String ? plan.id : plan.id.toValue();
        const query = { domainId: plan.id.toString() };
        const record = await this.schema.findOne(query);
        return !!record;
    }

    public async save(plan: OperationPlan): Promise<OperationPlan> {
        const query = { domainId: plan.id.toString() };
        const persistenceMap = this.operationPlanMap.toPersistence(plan);

        const document = await this.schema.findOne(query);

        if (document) {
            document.set(persistenceMap);
            await document.save();
        } else {
            await this.schema.create(persistenceMap);
        }

        return plan;
    }

    public async search(startDate?: Date, endDate?: Date, vessel?: string): Promise<OperationPlan[]> {
        const query: any = {};

        const toDate = (d: any) => {
            if (!d) return null;
            const dateObj = new Date(d);
            return isNaN(dateObj.getTime()) ? null : dateObj;
        };

        const start = toDate(startDate);
        const end = toDate(endDate);

        let userWindowStart: number | null = null;
        let userWindowEnd: number | null = null;

        if (start || end) {
            query.planDate = {};

            if (start) userWindowStart = start.getTime();
            if (end) userWindowEnd = end.getTime();

            if (start) {
                const lookbehindDate = new Date(start);
                lookbehindDate.setDate(lookbehindDate.getDate() - 1);
                query.planDate.$gte = lookbehindDate;
            }

            if (end) {
                query.planDate.$lte = end;
            }

            if (!start && end) {
                const specificDayStart = new Date(end);
                specificDayStart.setHours(0,0,0,0);
                userWindowStart = specificDayStart.getTime();

                const lookbehind = new Date(specificDayStart);
                lookbehind.setDate(lookbehind.getDate() - 1);
                query.planDate.$gte = lookbehind;
            }
        }

        if (vessel && vessel.trim().length > 0) {
            query['operations.vessel'] = { $regex: vessel, $options: 'i' };
        }

        const records = await this.schema.find(query).sort({ planDate: -1, createdAt: -1 });

        const validPlans = records.map(record => {
            try { return this.operationPlanMap.toDomain(record); } catch (e) { return null; }
        }).filter(p => p !== null) as OperationPlan[];

        return validPlans.filter(plan => {
            if (!userWindowStart && !userWindowEnd) return true;

            const planDate = new Date(plan.planDate);
            planDate.setHours(0,0,0,0);
            const planTime = planDate.getTime();

            const isInsideWindow =
                (!userWindowStart || planTime >= userWindowStart) &&
                (!userWindowEnd || planTime <= userWindowEnd);

            if (isInsideWindow) return true;

            if (userWindowStart && planTime < userWindowStart) {
                const diffTime = Math.abs(userWindowStart - planTime);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const hoursThreshold = diffDays * 24;

                const hasOverflow = plan.operations.some(op => (op.realDepartureTime || 0) >= hoursThreshold);
                return hasOverflow;
            }

            return false;
        });
    }
}