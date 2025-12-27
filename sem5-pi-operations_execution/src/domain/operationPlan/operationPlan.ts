import { AggregateRoot } from "../../core/domain/AggregateRoot";
import { UniqueEntityID } from "../../core/domain/UniqueEntityID";
import { Result } from "../../core/logic/Result";
import { IOperationPlanDTO, IOperationDTO } from "../../dto/IOperationPlanDTO";

interface OperationPlanProps {
    algorithm: string;
    totalDelay: number;
    status: string;
    operations: IOperationDTO[];
    planDate: Date;
    createdAt: Date;
    author: string;
}

export class OperationPlan extends AggregateRoot<OperationPlanProps> {

    get id(): UniqueEntityID {
        return this._id;
    }

    get algorithm(): string { return this.props.algorithm; }
    get totalDelay(): number { return this.props.totalDelay; }
    get status(): string { return this.props.status; }
    get operations(): IOperationDTO[] { return this.props.operations; }
    get planDate(): Date { return this.props.planDate; }
    get author(): string { return this.props.author; }
    get createdAt(): Date { return this.props.createdAt; }

    private constructor(props: OperationPlanProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: OperationPlanProps, id?: UniqueEntityID): Result<OperationPlan> {

        if (!props.algorithm || props.algorithm.length === 0) {
            return Result.fail<OperationPlan>("O algoritmo deve ser especificado.");
        }

        if (!props.operations) {
            return Result.fail<OperationPlan>("O plano deve conter uma lista de operações (mesmo que vazia).");
        }

        return Result.ok<OperationPlan>(new OperationPlan(props, id));
    }
}