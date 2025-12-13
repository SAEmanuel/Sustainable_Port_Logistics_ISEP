import { Category } from "../domain/complementaryTaskCategory/category";

export interface IComplementaryTaskCategoryDTO {
    id?: string;
    code: string;
    category: Category;
    name: string;
    description: string;
    defaultDuration: number | null;
    isActive?: boolean;
}