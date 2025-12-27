import { AggregateRoot } from "../../core/domain/AggregateRoot";
import { UniqueEntityID } from "../../core/domain/UniqueEntityID";
import { Guard } from "../../core/logic/Guard";
import { ComplementaryTaskCategoryId } from "./complementaryTaskCategoryId";
import { Category } from "./category";
import { BusinessRuleValidationError } from "../../core/logic/BusinessRuleValidationError";
import { CTCError } from "./errors/ctcErrors";

interface ComplementaryTaskCategoryProps {
    code: string;
    category: Category;
    name: string;
    description: string;
    defaultDuration: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date | null;
}

export class ComplementaryTaskCategory
    extends AggregateRoot<ComplementaryTaskCategoryProps> {

    get id(): UniqueEntityID {
        return this._id;
    }

    get categoryId(): ComplementaryTaskCategoryId {
        return ComplementaryTaskCategoryId.create(this._id.toString());
    }

    get code(): string {
        return this.props.code;
    }

    get category(): Category {
        return this.props.category;
    }

    get name(): string {
        return this.props.name;
    }

    get description(): string {
        return this.props.description;
    }

    get defaultDuration(): number | null {
        return this.props.defaultDuration;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date | null {
        return this.props.updatedAt;
    }

    private constructor(
        props: ComplementaryTaskCategoryProps,
        id?: UniqueEntityID
    ) {
        super(props, id);
    }



    public changeDetails(
        name: string,
        description: string,
        defaultDuration: number | null,
        category: Category
    ): void {

        if (!name || !description) {
            throw new BusinessRuleValidationError(
                CTCError.InvalidInput,
                "Invalid category details",
                "Name and description are required"
            );
        }

        this.props.name = name;
        this.props.description = description;
        this.props.defaultDuration = defaultDuration;
        this.props.category = category;

        this.touch();
    }

    public deactivate(): void {
        if (!this.props.isActive) {
            throw new BusinessRuleValidationError(
                CTCError.AlreadyInactive,
                "Category already inactive",
                "Complementary Task Category is already inactive"
            );
        }

        this.props.isActive = false;
        this.touch();
    }

    public activate(): void {
        if (this.props.isActive) {
            throw new BusinessRuleValidationError(
                CTCError.AlreadyActive,
                "Category already active",
                "Complementary Task Category is already active"
            );
        }

        this.props.isActive = true;
        this.touch();
    }



    public static create(
        props: ComplementaryTaskCategoryProps,
        id?: UniqueEntityID
    ): ComplementaryTaskCategory {

        const guardedProps = [
            { argument: props.code, argumentName: "code" },
            { argument: props.category, argumentName: "category" },
            { argument: props.name, argumentName: "name" },
            { argument: props.description, argumentName: "description" },
            { argument: props.isActive, argumentName: "isActive" },
            { argument: props.createdAt, argumentName: "createdAt" }
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);

        if (!guardResult.succeeded) {
            throw new BusinessRuleValidationError(
                CTCError.InvalidInput,
                "Invalid input",
                guardResult.message ?? "Invalid input"
            );
        }

        if (!props.name.trim() || !props.description.trim()) {
            throw new BusinessRuleValidationError(
                CTCError.InvalidInput,
                "Invalid category details",
                "Name and description are required"
            );
        }

        if (!this.isValidCodeFormat(props.code)) {
            throw new BusinessRuleValidationError(
                CTCError.InvalidCodeFormat,
                "Invalid code format",
                "Code must follow the format CTC###"
            );
        }

        return new ComplementaryTaskCategory(
            {
                ...props,
                updatedAt: props.updatedAt ?? null
            },
            id
        );
    }



    private static isValidCodeFormat(code: string): boolean {
        return /^CTC\d{3}$/.test(code);
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}