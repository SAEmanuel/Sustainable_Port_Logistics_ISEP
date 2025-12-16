import IIncidentTypeService from "./IServices/IIncidentTypeService";
import { Result } from "../core/logic/Result";
import { BusinessRuleValidationError } from "../core/logic/BusinessRuleValidationError";
import IIncidentTypeRepository from "./IRepos/IIncidentTypeRepository";
import { Logger } from "winston";
import IncidentTypeMap from "../mappers/IncidentTypeMap";
import {IIncidentTypeDTO} from "../dto/IIncidentTypeDTO";
import { Service, Inject } from "typedi";
import {IncidentTypeError} from "../domain/incidentTypes/errors/incidentTypeErrors"
import {SeverityFactory} from "../domain/incidentTypes/severity";
import {IncidentType} from "../domain/incidentTypes/incidentType";

@Service()
export default class IncidentTypeService implements IIncidentTypeService {

    constructor(
        @Inject("IncidentTypeRepo")
        private repo: IIncidentTypeRepository,

        @Inject("IncidentTypeMap")
        private incidentTypeMap: IncidentTypeMap,

        @Inject("logger")
        private logger: Logger,
    ) {}

    public async createAsync(dto: IIncidentTypeDTO): Promise<Result<IIncidentTypeDTO>> {
        this.logger.info("Creating Incident Type", { code: dto.code });

        const exist = await this.repo.findByCode(dto.code);
        if (exist) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.AlreadyExists,
                "Incident Type already exists",
                `Code ${dto.code} already exists`
            );
        }

        const severity = SeverityFactory.fromString(String(dto.severity));

        // Parent validation (if provided)
        if (dto.parentCode) {
            const parent = await this.repo.findByCode(dto.parentCode);
            if (!parent) {
                throw new BusinessRuleValidationError(
                    IncidentTypeError.NotFound,
                    "Parent Incident Type not found",
                    `No parent Incident Type with code ${dto.parentCode} was found`
                );
            }
        }

        const incidentType = IncidentType.creat({
            code: dto.code,
            name: dto.name,
            description: dto.description,
            severity,
            parent: dto.parentCode ?? null,
            createdAt: new Date(),
            updatedAt: null
        });

        const saved = await this.repo.save(incidentType);
        if (!saved) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.PersistError,
                "Error saving Incident Type"
            );
        }

        return Result.ok(this.incidentTypeMap.toDTO(saved));
    }

    public async updateAsync(code: string, dto: IIncidentTypeDTO): Promise<Result<IIncidentTypeDTO>> {
        this.logger.info("Updating Incident Type", { code });

        const incidentType = await this.repo.findByCode(code);
        if (!incidentType) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.NotFound,
                "Incident Type not found",
                `No Incident Type with code ${code} was found`
            );
        }

        const parsedSeverity = SeverityFactory.fromString(String(dto.severity));

        // Parent validation + cycle prevention (if parentCode is set)
        if (dto.parentCode) {
            if (dto.parentCode === code) {
                throw new BusinessRuleValidationError(
                    IncidentTypeError.InvalidInput,
                    "Invalid hierarchy",
                    "An Incident Type cannot be its own parent"
                );
            }

            const parent = await this.repo.findByCode(dto.parentCode);
            if (!parent) {
                throw new BusinessRuleValidationError(
                    IncidentTypeError.NotFound,
                    "Parent Incident Type not found",
                    `No parent Incident Type with code ${dto.parentCode} was found`
                );
            }

            // Cycle check: new parent cannot be a descendant of this node
            const descendants = await this.repo.getSubTreeFromParentNode(code);
            const descendantCodes = new Set(descendants.map(d => d.code));

            if (descendantCodes.has(dto.parentCode)) {
                throw new BusinessRuleValidationError(
                    IncidentTypeError.InvalidInput,
                    "Invalid hierarchy",
                    "Cannot set parent to a descendant (cycle detected)"
                );
            }
        }

        incidentType.changeName(dto.name);
        incidentType.changeDescription(dto.description);
        incidentType.changeSeverity(parsedSeverity);

        incidentType.changeParent(dto.parentCode ?? null);

        const saved = await this.repo.save(incidentType);
        if (!saved) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.PersistError,
                "Error updating Incident Type"
            );
        }

        return Result.ok(this.incidentTypeMap.toDTO(saved));
    }

    public async getByCode(code: string): Promise<Result<IIncidentTypeDTO>> {
        const incidentType = await this.repo.findByCode(code);
        if (!incidentType) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.NotFound,
                "Incident Type not found",
                `No Incident Type found with code ${code}`
            );
        }
        return Result.ok(this.incidentTypeMap.toDTO(incidentType));
    }

    public async getByName(name: string): Promise<Result<IIncidentTypeDTO[]>> {
        const incidentTypes = await this.repo.findByName(name);
        return Result.ok(incidentTypes.map(it => this.incidentTypeMap.toDTO(it)));
    }

    public async getSubTreeFromParentNode(parentCode: string): Promise<Result<IIncidentTypeDTO[]>> {
        const parentNode = await this.repo.findByCode(parentCode);
        if (!parentNode) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.NotFound,
                "Parent Incident Type not found",
                `Cannot get subtree because no parent with code ${parentCode} was found`
            );
        }

        const subtree = await this.repo.getSubTreeFromParentNode(parentCode);
        return Result.ok(subtree.map(it => this.incidentTypeMap.toDTO(it)));
    }

    public async getDirectChilds(parentCode: string): Promise<Result<IIncidentTypeDTO[]>> {
        const parentNode = await this.repo.findByCode(parentCode);
        if (!parentNode) {
            throw new BusinessRuleValidationError(
                IncidentTypeError.NotFound,
                "Parent Incident Type not found",
                `Cannot get direct children because no parent with code ${parentCode} was found`
            );
        }

        const directChilds = await this.repo.getDirectChilds(parentCode);
        return Result.ok(directChilds.map(it => this.incidentTypeMap.toDTO(it)));
    }

    public async getRootTypes(): Promise<Result<IIncidentTypeDTO[]>> {
        this.logger.debug("Getting root Incident Types");

        const roots = await this.repo.getRootTypes();

        return Result.ok(
            roots.map(it => this.incidentTypeMap.toDTO(it))
        );
    }

}
