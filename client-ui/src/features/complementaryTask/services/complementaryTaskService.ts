
import type {ComplementaryTask} from "../domain/complementaryTask.ts";
import {operationsApi} from "../../../services/api.tsx";
import {mapToCTDomain} from "../mappers/complementaryTaskMapper.ts";
import type {CreateComplementaryTaskDTO} from "../dtos/createComplementaryTaskDTO.ts";
import type {UpdateComplementaryTaskDTO} from "../dtos/updateComplementaryTaskDTO.ts";


export async function createCT(dto: CreateComplementaryTaskDTO): Promise<ComplementaryTask> {
    const res = await operationsApi.post("/api/complementary-tasks", dto);
    return mapToCTDomain(res.data);
}


export async function updateCT(code: string, dto: UpdateComplementaryTaskDTO): Promise<ComplementaryTask> {
    const res = await operationsApi.put(`/api/complementary-tasks/${code}`, dto);
    return mapToCTDomain(res.data);
}


export async function getAllCT(): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks");
    return res.data.map(mapToCTDomain);
}


export async function getCTByCode(code: string): Promise<ComplementaryTask> {
    const res = await operationsApi.get(`/api/complementary-tasks/search/code/${code}`);
    return mapToCTDomain(res.data);
}


export async function getScheduledCT(): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/scheduled");
    return res.data.map(mapToCTDomain);
}


export async function getCompletedCT(): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/completed");
    return res.data.map(mapToCTDomain);
}


export async function getInProgressCT(): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/in-progress");
    return res.data.map(mapToCTDomain);
}


export async function getCTByCategory(category: string): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/category",
        {params: {category}}
    );
    return res.data.map(mapToCTDomain);
}

export async function getCTByCategoryCode(category: string): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/categoryCode",
        {params: {category}}
    );
    return res.data.map(mapToCTDomain);
}


export async function getCTByStaff(staff: string): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/staff",
        {params: {staff}}
    );

    return res.data.map(mapToCTDomain);
}


export async function getCTByVve(vve: string): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/vve",
        {params: {vve}}
    );
    return res.data.map(mapToCTDomain);
}


export async function getCTInRange(timeStart: number, timeEnd: number): Promise<ComplementaryTask[]> {
    const res = await operationsApi.get("/api/complementary-tasks/search/in-range",
        {params: {timeStart, timeEnd}}
    );
    return res.data.map(mapToCTDomain);
}


