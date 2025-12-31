import type {
    DailyScheduleResultDto,
    MultiCraneComparisonResultDto, OperationPlanFilterDTO,
    PrologFullResultDto, SaveScheduleDto,
    SmartScheduleResultDto, UpdateOperationPlanBatchResultDto, UpdateOperationPlanForVvnsBatchDto,
} from '../dtos/scheduling.dtos';
import type { UpdateOperationPlanForVvnDto, UpdateOperationPlanResultDto } from "../dtos/scheduling.dtos";

export type ScheduleResponse = {
    algorithm: AlgorithmType;
    schedule: DailyScheduleResultDto;
    prolog: PrologFullResultDto;
    comparisonData?: MultiCraneComparisonResultDto;
    smartData?: SmartScheduleResultDto;
};

export type AlgorithmType =
    | 'optimal'
    | 'greedy'
    | 'local_search'
    | 'multi_crane'
    | 'genetic'
    | 'smart';

export interface GeneticParams {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    crossoverRate?: number;
}


export interface SmartParams {
    maxComputationSeconds?: number;
}

const BASE_URL = import.meta.env.VITE_PLANNING_URL;
const BASE_OPERATIONS_URL = import.meta.env.VITE_OPERATIONS_URL;

export type UpdateOperationPlanBatchDto = {
    planDomainId: string;
    reasonForChange: string;
    author: string;
    updates: Array<{ vvnId: string; operations: any[] }>;
};



export const SchedulingService = {

    async updateOperationPlanBatch(payload: UpdateOperationPlanBatchDto, token?: string) {
        const url = `${BASE_OPERATIONS_URL}/api/operation-plans/batch`;

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || body.error || "Erro ao atualizar Operation Plan (batch).");
        return body as UpdateOperationPlanResultDto;
    },

    async updateOperationPlanForVvn(
        payload: UpdateOperationPlanForVvnDto,
        token?: string
    ): Promise<UpdateOperationPlanResultDto> {
        const url = `${BASE_OPERATIONS_URL}/api/operation-plans/vvn`;

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
            // backend: { message: "..." }
            throw new Error(body.message || body.error || "Erro ao atualizar Operation Plan.");
        }

        return body as UpdateOperationPlanResultDto;
    },

    async updateOperationPlanForVvnsBatch(
        payload: UpdateOperationPlanForVvnsBatchDto,
        token?: string
    ): Promise<UpdateOperationPlanBatchResultDto> {
        const url = `${BASE_OPERATIONS_URL}/api/operation-plans/vvns`;

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(body.message || body.error || "Erro ao atualizar Operation Plan (batch).");
        }

        return body as UpdateOperationPlanBatchResultDto;
    },


    async saveSchedule(data: SaveScheduleDto): Promise<void> {
        const url = `${BASE_URL}/api/schedule/save`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to save schedule");
            }

        } catch (error) {
            console.error("Error saving schedule:", error);
            throw error;
        }
    },

    async getHistoryPlans(filters: OperationPlanFilterDTO): Promise<SaveScheduleDto[]> {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.vessel) params.append('vessel', filters.vessel);

        const url = `${BASE_OPERATIONS_URL}/api/operation-plans?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Erro ao carregar histórico");
        return response.json();
    },


    async getDailySchedule(
        day: string,
        algorithm: AlgorithmType,
        comparisonAlgorithm: string = 'greedy',
        geneticParams?: GeneticParams,
        smartParams?: SmartParams
    ): Promise<ScheduleResponse> {

        let endpointUrl = `api/schedule/daily/${algorithm}`;
        let queryParams = `?day=${day}`;



        endpointUrl = endpointUrl.replace('-', '_');

        if (algorithm === 'multi_crane') {
            endpointUrl = `api/schedule/daily/multi-crane-comparison`;
            queryParams += `&algorithm=${comparisonAlgorithm.replace('-', '_')}`;
        }

        if (algorithm === 'smart') {
            endpointUrl = `api/schedule/daily/smart`;
            if (smartParams?.maxComputationSeconds) {
                queryParams += `&maxComputationSeconds=${smartParams.maxComputationSeconds}`;
            }
        }

        if (algorithm === 'genetic') {
            endpointUrl = `api/schedule/daily/genetic`;
            if (geneticParams?.populationSize) queryParams += `&populationSizeOverride=${geneticParams.populationSize}`;
            if (geneticParams?.generations) queryParams += `&generationsOverride=${geneticParams.generations}`;
            if (geneticParams?.mutationRate) queryParams += `&mutationRateOverride=${geneticParams.mutationRate}`;
            if (geneticParams?.crossoverRate) queryParams += `&crossoverRateOverride=${geneticParams.crossoverRate}`;
        }

        const url = `${BASE_URL}/${endpointUrl}${queryParams}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `Failed to fetch schedule for ${algorithm}`);
            }

            const rawResult = await response.json();

            if (algorithm === 'multi_crane' && rawResult.multiCraneSchedule) {
                const comparisonDto = rawResult as MultiCraneComparisonResultDto;
                return {
                    algorithm: 'multi_crane',
                    schedule: comparisonDto.multiCraneSchedule,
                    prolog: comparisonDto.multiCraneProlog as PrologFullResultDto,
                    comparisonData: comparisonDto
                };
            }

            if (algorithm === 'smart' && rawResult.schedule) {
                return {
                    algorithm: 'smart',
                    schedule: rawResult.schedule,
                    prolog: rawResult.prolog as PrologFullResultDto,
                    smartData: rawResult as SmartScheduleResultDto
                };
            }

            if (algorithm === 'genetic' && rawResult.schedule) {
                return {
                    algorithm: 'genetic',
                    schedule: rawResult.schedule,
                    prolog: rawResult.prolog as PrologFullResultDto
                };
            }

            if (rawResult.schedule) {
                return {
                    ...rawResult,
                    prolog: rawResult.prolog as PrologFullResultDto
                } as ScheduleResponse;
            }

            if (rawResult.operations) {
                return {
                    algorithm,
                    schedule: rawResult as DailyScheduleResultDto,
                    prolog: {
                        algorithm,
                        total_delay: 0,
                        best_sequence: [],
                        status: 'partial'
                    } as PrologFullResultDto
                };
            }

            throw new Error("Unknown schedule response format from server");

        } catch (error) {
            console.error(`Error fetching schedule for ${algorithm}:`, error);
            throw error;
        }
    },

    calculateTotalDelay(schedule: DailyScheduleResultDto): number {
        return schedule.operations.reduce((sum, op) => sum + (op.departureDelay || 0), 0);
    }
};