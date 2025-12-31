import mongoose from "mongoose";

const OperationPlanChangeLogSchema = new mongoose.Schema(
    {
        planDomainId: { type: String, required: true, index: true },
        vvnId: { type: String, required: true, index: true },
        changedAt: { type: Date, required: true, default: Date.now },
        author: { type: String, required: true },
        reasonForChange: { type: String, required: true },
        before: { type: mongoose.Schema.Types.Mixed, required: true },
        after: { type: mongoose.Schema.Types.Mixed, required: true }
    },
    { versionKey: false }
);

export default mongoose.model("OperationPlanChangeLog", OperationPlanChangeLogSchema);
