import { Service, Inject } from "typedi";
import IComplementaryTaskCategoryService from "../services/IServices/IComplementaryTaskCategoryService";
import IComplementaryTaskCategoryRepo from "../services/IRepos/IComplementaryTaskCategoryRepo";
import { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory/complementaryTaskCategory";
import  ComplementaryTaskCategoryMap  from "../mappers/ComplementaryTaskCategoryMap";
import { IComplementaryTaskCategoryDTO } from "../dto/IComplementaryTaskCategoryDTO";
import { Result } from "../core/logic/Result";
import { Category, CategoryFactory } from "../domain/complementaryTaskCategory/category";
import { Logger } from "winston";
import { BusinessRuleValidationError } from "../core/logic/BusinessRuleValidationError";
import { CTCError } from "../domain/complementaryTaskCategory/errors/ctcErrors";

@Service()
export default class ComplementaryTaskCategoryService
    implements IComplementaryTaskCategoryService {

    constructor(
        @Inject("ComplementaryTaskCategoryRepo")
        private repo: IComplementaryTaskCategoryRepo,

        @Inject("ComplementaryTaskCategoryMap")
        private categoryMap: ComplementaryTaskCategoryMap,

        @Inject("logger")
        private logger: Logger
    ) {}


    public async createAsync(
        dto: IComplementaryTaskCategoryDTO
    ): Promise<Result<IComplementaryTaskCategoryDTO>> {

        this.logger.info("Creating ComplementaryTaskCategory", { code: dto.code });

        const exists = await this.repo.findByCode(dto.code);
        if (exists) {
            throw new BusinessRuleValidationError(
                CTCError.AlreadyExists,
                "Complementary task category already exists",
                `Code ${dto.code} already exists`
            );
        }

        const category = CategoryFactory.fromString(dto.category);

        const ctc = ComplementaryTaskCategory.create({
            code: dto.code,
            name: dto.name,
            description: dto.description,
            category,
            defaultDuration: dto.defaultDuration ?? null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: null
        });

        const saved = await this.repo.save(ctc);
        if (!saved) {
            throw new BusinessRuleValidationError(
                CTCError.PersistError,
                "Error saving complementary task category"
            );
        }

        return Result.ok(this.categoryMap.toDTO(saved));
    }


    public async updateAsync(
        code: string,
        dto: IComplementaryTaskCategoryDTO
    ): Promise<Result<IComplementaryTaskCategoryDTO>> {

        const category = await this.repo.findByCode(code);
        if (!category) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task category not found",
                `No category found with code ${code}`
            );
        }

        const parsedCategory = CategoryFactory.fromString(dto.category);

        category.changeDetails(
            dto.name,
            dto.description,
            dto.defaultDuration ?? null,
            parsedCategory
        );

        const saved = await this.repo.save(category);
        if (!saved) {
            throw new BusinessRuleValidationError(
                CTCError.PersistError,
                "Error updating complementary task category"
            );
        }

        return Result.ok(this.categoryMap.toDTO(saved));
    }


    public async getByCodeAsync(
        code: string
    ): Promise<Result<IComplementaryTaskCategoryDTO>> {

        const category = await this.repo.findByCode(code);
        if (!category) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task category not found",
                `No category found with code ${code}`
            );
        }

        return Result.ok(this.categoryMap.toDTO(category));
    }


    public async getByNameAsync(
        name: string
    ): Promise<Result<IComplementaryTaskCategoryDTO[]>> {

        const categories = await this.repo.findByName(name);
        return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
    }

    public async getByDescriptionAsync(
        description: string
    ): Promise<Result<IComplementaryTaskCategoryDTO[]>> {

        const categories = await this.repo.findByDescription(description);
        return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
    }

    public async getByCategoryAsync(
        category: Category
    ): Promise<Result<IComplementaryTaskCategoryDTO[]>> {

        const categories = await this.repo.findByCategory(CategoryFactory.fromString(category));
        return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
    }


    public async activateAsync(
        code: string
    ): Promise<Result<IComplementaryTaskCategoryDTO>> {

        const category = await this.repo.findByCode(code);
        if (!category) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task category not found",
                `No category found with code ${code}`
            );
        }

        category.activate();

        const saved = await this.repo.save(category);
        if (!saved) {
            throw new BusinessRuleValidationError(
                CTCError.ActivateError,
                "Error activating complementary task category"
            );
        }

        return Result.ok(this.categoryMap.toDTO(saved));
    }


    public async deactivateAsync(
        code: string
    ): Promise<Result<IComplementaryTaskCategoryDTO>> {

        const category = await this.repo.findByCode(code);
        if (!category) {
            throw new BusinessRuleValidationError(
                CTCError.NotFound,
                "Complementary task category not found",
                `No category found with code ${code}`
            );
        }

        category.deactivate();

        const saved = await this.repo.save(category);
        if (!saved) {
            throw new BusinessRuleValidationError(
                CTCError.DeactivateError,
                "Error deactivating complementary task category"
            );
        }

        return Result.ok(this.categoryMap.toDTO(saved));
    }


    public async getTotalCategoriesAsync(): Promise<Result<number>> {
        const total = await this.repo.getTotalCategories();
        return Result.ok(total);
    }

    public async getAllAsync(): Promise<Result<IComplementaryTaskCategoryDTO[]>> {
        this.logger.debug("Fetching all ComplementaryTaskCategories");

        const categories = await this.repo.findAll();
        return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
    }
}