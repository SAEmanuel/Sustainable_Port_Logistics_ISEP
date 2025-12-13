import {Mapper} from "../core/infra/Mapper";
import {ComplementaryTaskCategory} from "../domain/complementaryTaskCategory/complementaryTaskCategory";
import {UniqueEntityID} from "../core/domain/UniqueEntityID";
import {IComplementaryTaskCategoryDTO} from "../dto/IComplementaryTaskCategoryDTO";
import {IComplementaryTaskCategoryPersistence} from "../dataschema/IComplementaryTaskCategoryPersistance";

export class ComplementaryTaskCategoryMap extends Mapper<ComplementaryTaskCategory, IComplementaryTaskCategoryDTO, IComplementaryTaskCategoryPersistence> {

    toDTO(cat: ComplementaryTaskCategory): IComplementaryTaskCategoryDTO {
        return {
            id: cat.id.toString(),
            code: cat.code,
            name: cat.name,
            description: cat.description,
            category: cat.category,
            defaultDuration: cat.defaultDuration,
            isActive: cat.isActive
        };
    }

    toDomain(raw: IComplementaryTaskCategoryPersistence): ComplementaryTaskCategory | null {
        const categoryOrError = ComplementaryTaskCategory.create(
            {
                code: raw.code,
                name: raw.name,
                description: raw.description,
                category: raw.category,
                defaultDuration: raw.defaultDuration ?? null,
                isActive: raw.isActive,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt ?? null
            },
            new UniqueEntityID(raw.domainId)
        );

        if (categoryOrError.isFailure) {
            console.error(categoryOrError.errorValue());
            return null;
        }

        return categoryOrError.getValue();
    }

    toPersistence(cat: ComplementaryTaskCategory): IComplementaryTaskCategoryPersistence {
        return {
            domainId: cat.id.toString(),
            code: cat.code,
            name: cat.name,
            description: cat.description,
            category: cat.category,
            defaultDuration: cat.defaultDuration,
            isActive: cat.isActive,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
        };
    }
}