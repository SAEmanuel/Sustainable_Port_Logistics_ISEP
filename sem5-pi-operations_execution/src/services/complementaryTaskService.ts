import { Service, Inject } from "typedi";
import IComplementaryTaskService from "../services/IServices/IComplementaryTaskService";
import IComplementaryTaskRepo from "../services/IRepos/IComplementaryTaskRepo";
import { ComplementaryTask } from "../domain/complementaryTask/complementaryTask";
import { ComplementaryTaskMap } from "../mappers/ComplementaryTaskMap";
import { IComplementaryTaskDTO } from "../dto/IComplementaryTaskDTO";
import { Result } from "../core/logic/Result";
import { GenericAppError } from "../core/logic/AppError";
import { CTStatus } from "../domain/complementaryTask/ctstatus";

@Service()
export default class ComplementaryTaskService implements IComplementaryTaskService {

    constructor(
        @Inject("ComplementaryTaskRepo") private complementaryTaskRepo: IComplementaryTaskRepo
    ) {}

    public async createComplementaryTask(
    taskDTO: IComplementaryTaskDTO
    ): Promise<Result<IComplementaryTaskDTO>> {

        try {
            var genCode = await this.generateCode();

            const taskExists = await this.complementaryTaskRepo.findByCode(genCode);

            if (taskExists) {
            return Result.fail<IComplementaryTaskDTO>(
                "Complementary task with this code already exists."
            );
            }

            // 🔹 create now THROWS on error
            const task = ComplementaryTask.create({
            code: genCode,
            category: taskDTO.category,
            staff: taskDTO.staff,
            timeStart: taskDTO.timeStart,
            timeEnd: taskDTO.timeEnd,
            status: taskDTO.status as CTStatus
            });

            const taskSaved = await this.complementaryTaskRepo.save(task);

            if (!taskSaved) {
            return Result.fail<IComplementaryTaskDTO>(
                "Error saving complementary task."
            );
            }

            const taskDTOSaved = ComplementaryTaskMap.toDTO(taskSaved);
            return Result.ok<IComplementaryTaskDTO>(taskDTOSaved);

        } catch (e) {
            return Result.fail<IComplementaryTaskDTO>(
            String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async updateComplementaryTask(taskDTO: IComplementaryTaskDTO): Promise<Result<IComplementaryTaskDTO>> {
        try {
            const task = await this.complementaryTaskRepo.findByCode(taskDTO.code);

            if (!task) {
                return Result.fail<IComplementaryTaskDTO>("Complementary task not found.");
            }

            task.category = taskDTO.category;
            task.staff = taskDTO.staff;
            task.timeStart = taskDTO.timeStart;
            task.timeEnd = taskDTO.timeEnd;
            task.status = taskDTO.status as CTStatus;

            const taskSaved = await this.complementaryTaskRepo.save(task);

            if (!taskSaved) {
                return Result.fail<IComplementaryTaskDTO>("Error updating complementary task.");
            }

            const taskDTOSaved = ComplementaryTaskMap.toDTO(taskSaved);
            return Result.ok<IComplementaryTaskDTO>(taskDTOSaved);

        } catch (e) {
            return Result.fail<IComplementaryTaskDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async getComplementaryTask(code: string): Promise<Result<IComplementaryTaskDTO>> {
        try {
            const task = await this.complementaryTaskRepo.findByCode(code);

            if (!task) {
                return Result.fail<IComplementaryTaskDTO>(`Complementary task not found for code: ${code}`);
            }

            const taskDTO = ComplementaryTaskMap.toDTO(task);
            return Result.ok<IComplementaryTaskDTO>(taskDTO);

        } catch (e) {
            return Result.fail<IComplementaryTaskDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }



    private async generateCode(): Promise<string> {
        const year = new Date().getFullYear();

        const lastTask = await this.complementaryTaskRepo.findLastTaskOfYear(year);

        let nextNumber = 1;

        if (lastTask) {
            const lastNumber = Number(lastTask.code.split("-")[2]);
            nextNumber = lastNumber + 1;
        }

        const padded = String(nextNumber).padStart(5, "0");

        return `CT-${year}-${padded}`;
    }
}
