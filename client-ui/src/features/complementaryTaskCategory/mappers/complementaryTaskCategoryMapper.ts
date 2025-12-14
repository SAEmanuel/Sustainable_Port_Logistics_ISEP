import type { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory";
import type { ComplementaryTaskCategoryDTO } from "../dtos/complementaryTaskCategoryDTO";

export function mapToCTCDomain(
    dto: ComplementaryTaskCategoryDTO
): ComplementaryTaskCategory {
    return {
        id: dto.id,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        defaultDuration: dto.defaultDuration ?? null,
        isActive: dto.isActive
    };
}