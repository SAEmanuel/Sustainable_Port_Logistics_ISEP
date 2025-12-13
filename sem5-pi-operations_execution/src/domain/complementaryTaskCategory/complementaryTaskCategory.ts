import { AggregateRoot } from "../../core/domain/AggregateRoot";
import { UniqueEntityID } from "../../core/domain/UniqueEntityID";
import { Result } from "../../core/logic/Result";
import { Guard } from "../../core/logic/Guard";
import { ComplementaryTaskCategoryId } from "./complementaryTaskCategoryId";
import { Category } from "./category";

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
        return ComplementaryTaskCategoryId.caller(this.id);
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


    public changeCode(code: string): Result<void> {
        if (!ComplementaryTaskCategory.isValidCodeFormat(code)) {
            return Result.fail<void>(
                "Code must follow the format CTC###"
            );
        }

        this.props.code = code;
        this.touch();
        return Result.ok<void>();
    }

    public changeDetails(
        name: string,
        description: string,
        defaultDuration: number | null,
        category: Category
    ): Result<void> {

        this.props.name = name;
        this.props.description = description;
        this.props.defaultDuration = defaultDuration;
        this.props.category = category;

        this.touch();
        return Result.ok<void>();
    }

    public deactivate(): Result<void> {
        if (!this.props.isActive) {
            return Result.fail<void>(
                "Complementary Task Category is already inactive"
            );
        }

        this.props.isActive = false;
        this.touch();
        return Result.ok<void>();
    }

    public activate(): Result<void> {
        this.props.isActive = true;
        this.touch();
        return Result.ok<void>();
    }


    public static create(
        props: ComplementaryTaskCategoryProps,
        id?: UniqueEntityID
    ): Result<ComplementaryTaskCategory> {

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
            return Result.fail<ComplementaryTaskCategory>(
                guardResult.message ?? "Invalid input"
            );
        }

        if (!this.isValidCodeFormat(props.code)) {
            return Result.fail<ComplementaryTaskCategory>(
                "Code must follow the format CTC###"
            );
        }

        const category = new ComplementaryTaskCategory(
            {
                ...props,
                updatedAt: props.updatedAt ?? null
            },
            id
        );

        return Result.ok<ComplementaryTaskCategory>(category);
    }



    private static isValidCodeFormat(code: string): boolean {
        return /^CTC\d{3}$/.test(code);
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}