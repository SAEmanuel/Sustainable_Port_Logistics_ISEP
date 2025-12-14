import type {Category} from "../domain/complementaryTaskCategory.ts";

export interface ComplementaryTaskCategoryDTO {
    id: string;
    code: string;
    name: string;
    description: string;
    category: Category;
    defaultDuration?: number | null;
    isActive: boolean;
}