import mongoose from "mongoose";
import config from "../config";

export default async () => {
    try {
        await mongoose.connect(config.databaseURL);
        return mongoose.connection;
    } catch (e) {
        console.error("Could not connect to Mongo:", e);
        throw e;
    }
};