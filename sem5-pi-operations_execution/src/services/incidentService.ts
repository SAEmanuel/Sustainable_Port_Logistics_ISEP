import {Inject, Service} from "typedi";
import IIncidentService from "./IServices/IIncidentService";
import IIncidentRepo from "./IRepos/IIncidentRepo";
import IncidentMap from "../mappers/IncidentMap";
import {Logger} from "winston";
import {IIncidentDTO} from "../dto/IIncidentDTO";
import {Result} from "../core/logic/Result";
import {BusinessRuleValidationError} from "../core/logic/BusinessRuleValidationError";
import {IncidentTypeError} from "../domain/incidentTypes/errors/incidentTypeErrors";
import {IncidentError} from "../domain/incident/errors/incidentErrors";
import {Incident} from "../domain/incident/incident";
import IIncidentTypeRepository from "./IRepos/IIncidentTypeRepository";
import {Severity, SeverityFactory} from "../domain/incidentTypes/severity";
import {ImpactMode, ImpactModeFactory} from "../domain/incident/impactMode";

async function checkIfVVEsExist(vveList: string[] | string) {
    // Placeholder for VVE Service validation
}

@Service()
export default class IncidentService implements IIncidentService {

    constructor(
        @Inject("incidentRepo")
        private repo : IIncidentRepo,
        @Inject("IncidentTypeRepo")
        private repoType: IIncidentTypeRepository,
        @Inject("IncidentMap")
        private incidentMap: IncidentMap,
        @Inject("logger")
        private logger: Logger,
    ) {}

    public async createAsync(dto : IIncidentDTO): Promise<Result<IIncidentDTO>> {
        this.logger.info("Creating Incident", { code: dto.code });

        try {
            const exist = await this.repo.findByCode(dto.code);

            if (exist) {
                throw new BusinessRuleValidationError(
                    IncidentError.AlreadyExists,
                    "Incident already exists",
                    `Code ${dto.code} already exists`
                );
            }

            const existType = await this.repoType.findByCode(dto.incidentTypeCode);

            if(!existType) {
                throw new BusinessRuleValidationError(
                    IncidentTypeError.AlreadyExists,
                    "Incident Type dont exists",
                    `Code ${dto.code} for incident type was not found in DB.`
                );
            }

            await checkIfVVEsExist(dto.vveList);

            const severity = SeverityFactory.fromString(String(dto.severity));
            const impactMode = ImpactModeFactory.fromString(String(dto.impactMode));

            const incident = Incident.create({
                code :  dto.code,
                incidentTypeCode: dto.incidentTypeCode,
                vveList : dto.vveList,
                startTime : dto.startTime,
                endTime : dto.endTime,
                duration : null,
                severity,
                impactMode,
                description : dto.description,
                createdByUser : dto.createdByUser,
                upcomingWindowStartTime: dto.upcomingWindowStartTime,
                upcomingWindowEndTime : dto.upcomingWindowEndTime,
                createdAt : new Date(),
                updatedAt : null,
            });

            const saved = await this.repo.save(incident);
            if (!saved) {
                throw new BusinessRuleValidationError(
                    IncidentTypeError.PersistError,
                    "Error saving Incident"
                );
            }

            return Result.ok(this.incidentMap.toDTO(saved));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return Result.fail<IIncidentDTO>(msg);
        }
    }

