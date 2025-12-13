import { Service, Inject } from "typedi";
import IComplementaryTaskCategoryService from "../services/IServices/IComplementaryTaskCategoryService";
import IComplementaryTaskCategoryRepo from "../services/IRepos/IComplementaryTaskCategoryRepo";
import { ComplementaryTaskCategory } from "../domain/complementaryTaskCategory/complementaryTaskCategory";
import { ComplementaryTaskCategoryMap } from "../mappers/ComplementaryTaskCategoryMap";
import { IComplementaryTaskCategoryDTO } from "../dto/IComplementaryTaskCategoryDTO";
import { Result } from "../core/logic/Result";
import { GenericAppError } from "../core/logic/AppError";
import { Category } from "../domain/complementaryTaskCategory/category";
import { Logger } from "winston";

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


    public async createAsync(dto: IComplementaryTaskCategoryDTO): Promise<Result<IComplementaryTaskCategoryDTO>> {

        this.logger.info("Creating ComplementaryTaskCategory", {
            code: dto.code
        });

        try {
            const exists = await this.repo.findByCode(dto.code);

            if (exists) {
                this.logger.warn("ComplementaryTaskCategory already exists", {
                    code: dto.code
                });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Complementary task category already exists."
                );
            }

            const categoryOrError = ComplementaryTaskCategory.create({
                code: dto.code,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                defaultDuration: dto.defaultDuration ?? null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: null
            });

            if (categoryOrError.isFailure) {
                this.logger.warn("Domain validation failed on create", {
                    code: dto.code,
                    reason: categoryOrError.errorValue()
                });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    String(categoryOrError.errorValue())
                );
            }

            const saved = await this.repo.save(categoryOrError.getValue());

            if (!saved) {
                this.logger.error("Failed to persist ComplementaryTaskCategory", {
                    code: dto.code
                });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Error saving complementary task category."
                );
            }

            this.logger.info("ComplementaryTaskCategory created successfully", {
                code: dto.code
            });

            return Result.ok(
                this.categoryMap.toDTO(saved)
            );

        } catch (e) {
            this.logger.error("Unexpected error creating category", { e });

            return Result.fail<IComplementaryTaskCategoryDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }


    public async updateAsync(code: string, dto: IComplementaryTaskCategoryDTO): Promise<Result<IComplementaryTaskCategoryDTO>> {

        this.logger.info("Updating ComplementaryTaskCategory", { code });

        try {
            const category = await this.repo.findByCode(code);

            if (!category) {
                this.logger.warn("Category not found for update", { code });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Complementary task category not found."
                );
            }

            category.changeDetails(
                dto.name,
                dto.description,
                dto.defaultDuration ?? null,
                dto.category
            );

            const saved = await this.repo.save(category);

            if (!saved) {
                this.logger.error("Failed to update ComplementaryTaskCategory", {
                    code
                });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Error updating complementary task category."
                );
            }

            this.logger.info("ComplementaryTaskCategory updated", { code });

            return Result.ok(
                this.categoryMap.toDTO(saved)
            );

        } catch (e) {
            this.logger.error("Unexpected error updating category", { code, e });

            return Result.fail<IComplementaryTaskCategoryDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }


    public async getByCodeAsync(code: string): Promise<Result<IComplementaryTaskCategoryDTO>> {

        this.logger.debug("Fetching ComplementaryTaskCategory by code", { code });

        try {
            const category = await this.repo.findByCode(code);

            if (!category) {
                this.logger.warn("Category not found", { code });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Complementary task category not found."
                );
            }

            return Result.ok(
                this.categoryMap.toDTO(category)
            );

        } catch (e) {
            this.logger.error("Unexpected error fetching category", { code, e });

            return Result.fail<IComplementaryTaskCategoryDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }


    public async getByNameAsync(name: string): Promise<Result<IComplementaryTaskCategoryDTO[]>> {

        this.logger.debug("Fetching categories by name", { name });

        try {
            const categories = await this.repo.findByName(name);
            return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
        } catch (e) {
            this.logger.error("Error fetching categories by name", { name, e });

            return Result.fail<IComplementaryTaskCategoryDTO[]>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async getByDescriptionAsync(description: string): Promise<Result<IComplementaryTaskCategoryDTO[]>> {

        this.logger.debug("Fetching categories by description", { description });

        try {
            const categories = await this.repo.findByDescription(description);
            return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
        } catch (e) {
            this.logger.error("Error fetching categories by description", {
                description,
                e
            });

            return Result.fail<IComplementaryTaskCategoryDTO[]>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async getByCategoryAsync(category: Category): Promise<Result<IComplementaryTaskCategoryDTO[]>> {

        this.logger.debug("Fetching categories by category", { category });

        try {
            const categories = await this.repo.findByCategory(category);
            return Result.ok(categories.map(c => this.categoryMap.toDTO(c)));
        } catch (e) {
            this.logger.error("Error fetching categories by category", {
                category,
                e
            });

            return Result.fail<IComplementaryTaskCategoryDTO[]>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }


    public async activateAsync(code: string): Promise<Result<IComplementaryTaskCategoryDTO>> {

        this.logger.info("Activating ComplementaryTaskCategory", { code });

        try {
            const category = await this.repo.findByCode(code);

            if (!category) {
                this.logger.warn("Category not found for activation", { code });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Complementary task category not found."
                );
            }

            category.activate();
            const saved = await this.repo.save(category);

            if (!saved) {
                this.logger.error("Failed to activate category", { code });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Error activating complementary task category."
                );
            }

            return Result.ok(
                this.categoryMap.toDTO(saved)
            );

        } catch (e) {
            this.logger.error("Unexpected error activating category", { code, e });

            return Result.fail<IComplementaryTaskCategoryDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async deactivateAsync(code: string): Promise<Result<IComplementaryTaskCategoryDTO>> {

        this.logger.info("Deactivating ComplementaryTaskCategory", { code });

        try {
            const category = await this.repo.findByCode(code);

            if (!category) {
                this.logger.warn("Category not found for deactivation", { code });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Complementary task category not found."
                );
            }

            category.deactivate();
            const saved = await this.repo.save(category);

            if (!saved) {
                this.logger.error("Failed to deactivate category", { code });

                return Result.fail<IComplementaryTaskCategoryDTO>(
                    "Error deactivating complementary task category."
                );
            }

            return Result.ok(
                this.categoryMap.toDTO(saved)
            );

        } catch (e) {
            this.logger.error("Unexpected error deactivating category", {
                code,
                e
            });

            return Result.fail<IComplementaryTaskCategoryDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async getTotalCategoriesAsync(): Promise<Result<number>> {
        this.logger.debug("Fetching total number of ComplementaryTaskCategories");

        try {
            const total = await this.repo.getTotalCategories();
            return Result.ok(total);
        } catch (e) {
            this.logger.error("Error fetching total categories", { e });

            return Result.fail<number>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }
}