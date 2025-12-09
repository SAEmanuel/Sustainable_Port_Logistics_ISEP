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

    get role() : Role {
        return this.props.role;
    }

    get auth0userid() : string {
        return this.props.auth0UserId;
    }

    set role(value: Role) {
        this.props.role = value;
    }

    private constructor(props : UserProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create (props: UserProps, id?: UniqueEntityID): Result<User> {

        const guardedProps = [
            { argument: props.name, argumentName: 'name' },
            { argument: props.email, argumentName: 'email' },
            { argument: props.role, argumentName: 'role' }
        ];

        const guardResult = Guard.againstNullOrUndefinedBulk(guardedProps);

        if (!guardResult.succeeded) {
            return Result.fail<User>(guardResult.message)
        }
        else {
            const user = new User({
                ...props
            }, id);

            return Result.ok<User>(user);
        }
    }



}
