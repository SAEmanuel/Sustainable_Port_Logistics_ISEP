import {IComplementaryTaskCategoryPersistence} from '../../dataschema/IComplementaryTaskCategoryPersistance';
import mongoose from 'mongoose';

const ComplementaryTaskCategorySchema = new mongoose.Schema(
    {
        domainId: {
            type: String,
            unique: true,
            index: true,
            required: true
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

        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        defaultDuration: {
            type: Number,
            required: false
        },

        isActive: {
            type: Boolean,
            required: true,
            default: true
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

export default mongoose.model<IComplementaryTaskCategoryPersistence & mongoose.Document>('ComplementaryTaskCategory', ComplementaryTaskCategorySchema);