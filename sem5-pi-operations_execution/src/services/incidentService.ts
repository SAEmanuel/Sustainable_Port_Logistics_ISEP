import {Inject, Service} from "typedi";
import IIncidentService from "./IServices/IIncidentService";
import IIncidentRepo from "./IRepos/IIncidentRepo";
import IncidentMap from "../mappers/IncidentMap";
import {Logger} from "winston";
import {IIncidentTypeDTO} from "../dto/IIncidentTypeDTO";
import {IIncidentDTO} from "../dto/IIncidentDTO";
import {Result} from "../core/logic/Result";
import {BusinessRuleValidationError} from "../core/logic/BusinessRuleValidationError";
import {IncidentTypeError} from "../domain/incidentTypes/errors/incidentTypeErrors";
import {IncidentError} from "../domain/incident/errors/incidentErrors";
import {Incident} from "../domain/incident/incident";
import IIncidentTypeRepository from "./IRepos/IIncidentTypeRepository";
import {SeverityFactory} from "../domain/incidentTypes/severity";
import {ImpactMode, ImpactModeFactory} from "../domain/incident/impactMode";

async function checkIfVVEsExist(vveList: string[]) {

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

        // VALIDAR VVELIST QUANDO ESTEJA IMPLEMENTADO O REPOSITORIO DE VVE
        //
        //
        await checkIfVVEsExist(dto.vveList);
        //...

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
                "Error saving Incident Type"
            );
        }

        return Result.ok(this.incidentMap.toDTO(saved));
    }

    public async updateAsync(incidentCode: string, dto: IIncidentDTO): Promise<Result<IIncidentDTO>> {
        this.logger.info("Updating Incident", { incidentCode });

        const incident = await this.repo.findByCode(incidentCode);
        if (!incident) {
            throw new BusinessRuleValidationError(
                IncidentError.UpdateError,
                "Error updating Incident",
                `Incident with code ${dto.code} was not found in DB`
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

        // VALIDAR VVELIST QUANDO ESTEJA IMPLEMENTADO O REPOSITORIO DE VVE
        //
        //
        await checkIfVVEsExist(dto.vveList);
        //...


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
        incident.changeEndTime(dto.endTime);
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
    }

    public async getByCodeAsync(incidentCode : string): Promise<Result<IIncidentDTO>>{
        const incident = await this.repo.findByCode(incidentCode);

        if (!incident) {
            throw new BusinessRuleValidationError(
                IncidentError.NotFound,
                "Incident not found",
                `No Incident found with code ${incidentCode}`
            )
        }

        return Result.ok(this.incidentMap.toDTO(incident));
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

}