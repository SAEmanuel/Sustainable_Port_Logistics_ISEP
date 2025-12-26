import type {
    DailyScheduleResultDto,
    MultiCraneComparisonResultDto,
    PrologFullResultDto,
    SmartScheduleResultDto,
} from '../dtos/scheduling.dtos';

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

export const SchedulingService = {
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