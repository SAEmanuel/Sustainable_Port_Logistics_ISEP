import type { ComplementaryTask } from "../domain/complementaryTask.ts";
import { operationsApi } from "../../../services/api.tsx";
import { mapToCTDomain } from "../mappers/complementaryTaskMapper.ts";

import type { CreateComplementaryTaskDTO } from "../dtos/createComplementaryTaskDTO.ts";
import type { UpdateComplementaryTaskDTO } from "../dtos/updateComplementaryTaskDTO.ts";

import { useAppStore } from "../../../app/store";

function authHeaders() {
    const user = useAppStore.getState().user;

    return {
        headers: {
            "x-user-email": user?.email ?? "Unknown"
        }
    };
}


export async function createCT(
    dto: CreateComplementaryTaskDTO
): Promise<ComplementaryTask> {

    const res = await operationsApi.post(
        "/api/complementary-tasks",
        dto,
        authHeaders()
    );

    return mapToCTDomain(res.data);
}


export async function updateCT(
    code: string,
    dto: UpdateComplementaryTaskDTO
): Promise<ComplementaryTask> {

    const res = await operationsApi.put(
        `/api/complementary-tasks/${code}`,
        dto,
        authHeaders()
    );

    return mapToCTDomain(res.data);
}


export async function getAllCT(): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks",
        authHeaders()
    );

    return res.data.map(mapToCTDomain);
}


export async function getCTByCode(
    code: string
): Promise<ComplementaryTask> {

    const res = await operationsApi.get(
        `/api/complementary-tasks/search/code/${code}`,
        authHeaders()
    );

    return mapToCTDomain(res.data);
}


export async function getScheduledCT(): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/scheduled",
        authHeaders()
    );

    return res.data.map(mapToCTDomain);
}

export async function getCompletedCT(): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/completed",
        authHeaders()
    );

    return res.data.map(mapToCTDomain);
}

export async function getInProgressCT(): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/in-progress",
        authHeaders()
    );

    return res.data.map(mapToCTDomain);
}


export async function getCTByCategory(
    category: string
): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/category",
        {
            ...authHeaders(),
            params: { category }
        }
    );

    return res.data.map(mapToCTDomain);
}

export async function getCTByCategoryCode(
    category: string
): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/categoryCode",
        {
            ...authHeaders(),
            params: { category }
        }
    );

    return res.data.map(mapToCTDomain);
}


export async function getCTByStaff(
    staff: string
): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/staff",
        {
            ...authHeaders(),
            params: { staff }
        }
    );

    return res.data.map(mapToCTDomain);
}


export async function getCTByVve(
    vve: string
): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/vve",
        {
            ...authHeaders(),
            params: { vve }
        }
    );

    return res.data.map(mapToCTDomain);
}

export async function getCTByVveCode(
    vve: string
): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/vveCode",
        {
            ...authHeaders(),
            params: { vve: vve.trim() }
        }
    );

    const data = res.data;
    if (!data) return [];

    if (Array.isArray(data)) {
        return data.map(mapToCTDomain);
    }

    return [mapToCTDomain(data)];
}


export async function getCTInRange(
    timeStart: number,
    timeEnd: number
): Promise<ComplementaryTask[]> {

    const res = await operationsApi.get(
        "/api/complementary-tasks/search/in-range",
        {
            ...authHeaders(),
            params: { timeStart, timeEnd }
        }
    );

    return res.data.map(mapToCTDomain);
}