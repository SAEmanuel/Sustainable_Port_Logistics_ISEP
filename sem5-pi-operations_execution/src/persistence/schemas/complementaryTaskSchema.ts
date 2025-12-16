import mongoose from "mongoose";
import { IComplementaryTaskPersistence } from "../../dataschema/IComplementaryTaskPersistence";
import { CTStatus } from "../../domain/complementaryTask/ctstatus";

const ComplementaryTaskSchema = new mongoose.Schema(
    {
        domainId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        code: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        category: {
            type: String,
            required: true,
            index: true
        },

        staff: {
            type: String,
            required: true,
            index: true
        },

        timeStart: {
            type: Date,
            required: true
        },

        timeEnd: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            required: true,
            enum: Object.values(CTStatus)
        },

        vve: {
            type: String,
            required: true,
            index: true
        },

        createdAt: {
            type: Date,
            required: true
        },

        updatedAt: {
            type: Date,
            required: false
        }
    },
    {
        timestamps: false,
        versionKey: false
    }
);

export default mongoose.model<IComplementaryTaskPersistence & mongoose.Document>("ComplementaryTask", ComplementaryTaskSchema);