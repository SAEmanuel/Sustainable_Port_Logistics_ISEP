import {Inject, Service} from "typedi";
import {Model, Document} from "mongoose";
import IComplementaryTaskCategoryRepo from "../services/IRepos/IComplementaryTaskCategoryRepo";
import {ComplementaryTaskCategory} from "../domain/complementaryTaskCategory/complementaryTaskCategory";
import {IComplementaryTaskCategoryPersistence} from "../dataschema/IComplementaryTaskCategoryPersistence";
import ComplementaryTaskCategoryMap from "../mappers/ComplementaryTaskCategoryMap";
import {Category} from "../domain/complementaryTaskCategory/category";
import {User} from "../domain/user/user";

@Service()
export default class ComplementaryTaskCategoryRepo implements IComplementaryTaskCategoryRepo {

    constructor(
        @Inject("complementaryTaskCategorySchema")
        private complementaryTaskCategorySchema: Model<IComplementaryTaskCategoryPersistence & Document>,

        @Inject("ComplementaryTaskCategoryMap")
        private categoryMap: ComplementaryTaskCategoryMap,

        @Inject("logger")
        private logger: any
    ) {
    }

    public async exists(ctc: ComplementaryTaskCategory): Promise<boolean> {
        const record = await this.complementaryTaskCategorySchema.findOne({ domainId: ctc.id.toString() });
        return !!record;
    }

    public async save(category: ComplementaryTaskCategory): Promise<ComplementaryTaskCategory | null> {

        const rawPersistence = this.categoryMap.toPersistence(category);

        this.logger.debug("Saving ComplementaryTaskCategory", {
            code: category.code
        });

        try {
            const existing =
                await this.complementaryTaskCategorySchema.findOne({
                    domainId: rawPersistence.domainId
                });

            if (existing) {
                existing.set(rawPersistence);
                await existing.save();

                this.logger.info("ComplementaryTaskCategory updated", {
                    code: category.code
                });

                return this.categoryMap.toDomain(existing);
            }

            const created =
                await this.complementaryTaskCategorySchema.create(
                    rawPersistence
                );

            this.logger.info("ComplementaryTaskCategory created", {
                code: category.code
            });

            return this.categoryMap.toDomain(created);

        } catch (e) {
            this.logger.error(
                "Error saving ComplementaryTaskCategory",
                {error: e}
            );
            return null;
        }
    }


    public async findByCode(code: string): Promise<ComplementaryTaskCategory | null> {

        this.logger.debug("Finding ComplementaryTaskCategory by code", {
            code
        });

        try {
            const record = await this.complementaryTaskCategorySchema.findOne({code});

            if (!record) {
                this.logger.warn(
                    "ComplementaryTaskCategory not found by code",
                    {code}
                );
                return null;
            }

            return this.categoryMap.toDomain(record);

        } catch (e) {
            this.logger.error(
                "Error finding ComplementaryTaskCategory by code",
                {code, error: e}
            );
            return null;
        }
    }

    public async findByName(name: string): Promise<ComplementaryTaskCategory[]> {

        this.logger.debug("Finding ComplementaryTaskCategory by name", {
            name
        });

        const records =
            await this.complementaryTaskCategorySchema.find({
                name: {$regex: name, $options: "i"}
            });

        return records
            .map(r => this.categoryMap.toDomain(r))
            .filter((c): c is ComplementaryTaskCategory => c !== null);
    }

    public async findByDescription(description: string): Promise<ComplementaryTaskCategory[]> {

        this.logger.debug(
            "Finding ComplementaryTaskCategory by description",
            {description}
        );

        const records =
            await this.complementaryTaskCategorySchema.find({
                description: {$regex: description, $options: "i"}
            });

        return records
            .map(r => this.categoryMap.toDomain(r))
            .filter((c): c is ComplementaryTaskCategory => c !== null);
    }

    public async findByCategory(category: Category): Promise<ComplementaryTaskCategory[]> {

        this.logger.debug(
            "Finding ComplementaryTaskCategory by category",
            {category}
        );

        const records = await this.complementaryTaskCategorySchema.find({category});

        return records
            .map(r => this.categoryMap.toDomain(r))
            .filter((c): c is ComplementaryTaskCategory => c !== null);
    }


    public async getTotalCategories(): Promise<number> {
        this.logger.debug("Counting ComplementaryTaskCategories");

        try {
            return await this.complementaryTaskCategorySchema.countDocuments();
        } catch (e) {
            this.logger.error(
                "Error counting ComplementaryTaskCategories",
                {error: e}
            );
            return 0;
        }
    }

    public async findAll(): Promise<ComplementaryTaskCategory[]> {
        this.logger.debug("Finding all ComplementaryTaskCategories");

        try {
            const records = await this.complementaryTaskCategorySchema.find();

            return records
                .map(r => this.categoryMap.toDomain(r))
                .filter((c): c is ComplementaryTaskCategory => c !== null);

        } catch (e) {
            this.logger.error(
                "Error fetching all ComplementaryTaskCategories",
                { error: e }
            );
            return [];
        }
    }
}