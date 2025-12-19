import {Service, Inject} from "typedi";

import {Logger} from "winston";
import IComplementaryTaskService from "./IServices/IComplementaryTaskService";
import IComplementaryTaskRepo from "./IRepos/IComplementaryTaskRepo";
import ComplementaryTaskMap from "../mappers/ComplementaryTaskMap";
import {
    IComplementaryTaskDTO,
    ICreateComplementaryTaskDTO,
    IUpdateComplementaryTaskDetailsDTO, IUpdateComplementaryTaskStatusDTO
} from "../dto/IComplementaryTaskDTO";
import {Result} from "../core/logic/Result";
import {ComplementaryTaskCategoryId} from "../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {ComplementaryTaskCode} from "../domain/complementaryTask/ComplementaryTaskCode";
import {VesselVisitExecutionId} from "../domain/vesselVisitExecution/vesselVisitExecutionId";
import {CTStatus} from "../domain/complementaryTask/ctstatus";
import {BusinessRuleValidationError} from "../core/logic/BusinessRuleValidationError";
import {CTError} from "../domain/complementaryTask/errors/ctErrors";
import {ComplementaryTask} from "../domain/complementaryTask/complementaryTask";
import {CTCError} from "../domain/complementaryTaskCategory/errors/ctcErrors";
import IComplementaryTaskCategoryRepo from "./IRepos/IComplementaryTaskCategoryRepo";

@Service()
export default class ComplementaryTaskService implements IComplementaryTaskService {

    constructor(
        @Inject("ComplementaryTaskRepo")
        private repo: IComplementaryTaskRepo,

        @Inject("ComplementaryTaskCategoryRepo")
        private ctcRepo: IComplementaryTaskCategoryRepo,

        @Inject("ComplementaryTaskMap")
        private complementaryTaskMap: ComplementaryTaskMap,

        @Inject("logger")
        private logger: Logger
    ) {
    }

    public async createAsync(dto: ICreateComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>> {
        this.logger.info("Creating ComplementaryTask");

        const number = await this.repo.getNextSequenceNumber();

        const ctc = await this.ctcRepo.findById(ComplementaryTaskCategoryId.create(dto.category));
        if (!ctc) {
            throw new BusinessRuleValidationError(
                CTError.InvalidInput,
                "Complementary Task Category not found",
                `No CTC found with id ${dto.category}`
            );
        }



        const task = ComplementaryTask.create({
            code: ComplementaryTaskCode.create(ctc.code, number),
            category: ComplementaryTaskCategoryId.create(dto.category),
            staff: dto.staff,
            timeStart: dto.timeStart,
            timeEnd: dto.timeEnd,
            status: dto.status,
            vve: VesselVisitExecutionId.create(dto.vve),
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

    public async updateAsync(code: ComplementaryTaskCode, dto: IUpdateComplementaryTaskDetailsDTO): Promise<Result<IComplementaryTaskDTO>> {
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

    public async updateStatusAsync(code: ComplementaryTaskCode, dto: IUpdateComplementaryTaskStatusDTO): Promise<Result<IComplementaryTaskDTO>> {
        const task = await this.repo.findByCode(code);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTError.NotFound,
                "Complementary task not found",
                `No task found with code ${code}`
            );
        }

        task.changeStatus(dto.status);

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

    public async getByVveAsync(vve: VesselVisitExecutionId): Promise<Result<IComplementaryTaskDTO>> {
        this.logger.debug(`Fetching complementary task with vve: ${vve}`);
        const task = await this.repo.findByVve(vve);
        if (!task) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task not found",
                `No category found with vve ${vve}`
            );
        }
        return Result.ok(this.complementaryTaskMap.toDTO(task));
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
        if (timeStart >= timeEnd) {
            throw new BusinessRuleValidationError(
                CTError.InvalidTimeRange,
                "Start time must be before end time"
            );
        }

        const tasks = await this.repo.findInRange(timeStart, timeEnd);
        return Result.ok(tasks.map(t => this.complementaryTaskMap.toDTO(t)));
    }

}
