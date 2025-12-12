import {AggregateRoot} from "../core/domain/AggregateRoot";
import {UniqueEntityID} from "../core/domain/UniqueEntityID";
import {Result} from "../core/logic/Result";
import {UserId} from "./userId";
import {Role} from "./role";
import {Guard} from "../core/logic/Guard";

interface UserProps {
    auth0UserId: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean
    isEliminated: boolean
}

export class User extends AggregateRoot<UserProps> {

    get id(): UniqueEntityID {
        return this._id;
    }

    get userId(): UserId {
        return UserId.caller(this.id)
    }

    get email(): string {
        return this.props.email;
    }

    get name(): string {
        return this.props.name;
    }

    get role(): Role {
        return this.props.role;
    }

    get auth0UserId(): string {
        return this.props.auth0UserId;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get isEliminated(): boolean {
        return this.props.isEliminated;
    }

    set name (value: string) {
        this.props.name = value;
    }

    set role(value: Role) {
        this.props.role = value;
    }

    set isActive(value: boolean) {
        this.props.isActive = value;
    }

    set isEliminated(value: boolean) {
        this.props.isEliminated = value;
    }

    private constructor(props: UserProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: UserProps, id?: UniqueEntityID): Result<User> {
        console.log("USER.CREATE INPUT:", props);
        const guardedProps = [
            {argument: props.name, argumentName: 'name'},
            {argument: props.email, argumentName: 'email'},
            {argument: props.role, argumentName: 'role'},
            {argument: props.isActive, argumentName: 'isActive'},
            {argument: props.isEliminated, argumentName: 'isEliminated'}
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);

        if (!guardResult.succeeded) {
            return Result.fail<User>(guardResult.message)
        } else {
            const user = new User({
                ...props
            }, id);

            return Result.ok<User>(user);
        }
    }

}
