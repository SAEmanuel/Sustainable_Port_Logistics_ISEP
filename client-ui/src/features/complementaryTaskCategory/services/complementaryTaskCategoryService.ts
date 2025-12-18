import type { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory";
import type { CreateComplementaryTaskCategoryDTO} from "../dtos/createComplementaryTaskCategoryDTO.ts";
import type {UpdateComplementaryTaskCategoryDTO} from "../dtos/updateComplementaryTaskCategoryDTO.ts";
import { operationsApi } from "../../../services/api";
import { mapToCTCDomain } from "../mappers/complementaryTaskCategoryMapper";

export async function createCTC(dto: CreateComplementaryTaskCategoryDTO): Promise<ComplementaryTaskCategory> {
    const res = await operationsApi.post("/api/complementary-task-categories", dto);
    return mapToCTCDomain(res.data);
}


export async function updateCTC(code: string, dto: UpdateComplementaryTaskCategoryDTO): Promise<ComplementaryTaskCategory> {
    const res = await operationsApi.put(`/api/complementary-task-categories/${code}`, dto);
    return mapToCTCDomain(res.data);
}

export async function getAllCTC(): Promise<ComplementaryTaskCategory[]> {
    const res = await operationsApi.get("/api/complementary-task-categories");
    return res.data.map(mapToCTCDomain);
}


export async function getCTCByCode(code: string): Promise<ComplementaryTaskCategory> {
    const res = await operationsApi.get(`/api/complementary-task-categories/${code}`);
    return mapToCTCDomain(res.data);
}


export async function getCTCById(id: string): Promise<ComplementaryTaskCategory> {
    const res = await operationsApi.get(`/api/complementary-task-categories/search/id/${id}`);
    return mapToCTCDomain(res.data);
}


export async function getCTCByName(name: string): Promise<ComplementaryTaskCategory[]> {
    const res = await operationsApi.get("/api/complementary-task-categories/search/name",
        { params: { name } }
    );

    return res.data.map(mapToCTCDomain);
}


export async function getCTCByDescription(description: string): Promise<ComplementaryTaskCategory[]> {
    const res = await operationsApi.get("/api/complementary-task-categories/search/description",
        { params: { description } }
    );

    return res.data.map(mapToCTCDomain);
}

export async function getCTCByCategory(category: string): Promise<ComplementaryTaskCategory[]> {
    const res = await operationsApi.get(
        "/api/complementary-task-categories/search/category",
        { params: { category } }
    );

    return res.data.map(mapToCTCDomain);
}


export async function activateCTC(code: string): Promise<ComplementaryTaskCategory> {
    const res = await operationsApi.patch(`/api/complementary-task-categories/${code}/activate`);
    return mapToCTCDomain(res.data);
}


export async function deactivateCTC(code: string): Promise<ComplementaryTaskCategory> {
    const res = await operationsApi.patch(`/api/complementary-task-categories/${code}/deactivate`);
    return mapToCTCDomain(res.data);
}