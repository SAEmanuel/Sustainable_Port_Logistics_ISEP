import { Service, Inject } from 'typedi';
import { Result } from "../core/logic/Result";
import { IOperationDTO,IOperationPlanDTO } from '../dto/IOperationPlanDTO';
import { OperationPlan } from '../domain/operationPlan/operationPlan';
import OperationPlanRepo from '../repos/operationPlanRepo';
import OperationPlanMap from '../mappers/OperationPlanMap';
import { IUpdateOperationPlanForVvnDTO, IUpdateOperationPlanResultDTO } from "../dto/IUpdateOperationPlanDTO";
import OperationPlanChangeLogRepo from "../repos/operationPlanChangeLogRepo";
import { checkPlanInconsistencies } from "./operationPlanConsistencyChecker";
import { IUpdateOperationPlanBatchDTO, IUpdateOperationPlanBatchResultDTO } from "../dto/IUpdateOperationPlanBatchDTO";


@Service()
export default class OperationPlanService {
    constructor(
        @Inject("OperationPlanRepo") private repo: OperationPlanRepo,
        @Inject("OperationPlanMap") private operationPlanMap: OperationPlanMap,
        @Inject("OperationPlanChangeLogRepo") private auditRepo: OperationPlanChangeLogRepo
    ) {}

    public async updatePlanBatchAsync(
        dto: IUpdateOperationPlanBatchDTO,
        authorFromAuth: string
    ): Promise<Result<IUpdateOperationPlanBatchResultDTO>> {
        try {
            if (!dto.planDomainId) {
                return Result.fail<IUpdateOperationPlanBatchResultDTO>("planDomainId é obrigatório.");
            }
            if (!dto.reasonForChange || dto.reasonForChange.trim().length < 3) {
                return Result.fail<IUpdateOperationPlanBatchResultDTO>("reasonForChange é obrigatório.");
            }
            if (!dto.updates || dto.updates.length === 0) {
                return Result.fail<IUpdateOperationPlanBatchResultDTO>(
                    "updates é obrigatório e deve ter pelo menos 1 item."
                );
            }

            const plan = await this.repo.findByDomainId(dto.planDomainId);
            if (!plan) {
                return Result.fail<IUpdateOperationPlanBatchResultDTO>("OperationPlan não encontrado.");
            }

            const editedVvnIds = dto.updates.map((u) => u.vvnId);

            // snapshot BEFORE por VVN
            const beforeByVvn: Record<string, any[]> = {};
            for (const vvn of editedVvnIds) {
                beforeByVvn[vvn] = plan.operations.filter((o) => o.vvnId === vvn);
            }

            // aplicar todas as alterações ao aggregate (estado final em memória)
            for (const upd of dto.updates) {
                const updateResult = plan.updateForVvn(upd.vvnId, upd.operations);

                if (updateResult.isFailure) {
                    const err = updateResult.errorValue?.();
                    return Result.fail<IUpdateOperationPlanBatchResultDTO>(
                        typeof err === "string" && err.trim().length > 0
                            ? `VVN ${upd.vvnId}: ${err}`
                            : `VVN ${upd.vvnId}: erro de validação ao atualizar.`
                    );
                }
            }

            // warnings (estado final em memória)
            const warnings = editedVvnIds
                .flatMap((id) => checkPlanInconsistencies(plan.operations, id))
                .filter(Boolean);

            // bloquear se existir blocking
            const blocking = warnings.filter((w) => w.severity === "blocking");
            if (blocking.length > 0) {
                const uniqueCodes = Array.from(new Set(blocking.map((b) => b.code)));
                return Result.fail<IUpdateOperationPlanBatchResultDTO>(
                    `Plano atualizado introduz inconsistências bloqueantes: ${uniqueCodes.join(", ")}`
                );
            }

            // persistir UMA vez
            await this.repo.save(plan);

            // audit por VVN
            for (const vvn of editedVvnIds) {
                const afterSubset = plan.operations.filter((o) => o.vvnId === vvn);
                await this.auditRepo.append({
                    planDomainId: dto.planDomainId,
                    vvnId: vvn,
                    changedAt: new Date(),
                    author: authorFromAuth || dto.author || "Unknown",
                    reasonForChange: dto.reasonForChange,
                    before: beforeByVvn[vvn] ?? [],
                    after: afterSubset,
                });
            }

            const planDTO = this.operationPlanMap.toDTO(plan);

            return Result.ok<IUpdateOperationPlanBatchResultDTO>({
                plan: planDTO,
                warnings,
            });
        } catch (e: any) {
            return Result.fail<IUpdateOperationPlanBatchResultDTO>(
                e?.message || "Erro ao atualizar o Operation Plan (batch)."
            );
        }
    }




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
            const updateResult = plan.updateForVvn(dto.vvnId, dto.operations);

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

            const blocking = warnings.filter(w => w.severity === "blocking");
            if (blocking.length > 0) {
                const uniqueCodes = Array.from(new Set(blocking.map(b => b.code)));
                return Result.fail<IUpdateOperationPlanResultDTO>(
                    `Plano atualizado introduz inconsistências bloqueantes: ${uniqueCodes.join(", ")}`
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

    
    public async getPlansByCraneAsync(
    crane: string,
    startDate?: string,
    endDate?: string
    ): Promise<Result<IOperationPlanDTO[]>> {
        try {
            if (!startDate || !endDate) {
                return Result.fail<IOperationPlanDTO[]>(
                    "startDate and endDate are required"
                );
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            const plans = await this.repo.searchByCraneAndInterval(
                start,
                end,
                crane
            );

            const dtos = plans.map(plan => this.operationPlanMap.toDTO(plan));

            return Result.ok<IOperationPlanDTO[]>(dtos);
        } catch (e) {
            // @ts-ignore
            return Result.fail<IOperationPlanDTO[]>( e.message || "Erro ao pesquisar planos por recurso.");
        }
    }
    

    public async getOperationByVvnAsync(
        vvnId: string
    ): Promise<Result<IOperationDTO>> {
        try {
            const operation = await this.repo.findOperationByVvnId(vvnId);

            if (!operation) {
                return Result.fail<IOperationDTO>(
                    `No operation found for VVN ${vvnId}`
                );
            }

            return Result.ok<IOperationDTO>(operation);

        } catch (e: any) {
            return Result.fail<IOperationDTO>(
                e?.message ?? "Failed to fetch operation for VVN"
            );
        }
    }
}