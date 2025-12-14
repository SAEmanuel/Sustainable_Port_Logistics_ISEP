export interface CreateComplementaryTaskCategoryDTO {
    code: string;
    name: string;
    description: string;
    category: string;
    defaultDuration?: number;
}