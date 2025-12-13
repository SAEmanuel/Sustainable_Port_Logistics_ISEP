import { Result } from "../../core/logic/Result";
import { IComplementaryTaskCategoryDTO } from "../../dto/IComplementaryTaskCategoryDTO";
import { Category } from "../../domain/complementaryTaskCategory/category";

export default interface IComplementaryTaskCategoryService {

    createAsync(dto: IComplementaryTaskCategoryDTO): Promise<Result<IComplementaryTaskCategoryDTO>>;
    updateAsync(code: string, dto: IComplementaryTaskCategoryDTO): Promise<Result<IComplementaryTaskCategoryDTO>>;
    getByCodeAsync(code: string): Promise<Result<IComplementaryTaskCategoryDTO>>;
    getByNameAsync(name: string): Promise<Result<IComplementaryTaskCategoryDTO[]>>;
    getByDescriptionAsync(description: string): Promise<Result<IComplementaryTaskCategoryDTO[]>>;
    getByCategoryAsync(category: Category): Promise<Result<IComplementaryTaskCategoryDTO[]>>;
    activateAsync(code: string): Promise<Result<IComplementaryTaskCategoryDTO>>;
    deactivateAsync(code: string): Promise<Result<IComplementaryTaskCategoryDTO>>;
    getTotalCategoriesAsync(): Promise<Result<number>>;
}