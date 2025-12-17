import {Inject, Service} from "typedi";
import {Model, Document} from "mongoose";
import IIncidentRepo from "../services/IRepos/IIncidentRepo";
import IncidentMap from "../mappers/IncidentMap";
import { Incident } from "../domain/incident/incident";
import {IIncidentPersistence} from "../dataschema/IIncidentPersistence";

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

    async exists(i: Incident): Promise<boolean> {
        const record = await this.incidentSchema.findOne({domainId: i.id.toString()});
        return !!record;
    }
    async save(i: Incident): Promise<Incident | null> {

        const rawPersistence = this.incidentMap.toPersistence(i);

        this.logger.debug("Saving Incident", {
            code: i.code
        });

        try{
            const existing = await this.incidentSchema.findOne({id: rawPersistence.id.toString()});

            if (existing){
                existing.set(rawPersistence);
                await existing.save();

                this.logger.info("Incident updated", {
                    code: i.code
                });
                return this.incidentMap.toDomain(existing);
            }

            const created = await this.incidentSchema.create(rawPersistence);

            this.logger.info("Incident created", {
                code: i.code
            });

            return this.incidentMap.toDomain(created);

        }catch(err){
            this.logger.error(
                "Error saving Incident",
                {error: err}
            );
            return null;
        }
    }
}