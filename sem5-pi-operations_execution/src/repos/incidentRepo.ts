import {Inject, Service} from "typedi";
import {Model, Document} from "mongoose";
import IIncidentRepo from "../services/IRepos/IIncidentRepo";
import IncidentMap from "../mappers/IncidentMap";
import { Incident } from "../domain/incident/incident";
import {IIncidentPersistence} from "../dataschema/IIncidentPersistence";
import { IIncidentDTO } from "../dto/IIncidentDTO";
import {Severity} from "../domain/incidentTypes/severity";

@Service()
export default class IncidentRepo implements IIncidentRepo {
    constructor(
        @Inject("incidentSchema")
        private incidentSchema: Model<IIncidentPersistence & Document>,
        @Inject("IncidentMap")
        private incidentMap: IncidentMap,
        @Inject("logger")
        private logger: any
    ) {
    }

    async findByCode(code: string): Promise<Incident | null> {
        this.logger.debug("Finding Incident by code", { code });

        try {
            const record = await this.incidentSchema.findOne({code});

            if (!record) {
                this.logger.warn("Incident not found by code", {code});
                return null;
            }

            return this.incidentMap.toDomain(record);

        } catch (e) {
            this.logger.error("Error finding Incident by code", {code, error: e});
            return null;
        }
    }

    async findByVVE(vveCode: string): Promise<Incident[]> {
        this.logger.debug("Finding Incident by VVE", {vveCode});

        try {
            const list = await this.incidentSchema.find({ vveList: vveCode });

            return list
                .map(record => this.incidentMap.toDomain(record))
                .filter(i => i != null) as Incident[];

        } catch(e) {
            this.logger.error("Error finding Incident by VVE", {vveCode, error: e});
            return [];
        }
    }

    async findAll(): Promise<Incident[]> {
        this.logger.debug("Finding all Incidents");

        try {
            const list = await this.incidentSchema.find({});

            return list
                .map(record => this.incidentMap.toDomain(record))
                .filter(i => i != null) as Incident[];

        } catch (e) {
            this.logger.error("Error finding all Incidents", {error: e});
            return [];
        }
    }

    async exists(i: Incident): Promise<boolean> {
        const record = await this.incidentSchema.findOne({ id: i.id.toString() });
        return !!record;
    }

    async save(i: Incident): Promise<Incident | null> {
        this.logger.debug("Saving Incident", { code: i.code });

        try {
            const rawPersistence = this.incidentMap.toPersistence(i);

            const existing = await this.incidentSchema.findOne({ id: rawPersistence.id.toString() });

            if (existing) {
                existing.set(rawPersistence);
                await existing.save();

                this.logger.info("Incident updated", { code: i.code });
                return this.incidentMap.toDomain(existing);
            }

            const created = await this.incidentSchema.create(rawPersistence);

            this.logger.info("Incident created", { code: i.code });
            return this.incidentMap.toDomain(created);
        } catch (err) {
            this.logger.error("Error saving Incident", { error: err });
            return null;
        }
    }


    async deleteIncident(incidentCode: string): Promise<void> {
        this.logger.debug("Deleting Incident", { incidentCode });

        try {
            const result = await this.incidentSchema.deleteOne({ code: incidentCode });

            if (result.deletedCount === 0) {
                this.logger.warn("No incident found to delete", { incidentCode });
            } else {
                this.logger.info("Incident deleted", { incidentCode });
            }
        } catch (e) {
            this.logger.error("Error deleting Incident", { incidentCode, error: e });
            throw e;
        }
    }

    // --- UPDATED METHODS BELOW ---

    async getActiveIncidents(): Promise<Incident[]> {
        this.logger.debug("Finding Active Incidents (endTime is null)");

        try {
            // Active = endTime is null
            const list = await this.incidentSchema.find({ endTime: null });

            return list
                .map(record => this.incidentMap.toDomain(record))
                .filter(i => i != null) as Incident[];

        } catch (e) {
            this.logger.error("Error finding Active Incidents", { error: e });
            return [];
        }
    }

    async getResolvedIncidents(): Promise<Incident[]> {
        this.logger.debug("Finding Resolved Incidents (endTime != null AND endTime <= now)");

        try {
            const now = new Date();

            const list = await this.incidentSchema.find({
                endTime: { $ne: null, $lte: now },
            });

            return list
                .map(record => this.incidentMap.toDomain(record))
                .filter((i): i is Incident => i != null);

        } catch (e) {
            this.logger.error("Error finding Resolved Incidents", { error: e });
            return [];
        }
    }

    // -----------------------------

    async getByDataRange(startDateRange: Date, endDateRange: Date): Promise<Incident[]> {
        this.logger.debug("Finding Incidents by Date Range", { start: startDateRange, end: endDateRange });

        try {
            const list = await this.incidentSchema.find({
                startTime: {
                    $gte: startDateRange,
                    $lte: endDateRange
                }
            });

            return list
                .map(record => this.incidentMap.toDomain(record))
                .filter(i => i != null) as Incident[];

        } catch (e) {
            this.logger.error("Error finding Incidents by Date Range", { error: e });
            return [];
        }
    }

    async getBySeverity(severity: Severity): Promise<Incident[]> {
        this.logger.debug("Finding Incidents by Severity", { severity });

        try {
            const list = await this.incidentSchema.find({ severity: severity });

            return list
                .map(record => this.incidentMap.toDomain(record))
                .filter(i => i != null) as Incident[];

        } catch (e) {
            this.logger.error("Error finding Incidents by Severity", { error: e });
            return [];
        }
    }
}