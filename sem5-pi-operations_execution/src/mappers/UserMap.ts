import { Mapper } from "../core/infra/Mapper";
import { IUserDTO } from "../dto/IUserDTO";
import { User } from "../domain/user";
import { UniqueEntityID } from "../core/domain/UniqueEntityID";

export class UserMap extends Mapper<User> {

    public static toDTO(user: User): IUserDTO {
        return {
            name: user.name,
            auth0UserId: user.auth0userid,
            email: user.email,
            role: user.role
        };
    }

    public static async toDomain(raw: any): Promise<User | null> {

        const userOrError = User.create(
            {
                name: raw.name,
                auth0UserId: raw.auth0UserId,
                email: raw.email,
                role: raw.role
            },
            new UniqueEntityID(raw.domainId)
        );

        if (userOrError.isFailure) {
            console.error(userOrError.error);
            return null;
        }

        return userOrError.getValue();
    }

    public static toPersistence(user: User): any {
        return {
            domainId: user.id.toString(),
            email: user.email,
            name: user.name,
            auth0UserId: user.auth0userid,
            role: user.role
        };
    }
}