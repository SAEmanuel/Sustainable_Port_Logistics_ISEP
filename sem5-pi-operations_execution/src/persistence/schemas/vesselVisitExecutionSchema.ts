import { IVesselVisitExecutionPersistence } from '../../dataschema/IVesselVisitExecutionPersistence';
import mongoose from 'mongoose';

const VesselVisitExecutionSchema = new mongoose.Schema(
    {
        domainId: { type: String, unique: true },
        code: { type: String, unique: true },
        vvnId: { type: String, unique: true, index: true },
        vesselImo: { type: String, required: true },

        actualArrivalTime: { type: Date, required: true },

        actualBerthTime: { type: Date, required: false },
        actualDockId: { type: String, required: false },
        dockDiscrepancyNote: { type: String, required: false },

        updatedAt: { type: Date, required: false },
        auditLog: {
            type: [
                {
                    at: { type: Date, required: true },
                    by: { type: String, required: true },
                    action: { type: String, required: true },
                    changes: { type: Object, required: false },
                    note: { type: String, required: false },
                },
            ],
            default: [],
        },
        executedOperations: {
            type: [
                {
                    plannedOperationId: { type: String, required: true },
                    actualStart: { type: Date, required: false },
                    actualEnd: { type: Date, required: false },
                    resourcesUsed: {
                        type: [
                            {
                                resourceId: { type: String, required: true },
                                quantity: { type: Number, required: false },
                                hours: { type: Number, required: false },
                            },
                        ],
                        default: [],
                    },
                    status: { type: String, required: true },
                    note: { type: String, required: false },
                    updatedAt: { type: Date, required: true },
                    updatedBy: { type: String, required: true },
                },
            ],
            default: [],
        },

        creatorEmail: { type: String, required: true },
        status: { type: String, required: true },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

export default mongoose.model<IVesselVisitExecutionPersistence & mongoose.Document>(
    'VesselVisitExecution',
    VesselVisitExecutionSchema
);
