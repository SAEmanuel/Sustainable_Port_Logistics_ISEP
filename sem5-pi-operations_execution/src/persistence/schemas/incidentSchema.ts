import mongoose from "mongoose";
import {IIncidentPersistence} from "../../dataschema/IIncidentPersistence";

const IncidentSchema = new mongoose.Schema({
    id :{
        type: String,
        unique: true,
        index: true,
        required: true
    },

    code :{
        type: String,
        required: true,
        unique: true,
        index: true
    },

    incidentTypeCode :{
        type: String,
        required: true,
        index: true
    },


    startTime     :{
        type: Date,
        required: true
    },

    endTime     :{
        type: Date,
        required: false
    },

    duration     :{
        type: Number,
        required: false
    },

    severity     :{
        type: String,
        required: true
    },

    impactMode     :{
        type: String,
        required: true
    },

    description    :{
        type: String,
        required: true
    },

    createdByUser     :{
        type: String,
        required: true
    },

    upcomingWindowStartTime     :{
        type: Date,
        required: false
    },

    upcomingWindowEndTime     :{
        type: Date,
        required: false
    },

    createdAt     :{
        type: Date,
        required: true
    },

    updatedAt     :{
        type: Date,
        required: false
    }
},
    {
        timestamps: false,
        versionKey: false
    }
);

export default mongoose.model<IIncidentPersistence & mongoose.Document>('Incident', IncidentSchema);