    public async updateAsync(incidentCode: string, dto: IIncidentDTO): Promise<Result<IIncidentDTO>> {
        this.logger.info("Updating Incident", { incidentCode });

        try {
            const incident = await this.repo.findByCode(incidentCode);
            if (!incident) {
                throw new BusinessRuleValidationError(
                    IncidentError.UpdateError,
                    "Error updating Incident",
                    `Incident with code ${incidentCode} was not found in DB`
                )
            }

            const incidentType = await this.repoType.findByCode(dto.incidentTypeCode);
            if(!incidentType) {
                throw new BusinessRuleValidationError(
                    IncidentError.UpdateError,
                    "Error updating Incident",
                    `Incident type with code ${dto.incidentTypeCode} was not found in DB`
                )
            }

            await checkIfVVEsExist(dto.vveList);

            const parsedSeverity = SeverityFactory.fromString(String(dto.severity));
            const parsedImpactMode = ImpactModeFactory.fromString(String(dto.impactMode));

            if(parsedImpactMode == ImpactMode.Upcoming){
                if(dto.impactMode != ImpactMode.Upcoming && (dto.upcomingWindowStartTime == null || dto.upcomingWindowEndTime == null) ) {
                    throw new BusinessRuleValidationError(
                        IncidentError.UpdateError,
                        "Error updating Incident",
                        `Cannot update incident with impact mode 'Upcoming' without window times.`
                    )
                }

                if (dto.upcomingWindowStartTime != null && dto.upcomingWindowEndTime != null){
                    incident.changeUpComingWindowTimes(dto.upcomingWindowStartTime,dto.upcomingWindowEndTime);
                }
            }

            //--- Updates
            incident.changeIncidentTypeCode(dto.incidentTypeCode);
            incident.changeVVEList(dto.vveList);
            incident.changeStartTime(dto.startTime);
            incident.changeSeverity(parsedSeverity);
            incident.changeImpactMode(parsedImpactMode);
            incident.changeDescription(dto.description);

            const save = await this.repo.save(incident);
            if(!save){
                throw new BusinessRuleValidationError(
                    IncidentError.UpdateError,
                    "Error saving Incident"
                )
            }

            return Result.ok(this.incidentMap.toDTO(incident));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return Result.fail<IIncidentDTO>(msg);
        }
    }

    // --- IMPLEMENTED METHOD ---
    public async deleteAsync(incidentCode: string): Promise<Result<void>> {
        this.logger.info("Deleting Incident", { incidentCode });

        try {
            const incident = await this.repo.findByCode(incidentCode);
            if (!incident) {
                return Result.fail<void>(`Incident with code ${incidentCode} not found`);
            }

            await this.repo.deleteIncident(incidentCode);
            return Result.ok<void>();

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            this.logger.error("Error deleting incident", { error: errorMessage });
            return Result.fail<void>(errorMessage);
        }
    }
    // --------------------------

    public async getByCodeAsync(incidentCode : string): Promise<Result<IIncidentDTO>>{
        try {
            const incident = await this.repo.findByCode(incidentCode);

            if (!incident) {
                return Result.fail<IIncidentDTO>(`No Incident found with code ${incidentCode}`);
            }

            return Result.ok(this.incidentMap.toDTO(incident));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO>(errorMessage);
        }
    }

    // --- IMPLEMENTED METHOD ---
    public async getByDataRangeAsync(startDateRange : Date, endDateRange : Date): Promise<Result<IIncidentDTO[]>>{
        try {
            if (startDateRange > endDateRange) {
                return Result.fail<IIncidentDTO[]>("Start date must be before or equal to End date.");
            }

            const incidents = await this.repo.getByDataRange(startDateRange, endDateRange);
            const dtos = incidents.map(i => this.incidentMap.toDTO(i));

            return Result.ok<IIncidentDTO[]>(dtos);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO[]>(errorMessage);
        }
    }
    // --------------------------

    // --- IMPLEMENTED METHOD ---
    public async getBySeverityAsync(severity : Severity): Promise<Result<IIncidentDTO[]>>{
        try {
            // Note: If 'severity' comes in as a string from the controller, you might need
            // to parse it here using SeverityFactory.fromString(severity) before passing to repo.
            const incidents = await this.repo.getBySeverity(severity);
            const dtos = incidents.map(i => this.incidentMap.toDTO(i));

            return Result.ok<IIncidentDTO[]>(dtos);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO[]>(errorMessage);
        }
    }
    // --------------------------

