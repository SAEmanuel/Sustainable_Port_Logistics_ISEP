import { IComplementaryTaskPersistence } from '../../dataschema/IComplementaryTaskPersistence';
import mongoose from 'mongoose';

const ComplementaryTask = new mongoose.Schema(
    {
        domainId: {
            type: String,
            unique: true
        },

        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        category: {
            type: String,
            lowercase: true,
            unique: true,
            index: true,
        },

        staff: {
            type: String,
            required: [true, 'Please enter staff'],
        },

        timeStart: {
            type: Date,
            required: true,
        },

        timeEnd: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            required: [true, 'No status'],
        },

    },
    {
        timestamps: false,
        versionKey: false,
    }
);

export default mongoose.model<IComplementaryTaskPersistence & mongoose.Document>('ComplementaryTask', ComplementaryTask);