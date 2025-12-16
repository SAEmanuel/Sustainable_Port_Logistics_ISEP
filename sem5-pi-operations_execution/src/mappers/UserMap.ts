import { Mapper } from "../core/infra/Mapper";
import { IUserDTO } from "../dto/IUserDTO";
import { User } from "../domain/user/user";
import { UniqueEntityID } from "../core/domain/UniqueEntityID";
import { IUserPersistence } from "../dataschema/IUserPersistence";
import { RoleFactory } from "../domain/user/role";

export default class UserMap extends Mapper<User, IUserDTO, IUserPersistence> {

    toDTO(user: User): IUserDTO {
        return {
            name: user.name,
            auth0UserId: user.auth0UserId,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isEliminated: user.isEliminated
        };
    }

    toDomain(raw: IUserPersistence): User | null {
        const userOrError = User.create(
            {
                name: raw.name,
                auth0UserId: raw.auth0UserId,
                email: raw.email,
                role: RoleFactory.fromString(raw.role),
                isActive: raw.isActive,
                isEliminated: raw.isEliminated
            },
            new UniqueEntityID(raw.domainId)
        );

        if (userOrError.isFailure) {
            console.error(userOrError.error);
            return null;
        }

        return userOrError.getValue();
    }

    toPersistence(user: User): IUserPersistence {
        return {
            domainId: user.id.toString(),
            name: user.name,
            email: user.email,
            auth0UserId: user.auth0UserId,
            role: user.role,
            isActive: user.isActive,
            isEliminated: user.isEliminated
        };
    }
}