    // --- IMPLEMENTED METHOD ---
    public async getActiveIncidentsAsync() : Promise<Result<IIncidentDTO[]>> {
        try {
            const incidents = await this.repo.getActiveIncidents();
            const dtos = incidents.map(i => this.incidentMap.toDTO(i));
            return Result.ok<IIncidentDTO[]>(dtos);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO[]>(errorMessage);
        }
    }
    // --------------------------

    // --- IMPLEMENTED METHOD ---
    public async getResolvedIncidentsAsync(): Promise<Result<IIncidentDTO[]>> {
        try {
            const incidents = await this.repo.getResolvedIncidents();
            const dtos = incidents.map(i => this.incidentMap.toDTO(i));
            return Result.ok<IIncidentDTO[]>(dtos);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO[]>(errorMessage);
        }
    }
    // --------------------------

    public async getByVVEAsync(vveCode: string): Promise<Result<IIncidentDTO[]>> {
        try {
            await checkIfVVEsExist(vveCode);

            const listIncidentsFromDb = await this.repo.findByVVE(vveCode);
            const dtos = listIncidentsFromDb.map(i => this.incidentMap.toDTO(i));
            return Result.ok<IIncidentDTO[]>(dtos);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO[]>(errorMessage);
        }
    }

    public async getAllIncidentAsync(): Promise<Result<IIncidentDTO[]>> {
        try {
            const allIncidents = await this.repo.findAll();
            const dtos = allIncidents.map(i => this.incidentMap.toDTO(i));
            return Result.ok<IIncidentDTO[]>(dtos);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
            return Result.fail<IIncidentDTO[]>(errorMessage);
        }
    }

    public async markAsResolvedAsync(incidentCode : string): Promise<Result<IIncidentDTO>> {
        try {
            const incident = await this.repo.findByCode(incidentCode);
            if (!incident) {
                throw new BusinessRuleValidationError(
                    IncidentError.NotFound,
                    "Incident not found",
                    `No Incident found with code ${incidentCode}`
                )
            }

            incident.markAsResolved();

            const save = await this.repo.save(incident);
            if(!save){
                throw new BusinessRuleValidationError(
                    IncidentError.UpdateError,
                    "Error saving Incident"
                )
            }

            return Result.ok(this.incidentMap.toDTO(incident));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return Result.fail<IIncidentDTO>(msg);
        }
    }

    public async addVVEToIncidentAsync(incidentCode : string, vveCode : string): Promise<Result<IIncidentDTO>> {
        try {
            const incident = await this.repo.findByCode(incidentCode);
            if (!incident) {
                throw new BusinessRuleValidationError(
                    IncidentError.NotFound,
                    "Incident not found",
                    `No Incident found with code ${incidentCode}`
                )
            }

            await checkIfVVEsExist(vveCode);

            incident.addAffectedVve(vveCode);

            const save = await this.repo.save(incident);
            if(!save){
                throw new BusinessRuleValidationError(
                    IncidentError.UpdateError,
                    "Error saving Incident"
                )
            }

            return Result.ok(this.incidentMap.toDTO(incident));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return Result.fail<IIncidentDTO>(msg);
        }
    }

    public async removeVVEAsync(incidentCode : string,vveCode : string): Promise<Result<IIncidentDTO>> {
        try {
            const incident = await this.repo.findByCode(incidentCode);
            if (!incident) {
                throw new BusinessRuleValidationError(
                    IncidentError.NotFound,
                    "Incident not found",
                    `No Incident found with code ${incidentCode}`
                )
            }

            // VVE existence check might not be needed for removal
            // await checkIfVVEsExist(vveCode);

            incident.removeAffectedVve(vveCode);

            const save = await this.repo.save(incident);
            if(!save){
                throw new BusinessRuleValidationError(
                    IncidentError.UpdateError,
                    "Error saving Incident"
                )
            }

            return Result.ok(this.incidentMap.toDTO(incident));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return Result.fail<IIncidentDTO>(msg);
        }
    }
}