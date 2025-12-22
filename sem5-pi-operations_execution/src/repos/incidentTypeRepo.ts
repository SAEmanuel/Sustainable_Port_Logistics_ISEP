import {Inject, Service} from "typedi";
import {Model, Document} from "mongoose";
import IIncidentTypeRepository from "../services/IRepos/IIncidentTypeRepository";
import IncidentTypeMap from "../mappers/IncidentTypeMap";
import {IIncidentTypePersistence} from "../dataschema/IIncidentTypePersistence";
import { IncidentType } from "../domain/incidentTypes/incidentType";


@Service()
export default class IncidentTypeRepo implements IIncidentTypeRepository {

    constructor(
        @Inject("incidentTypeSchema")
        private incidentTypeSchema: Model<IIncidentTypePersistence & Document>,
        @Inject("IncidentTypeMap")
        private incidentTypeMap: IncidentTypeMap,
        @Inject("logger")
        private logger: any
    ) {
    }

    async getAllAsyn(): Promise<IncidentType[]> {
        this.logger.debug("Finding all Incidents Types");

        try {
            const list = await this.incidentTypeSchema.find({});

            return list
                .map(record => this.incidentTypeMap.toDomain(record))
                .filter(i => i != null) as IncidentType[];

        } catch (e) {
            this.logger.error("Error finding all Incidents Types", {error: e});
            return [];
        }    }

    async removeType(incidentTypeCode: string): Promise<number> {
        this.logger.debug("Deleting Incident Type", { incidentTypeCode });

        const result = await this.incidentTypeSchema.deleteOne({ code: incidentTypeCode });
        return result.deletedCount ?? 0;
    }


    public async exists(it: IncidentType): Promise<boolean> {
        const record = await this.incidentTypeSchema.findOne({domainId: it.id.toString()});
        return !!record;
    }

    public async save(incidentType: IncidentType): Promise<IncidentType | null> {
        const rawPersistence = this.incidentTypeMap.toPersistence(incidentType);

        this.logger.debug("Saving Incident Type", {
            code: incidentType.code
        });

        try{
            const existing = await this.incidentTypeSchema.findOne({domainId: rawPersistence.domainId});

            if (existing) {
                existing.set(rawPersistence);
                await existing.save();

                this.logger.info("Incident Type updated", {
                    code: incidentType.code
                });
                return this.incidentTypeMap.toDomain(existing);
            }

            const created = await this.incidentTypeSchema.create(
                rawPersistence
            );

            this.logger.info("Incident Type created", {
                code: incidentType.code
            });

            return this.incidentTypeMap.toDomain(created);

        }catch(err){
            this.logger.error(
                "Error saving Incident Type",
                {error: err}
            );
            return null;
        }
    }


    public async findByCode(code: string): Promise<IncidentType | null> {
        this.logger.debug("Finding IncidentType by code", {
            code
        });

        try {
            const record = await this.incidentTypeSchema.findOne({code});

            if (!record) {
                this.logger.warn(
                    "Incident type not found by code",
                    {code}
                );
                return null;
            }

            return this.incidentTypeMap.toDomain(record);

        } catch (e) {
            this.logger.error(
                "Error finding Incident type by code",
                {code, error: e}
            );
            return null;
        }
    }


    public async findByName(name: string): Promise<IncidentType[]> {
        this.logger.debug("Finding IncidentType by name", {
            name
        });

        const records =
            await this.incidentTypeSchema.find({
                name: {$regex: name, $options: "i"}
            });

        return records
            .map(r => this.incidentTypeMap.toDomain(r))
            .filter((c): c is IncidentType => c !== null);
    }


    public async getDirectChilds(parentCode: string): Promise<IncidentType[]> {
        this.logger.debug("Getting direct children for IncidentType", { parentCode });

        try {
            const records = await this.incidentTypeSchema
                .find({ parent: parentCode }) // <-- CAMPO CERTO: parent
                .sort({ code: 1 })
                .exec();

            return records
                .map(r => this.incidentTypeMap.toDomain(r as any))
                .filter((it): it is IncidentType => it !== null);

        } catch (err) {
            this.logger.error("Error getting direct children", { parentCode, error: err });
            return [];
        }
    }

    public async getSubTreeFromParentNode(parentCode: string): Promise<IncidentType[]> {
        this.logger.debug("Getting subtree for IncidentType", { parentCode });

        try {
            const fromCollection = this.incidentTypeSchema.collection.name;

            const result = await this.incidentTypeSchema.aggregate([
                { $match: { code: parentCode } },
                {
                    $graphLookup: {
                        from: fromCollection,
                        startWith: "$code",
                        connectFromField: "code",
                        connectToField: "parent",     // <-- CAMPO CERTO: parent
                        as: "descendants",
                        depthField: "depth"
                    }
                },
                { $project: { descendants: 1, _id: 0 } }
            ]).exec();

            if (!result || result.length === 0) {
                this.logger.warn("Parent incident type not found for subtree", { parentCode });
                return [];
            }

            const descendants = (result[0].descendants ?? []) as Array<IIncidentTypePersistence & { depth?: number }>;

            // Ordenação opcional: primeiro por nível, depois por código
            descendants.sort(
                (a, b) => (a.depth ?? 0) - (b.depth ?? 0) || String(a.code).localeCompare(String(b.code))
            );

            return descendants
                .map(d => this.incidentTypeMap.toDomain(d))
                .filter((it): it is IncidentType => it !== null);

        } catch (err) {
            this.logger.error("Error getting subtree", { parentCode, error: err });
            return [];
        }
    }

    public async getRootTypes(): Promise<IncidentType[]> {
        this.logger.debug("Getting root Incident Types");

        try {
            // Abrange os dois cenários:
            // - parent explicitamente null
            // - parent não definido (documentos antigos)
            const records = await this.incidentTypeSchema
                .find({ $or: [{ parent: null }, { parent: { $exists: false } }] })
                .sort({ code: 1 })
                .exec();

            return records
                .map(r => this.incidentTypeMap.toDomain(r as any))
                .filter((it): it is IncidentType => it !== null);

        } catch (err) {
            this.logger.error("Error getting root Incident Types", { error: err });
            return [];
        }
    }

}