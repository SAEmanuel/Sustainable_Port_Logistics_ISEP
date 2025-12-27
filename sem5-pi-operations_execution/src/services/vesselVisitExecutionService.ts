import { Service, Inject } from "typedi";
import { Logger } from "winston";
import IVesselVisitExecutionService from "./IServices/IVesselVisitExecutionService";
import IVesselVisitExecutionRepo from "./IRepos/IVesselVisitExecutionRepo";
import { IVesselVisitExecutionDTO } from "../dto/IVesselVisitExecutionDTO";
import { Result } from "../core/logic/Result";
import { VesselVisitExecution } from "../domain/vesselVisitExecution/vesselVisitExecution";
import { VesselVisitExecutionCode } from "../domain/vesselVisitExecution/vesselVisitExecutionCode";
import { BusinessRuleValidationError } from "../core/logic/BusinessRuleValidationError";
import VvnService from "./ExternalData/vvnService";
import VesselVisitExecutionMap from "../mappers/VesselVisitExecutionMap";
import {VesselVisitExecutionId} from "../domain/vesselVisitExecution/vesselVisitExecutionId";
import {VVEError} from "../domain/vesselVisitExecution/errors/vveErrors";
import {CTError} from "../domain/complementaryTask/errors/ctErrors";

@Service()
export default class VesselVisitExecutionService implements IVesselVisitExecutionService {

    constructor(
        @Inject("VesselVisitExecutionRepo")
        private repo: IVesselVisitExecutionRepo,

        @Inject(() => VvnService)
        private vvnService: VvnService,

        @Inject("logger")
        private logger: Logger,

        @Inject('VesselVisitExecutionMap')
        private vesselVisitExecutionMap: VesselVisitExecutionMap
    ) {}

    public async createAsync(dto: IVesselVisitExecutionDTO): Promise<Result<IVesselVisitExecutionDTO>> {
        this.logger.info("Creating Vessel Visit Execution (VVE)");

        const externalVvn = await this.vvnService.fetchById(dto.vvnId);
        if (!externalVvn) {
            throw new BusinessRuleValidationError("VVN not found in the System");
        }

        const existingVve = await this.repo.findByVvnId(dto.vvnId);
        if (existingVve) {
            throw new BusinessRuleValidationError("Já existe um registo de execução para esta visita.");
        }

        const code = await this.generateCodeAsync();

        const vve = VesselVisitExecution.create({
            code: code,
            vvnId: dto.vvnId,
            vesselImo: externalVvn.vesselImo,
            actualArrivalTime: new Date(dto.actualArrivalTime),
            creatorEmail: dto.creatorEmail,
            status: "In Progress",
        });

        const savedVve = await this.repo.save(vve);

        return Result.ok<IVesselVisitExecutionDTO>(this.vesselVisitExecutionMap.toDTO(savedVve));
    }
    public async getAllAsync(): Promise<Result<IVesselVisitExecutionDTO[]>> {
        this.logger.debug("A procurar todos os registos de Vessel Visit Execution (VVE)");

        try {
            const vves = await this.repo.findAll();
            const vvesDto = vves.map(vve => this.vesselVisitExecutionMap.toDTO(vve));

            return Result.ok<IVesselVisitExecutionDTO[]>(vvesDto);
        } catch (e) {
            this.logger.error("Erro ao listar VVEs: %o", e);
            // @ts-ignore
            return Result.fail<IVesselVisitExecutionDTO[]>(e.message);
        }
    }

    public async getByIdAsync(id: VesselVisitExecutionId): Promise<Result<IVesselVisitExecutionDTO>> {

        const vve = await this.repo.findById(id);
        if (!vve) {
            throw new BusinessRuleValidationError(
                VVEError.NotFound,
                "VVE not found",
                `No VVE found with id ${id}`
            );
        }

        return Result.ok(this.vesselVisitExecutionMap.toDTO(vve));
    }

    public async getByCodeAsync(code: VesselVisitExecutionCode): Promise<Result<IVesselVisitExecutionDTO>> {

        const vve = await this.repo.findByCode(code);
        if (!vve) {
            throw new BusinessRuleValidationError(
                VVEError.NotFound,
                "VVE not found",
                `No VVE found with code ${code}`
            );
        }

        return Result.ok(this.vesselVisitExecutionMap.toDTO(vve));
    }

    public async getByImoAsync(imo: string): Promise<Result<IVesselVisitExecutionDTO[]>> {
        const vve = await this.repo.findByImo(imo);
        return Result.ok(vve.map(v => this.vesselVisitExecutionMap.toDTO(v)));
    }

    public async getInRangeAsync(timeStart: Date, timeEnd: Date): Promise<Result<IVesselVisitExecutionDTO[]>> {

        if (timeStart >= timeEnd) {
            throw new BusinessRuleValidationError(
                VVEError.InvalidTimeRange,
                "Start time must be before end time",
                `timeStart=${timeStart.toISOString()} timeEnd=${timeEnd.toISOString()}`
            );
        }

        const tasks = await this.repo.getAllInDateRange(timeStart, timeEnd);
        return Result.ok(tasks.map(t => this.vesselVisitExecutionMap.toDTO(t)));
    }

    //METODOS AUXILIARES

    private async generateCodeAsync(): Promise<VesselVisitExecutionCode> {
        const sequence = await this.repo.getNextSequenceNumber();
        const formattedSequence = sequence.toString().padStart(6, '0');
        const year = new Date().getFullYear().toString();

        // (ex: VVE2025000001)
        const codeValue = `VVE${year}${formattedSequence}`;

        return VesselVisitExecutionCode.create(codeValue);
    }

    public async updateBerthAndDockAsync(
        id: VesselVisitExecutionId,
        actualBerthTime: Date,
        actualDockId: string,
        updaterEmail: string
    ): Promise<Result<IVesselVisitExecutionDTO>> {

        const vve = await this.repo.findById(id);
        if (!vve) {
            throw new BusinessRuleValidationError(
                VVEError.NotFound,
                "VVE not found",
                `No VVE found with id ${id}`
            );
        }

        const externalVvn = await this.vvnService.fetchById(vve.vvnId);
        if (!externalVvn) {
            throw new BusinessRuleValidationError("VVN not found in the System");
        }

        const plannedDockId =
            (externalVvn as any).dockId ??
            (externalVvn as any).dock ??
            (externalVvn as any).assignedDockId;

        let note: string | undefined = undefined;
        if (plannedDockId && plannedDockId !== actualDockId) {
            note = `Actual dock '${actualDockId}' differs from planned dock '${plannedDockId}'`;
        }

        vve.updateBerthAndDock(new Date(actualBerthTime), actualDockId, updaterEmail, note);

        await this.repo.save(vve);

        this.logger.info("Updated VVE berth time and dock", {
            vveId: id.toString(),
            actualBerthTime: new Date(actualBerthTime).toISOString(),
            actualDockId,
            plannedDockId,
            updaterEmail
        });

        return Result.ok(this.vesselVisitExecutionMap.toDTO(vve));
    }

}