import {Service, Inject} from "typedi";

import {Logger} from "winston";
import IComplementaryTaskService from "./IServices/IComplementaryTaskService";
import IComplementaryTaskRepo from "./IRepos/IComplementaryTaskRepo";
import ComplementaryTaskMap from "../mappers/ComplementaryTaskMap";
import {IComplementaryTaskDTO} from "../dto/IComplementaryTaskDTO";
import {Result} from "../core/logic/Result";
import {ComplementaryTaskCategoryId} from "../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {ComplementaryTaskCode} from "../domain/complementaryTask/ComplementaryTaskCode";
import {VesselVisitExecutionId} from "../domain/vesselVisitExecution/vesselVisitExecutionId";
import {CTStatus} from "../domain/complementaryTask/ctstatus";
import {BusinessRuleValidationError} from "../core/logic/BusinessRuleValidationError";
import {CTError} from "../domain/complementaryTask/errors/ctErrors";
import {ComplementaryTask} from "../domain/complementaryTask/complementaryTask";
import {CTCError} from "../domain/complementaryTaskCategory/errors/ctcErrors";

@Service()
export default class ComplementaryTaskService implements IComplementaryTaskService {

    constructor(
        @Inject("ComplementaryTaskRepo")
        private repo: IComplementaryTaskRepo,

        @Inject("ComplementaryTaskMap")
        private complementaryTaskMap: ComplementaryTaskMap,

        @Inject("logger")
        private logger: Logger
    ) {
    }

    public async createAsync(dto: IComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>> {
        this.logger.info("Creating ComplementaryTask", {code: dto.code});

        const number = await this.repo.getNextSequenceNumber();

        const task = ComplementaryTask.create({
            code: ComplementaryTaskCode.create(dto.category, number),
            category: ComplementaryTaskCategoryId.caller(dto.category),
            staff: dto.staff,
            timeStart: dto.timeStart,
            timeEnd: dto.timeEnd,
            status: dto.status,
            vve: VesselVisitExecutionId.caller(dto.vve),
            createdAt : new Date(),
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

    public async updateAsync(code: ComplementaryTaskCode, dto: IComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>> {
        const task = await this.repo.findByCode(code);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTError.NotFound,
                "Complementary task not found",
                `No task found with code ${code}`
            );
        }

        task.changeDetails(
            ComplementaryTaskCategoryId.create(dto.category),
            dto.staff,
            dto.timeStart,
            dto.timeEnd,
            VesselVisitExecutionId.create(dto.vve)
        );

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
        this.logger.debug("Fetching all ComplementaryTasks");

        const tasks = await this.repo.findAll();
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByCategoryAsync(category: ComplementaryTaskCategoryId): Promise<Result<IComplementaryTaskDTO[]>> {
        this.logger.debug(`Fetching all complementary tasks with category: ${category}`);
        const tasks = await this.repo.findByCategory(category);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByCodeAsync(code: ComplementaryTaskCode): Promise<Result<IComplementaryTaskDTO>> {
        this.logger.debug(`Fetching complementary task with code: ${code}`);
        const task = await this.repo.findByCode(code);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task not found",
                `No category found with code ${code}`
            );
        }
        return Result.ok(this.complementaryTaskMap.toDTO(task));
    }

    public async getByStaffAsync(staff: string): Promise<Result<IComplementaryTaskDTO[]>> {
        this.logger.debug(`Fetching all complementary tasks with staff: ${staff}`);
        const tasks = await this.repo.findByStaff(staff);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getByVveAsync(vve: VesselVisitExecutionId): Promise<Result<IComplementaryTaskDTO[]>> {
        this.logger.debug(`Fetching all complementary tasks from vve: ${vve}`);
        const tasks = await this.repo.findByVve(vve);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getCompletedAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        this.logger.debug("Fetching all completed complementary tasks");
        const tasks = await this.repo.findCompleted(CTStatus.Completed);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getInProgressAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        this.logger.debug("Fetching all in progress complementary tasks");
        const tasks = await this.repo.findInProgress(CTStatus.InProgress);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }


    public async getScheduledAsync(): Promise<Result<IComplementaryTaskDTO[]>> {
        this.logger.debug("Fetching all scheduled complementary tasks");
        const tasks = await this.repo.findScheduled(CTStatus.Scheduled);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

    public async getInRangeAsync(timeStart: Date, timeEnd: Date): Promise<Result<IComplementaryTaskDTO[]>> {
        const now = new Date();

        if (timeStart >= timeEnd) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeRange,
                "Start time must be before end time"
            );
        }

        if (timeStart < now) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeRange,
                "Start time must be in the future"
            );
        }

        const tasks = await this.repo.findInRange(timeStart, timeEnd);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

}
