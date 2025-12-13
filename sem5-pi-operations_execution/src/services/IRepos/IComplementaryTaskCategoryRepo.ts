import { Repo } from "../../core/infra/Repo";
import { ComplementaryTaskCategory } from "../../domain/complementaryTaskCategory/complementaryTaskCategory";
import { Category } from "../../domain/complementaryTaskCategory/category";

export default interface IComplementaryTaskCategoryRepo extends Repo<ComplementaryTaskCategory> {

    findByCode(code: string): Promise<ComplementaryTaskCategory | null>;
    findByName(name: string): Promise<ComplementaryTaskCategory[]>;
    findByDescription(description: string): Promise<ComplementaryTaskCategory[]>;
    findByCategory(category: Category): Promise<ComplementaryTaskCategory[]>;
    getTotalCategories(): Promise<number>;
}