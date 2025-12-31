import { Service, Inject } from 'typedi';
import { Result } from "../core/logic/Result";
import { IOperationPlanDTO } from '../dto/IOperationPlanDTO';
import { OperationPlan } from '../domain/operationPlan/operationPlan';
import OperationPlanRepo from '../repos/operationPlanRepo';
import OperationPlanMap from '../mappers/OperationPlanMap';
import { IUpdateOperationPlanForVvnDTO, IUpdateOperationPlanResultDTO } from "../dto/IUpdateOperationPlanDTO";
import OperationPlanChangeLogRepo from "../repos/operationPlanChangeLogRepo";
import { checkPlanInconsistencies } from "./operationPlanConsistencyChecker";
@Service()
export default class OperationPlanService {
    constructor(
        @Inject("OperationPlanRepo") private repo: OperationPlanRepo,
        @Inject("OperationPlanMap") private operationPlanMap: OperationPlanMap,
        @Inject("OperationPlanChangeLogRepo") private auditRepo: OperationPlanChangeLogRepo
    ) {}
    
    public async updatePlanForVvnAsync(
        dto: IUpdateOperationPlanForVvnDTO,
        authorFromAuth: string
    ): Promise<Result<IUpdateOperationPlanResultDTO>> {
        try {
            if (!dto.reasonForChange || dto.reasonForChange.trim().length === 0) {
                return Result.fail<IUpdateOperationPlanResultDTO>("reasonForChange é obrigatório.");
            }
            if (!dto.planDomainId || !dto.vvnId) {
                return Result.fail<IUpdateOperationPlanResultDTO>("planDomainId e vvnId são obrigatórios.");
            }

            const plan = await this.repo.findByDomainId(dto.planDomainId);
            if (!plan) {
                return Result.fail<IUpdateOperationPlanResultDTO>("OperationPlan não encontrado.");
            }

            // snapshot “before” (apenas subset do VVN para log)
            const beforeSubset = plan.operations.filter(o => o.vvnId === dto.vvnId);

            // aplicar alteração no aggregate
            const updateResult = plan.updateForVvn(dto.vvnId, dto.operations, dto.status);

            if (updateResult.isFailure) {
                const err = updateResult.errorValue?.(); // pode ser void
                return Result.fail<IUpdateOperationPlanResultDTO>(
                    typeof err === "string" && err.trim().length > 0
                        ? err
                        : "Erro de validação ao atualizar operações do VVN."
                );
            }
            

            // inconsistências (AC: alertar)
            const warnings = checkPlanInconsistencies(plan.operations, dto.vvnId);

            // política: bloquear se existir algum "blocking"
            const blocking = warnings.filter(w => w.severity === "blocking");
            if (blocking.length > 0) {
                // não persistir; devolver falha com detalhe (tu podes serializar estes warnings no controller)
                return Result.fail<IUpdateOperationPlanResultDTO>(
                    `Plano atualizado introduz inconsistências bloqueantes: ${blocking.map(b => b.code).join(", ")}`
                );
            }

            // persistir
            await this.repo.save(plan);

            // audit log (AC: date, author, reason)
            const afterSubset = plan.operations.filter(o => o.vvnId === dto.vvnId);
            await this.auditRepo.append({
                planDomainId: dto.planDomainId,
                vvnId: dto.vvnId,
                changedAt: new Date(),
                author: authorFromAuth || "Unknown",
                reasonForChange: dto.reasonForChange,
                before: beforeSubset,
                after: afterSubset
            });

            const planDTO = this.operationPlanMap.toDTO(plan);

            return Result.ok<IUpdateOperationPlanResultDTO>({
                plan: planDTO,
                warnings
            });
        } catch (e: any) {
            return Result.fail<IUpdateOperationPlanResultDTO>(e?.message || "Erro ao atualizar o Operation Plan.");
        }
    }
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