import { Category } from "../domain/complementaryTaskCategory/category";

export interface IComplementaryTaskCategoryPersistence {
    domainId: string;
    code: string;
    category: Category;
    name: string;
    description: string;
    defaultDuration: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date | null;
}