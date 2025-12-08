import { IUserPersistence } from '../../dataschema/IUserPersistence';
import mongoose from 'mongoose';

const User = new mongoose.Schema(
    {
        domainId: {
            type: String,
            unique: true
        },

        name: {
            type: String,
            required: [true, 'Please enter name'],
            index: true,
        },

        auth0Id: {
            type: String,
            required: [true, 'Please enter auth0Id'],
            index: true,
        },

        email: {
            type: String,
            lowercase: true,
            unique: true,
            index: true,
        },

        role: {
            type: String,
            default: 'NoRole',
        },
    },
    { timestamps: true },
);

export default mongoose.model<IUserPersistence & mongoose.Document>('User', User);
