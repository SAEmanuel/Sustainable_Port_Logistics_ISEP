import { Service, Inject } from 'typedi';
import { Result } from "../core/logic/Result";
import { IOperationPlanDTO } from '../dto/IOperationPlanDTO';
import { OperationPlan } from '../domain/operationPlan/operationPlan';
import OperationPlanRepo from '../repos/operationPlanRepo';
import OperationPlanMap from '../mappers/OperationPlanMap';

@Service()
export default class OperationPlanService {
    constructor(
        @Inject('OperationPlanRepo') private repo: OperationPlanRepo,
        @Inject('OperationPlanMap')
        private operationPlanMap: OperationPlanMap
    ) {}

    public async createPlanAsync(dto: IOperationPlanDTO): Promise<Result<IOperationPlanDTO>> {
        try {
            const planOrError = OperationPlan.create({
                algorithm: dto.algorithm,
                totalDelay: dto.totalDelay,
                status: dto.status,
                planDate: new Date(dto.planDate),
                operations: dto.operations,
                author: dto.author || "Unknown",
                createdAt: new Date()
            });

            if (planOrError.isFailure) {
                return Result.fail<IOperationPlanDTO>(planOrError.errorValue());
            }

            const plan = planOrError.getValue();

            await this.repo.save(plan);

            const planDTO = this.operationPlanMap.toDTO(plan);
            return Result.ok<IOperationPlanDTO>(planDTO);

        } catch (e) {
            // @ts-ignore
            return Result.fail<IOperationPlanDTO>(e.message || "Erro inesperado ao criar o plano.");
        }
    }

    public async getPlansAsync(startDate?: string, endDate?: string, vessel?: string): Promise<Result<IOperationPlanDTO[]>> {
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const plans = await this.repo.search(start, end, vessel);

            const dtos = plans.map(plan => this.operationPlanMap.toDTO(plan));

            return Result.ok<IOperationPlanDTO[]>(dtos);
        } catch (e) {
            // @ts-ignore
            return Result.fail<IOperationPlanDTO[]>(e.message || "Erro ao pesquisar planos.");
        }
    }
}