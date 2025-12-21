import {Service, Inject} from "typedi";
import {Logger} from "winston";

import IComplementaryTaskService from "./IServices/IComplementaryTaskService";
import IComplementaryTaskRepo from "./IRepos/IComplementaryTaskRepo";
import IComplementaryTaskCategoryRepo from "./IRepos/IComplementaryTaskCategoryRepo";
import IVesselVisitExecutionRepo from "./IRepos/IVesselVisitExecutionRepo";

import ComplementaryTaskMap from "../mappers/ComplementaryTaskMap";

import {
    IComplementaryTaskDTO,
    ICreateComplementaryTaskDTO,
    IUpdateComplementaryTaskDTO
} from "../dto/IComplementaryTaskDTO";

import {Result} from "../core/logic/Result";
import {BusinessRuleValidationError} from "../core/logic/BusinessRuleValidationError";

import {ComplementaryTask} from "../domain/complementaryTask/complementaryTask";
import {ComplementaryTaskCategoryId} from "../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {ComplementaryTaskCode} from "../domain/complementaryTask/ComplementaryTaskCode";
import {VesselVisitExecutionId} from "../domain/vesselVisitExecution/vesselVisitExecutionId";
import {CTStatus} from "../domain/complementaryTask/ctstatus";

import {CTError} from "../domain/complementaryTask/errors/ctErrors";
import {CTCError} from "../domain/complementaryTaskCategory/errors/ctcErrors";

@Service()
export default class ComplementaryTaskService implements IComplementaryTaskService {

    constructor(
        @Inject("ComplementaryTaskRepo")
        private repo: IComplementaryTaskRepo,
        @Inject("ComplementaryTaskCategoryRepo")
        private ctcRepo: IComplementaryTaskCategoryRepo,
        @Inject("VesselVisitExecutionRepo")
        private vveRepo: IVesselVisitExecutionRepo,
        @Inject("ComplementaryTaskMap")
        private complementaryTaskMap: ComplementaryTaskMap,
        @Inject("logger")
        private logger: Logger
    ) {
    }


    public async createAsync(dto: ICreateComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>> {

        this.logger.info("Creating ComplementaryTask");

        const sequence = await this.repo.getNextSequenceNumber();

        const categoryId = await this.ensureCategoryExists(dto.category);
        const cat = await this.ctcRepo.findById(categoryId);
        if (!cat) {
            throw new BusinessRuleValidationError(
                CTError.NotFound,
                "Complementary task category not found",
                `No task found with id ${categoryId}`
            );
        }
        const vveId = await this.ensureVveExists(dto.vve);

        const task = ComplementaryTask.create({
            code: ComplementaryTaskCode.create(cat.code, sequence),
            category: categoryId,
            staff: dto.staff,
            timeStart: dto.timeStart,
            timeEnd: null,
            status: CTStatus.Scheduled,
            vve: vveId,
            createdAt: new Date(),
            updatedAt: null
        });

        const saved = await this.repo.save(task);
        if (!saved) {
            throw new BusinessRuleValidationError(
                CTError.PersistError,
                "Error saving complementary task"
            );
        }

        return Result.ok(this.complementaryTaskMap.toDTO(saved));
    }


    public async updateAsync(code: ComplementaryTaskCode, dto: IUpdateComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>> {

        const task = await this.repo.findByCode(code);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTError.NotFound,
                "Complementary task not found",
                `No task found with code ${code}`
            );
        }

        const categoryId = await this.ensureCategoryExists(dto.category);
        const vveId = await this.ensureVveExists(dto.vve);

        task.changeDetails(
            categoryId,
            dto.staff,
            dto.timeStart,
            vveId
        );

        if (dto.status && task.status !== dto.status) {
            task.changeStatus(dto.status);
        }

        const saved = await this.repo.save(task);
        if (!saved) {
            throw new BusinessRuleValidationError(
                CTError.PersistError,
                "Error updating complementary task"
            );
        }

        return Result.ok(this.complementaryTaskMap.toDTO(saved));
    }


    public async getAllAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        const tasks = await this.repo.findAll();
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByCodeAsync(code: ComplementaryTaskCode): Promise<Result<IComplementaryTaskDTO>> {

        const task = await this.repo.findByCode(code);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task not found",
                `No task found with code ${code}`
            );
        }

        return Result.ok(this.complementaryTaskMap.toDTO(task));
    }

    public async getByCategoryAsync(category: ComplementaryTaskCategoryId): Promise<Result<IComplementaryTaskDTO[]>> {

        const tasks = await this.repo.findByCategory(category);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByCategoryCodeAsync(categoryCode: string): Promise<Result<IComplementaryTaskDTO[]>> {
        const ctc = await this.ctcRepo.findByCode(categoryCode);
        if(!ctc) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task not found",
                `No task found with ctc code ${categoryCode}`
            );
        }
        const tasks = await this.repo.findByCategory(ctc.categoryId);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByStaffAsync(staff: string): Promise<Result<IComplementaryTaskDTO[]>> {

        const tasks = await this.repo.findByStaff(staff);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByVveAsync(vve: VesselVisitExecutionId): Promise<Result<IComplementaryTaskDTO>> {

        const task = await this.repo.findByVve(vve);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task not found",
                `No task found with vve ${vve}`
            );
        }

        return Result.ok(this.complementaryTaskMap.toDTO(task));
    }

    public async getScheduledAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        const tasks = await this.repo.findScheduled(CTStatus.Scheduled);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getInProgressAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        const tasks = await this.repo.findInProgress(CTStatus.InProgress);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getCompletedAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        const tasks = await this.repo.findCompleted(CTStatus.Completed);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getInRangeAsync(timeStart: Date, timeEnd: Date): Promise<Result<IComplementaryTaskDTO[]>> {

        if (timeStart >= timeEnd) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeRange,
                "Start time must be before end time",
                `timeStart=${timeStart.toISOString()} timeEnd=${timeEnd.toISOString()}`
            );
        }

        const tasks = await this.repo.findInRange(timeStart, timeEnd);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }


    private async ensureCategoryExists(categoryId: string): Promise<ComplementaryTaskCategoryId> {

        const id = ComplementaryTaskCategoryId.create(categoryId);

        const category = await this.ctcRepo.findById(id);
        if (!category) {
            throw new BusinessRuleValidationError(
                CTError.InvalidInput,
                "Complementary Task Category not found",
                `No CTC found with id ${categoryId}`
            );
        }

        return category;
    }

    private async ensureVveExists(vveId: string): Promise<VesselVisitExecutionId> {

        const id = VesselVisitExecutionId.create(vveId);

        const vve = await this.vveRepo.findById(id);
        if (!vve) {
            throw new BusinessRuleValidationError(
                CTError.InvalidInput,
                "Vessel Visit Execution not found",
                `No VVE found with id ${vveId}`
            );
        }

        return id;
    }
}