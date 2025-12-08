import { Service, Inject } from "typedi";
import IUserService from "../services/IServices/IUserService";
import IUserRepo from "../repos/IRepos/IUserRepo";
import { User } from "../domain/user";
import { UserMap } from "../mappers/UserMap";
import { IUserDTO } from "../dto/IUserDTO";
import { Result } from "../core/logic/Result";
import { GenericAppError } from "../core/logic/AppError";
import { Role } from "../domain/role";

@Service()
export default class UserService implements IUserService {

    constructor(
        @Inject('UserRepo') private userRepo: IUserRepo,
    ) {}


    public async createUser(userDTO: IUserDTO): Promise<Result<IUserDTO>> {
        try {
            const userExists = await this.userRepo.findByEmail(userDTO.email);

            if (userExists) {
                return Result.fail<IUserDTO>("User already exists.");
            }

            const userOrError = User.create({
                name: userDTO.name,
                email: userDTO.email,
                role: userDTO.role as Role,
                auth0Id: userDTO.auth0Id
            });

            if (userOrError.isFailure) {
                return Result.fail<IUserDTO>(String(userOrError.errorValue()));
            }

            const user = userOrError.getValue();
            const userSaved = await this.userRepo.save(user);

            const userDTOSaved = UserMap.toDTO(userSaved);
            return Result.ok<IUserDTO>(userDTOSaved);

        } catch (e) {
            return Result.fail<IUserDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async updateUser(userDTO: IUserDTO): Promise<Result<IUserDTO>> {
        try {
            const user = await this.userRepo.findByEmail(userDTO.email);

            if (!user) {
                return Result.fail<IUserDTO>("User not found.");
            }


            user.role = userDTO.role as Role;

            const userSaved = await this.userRepo.save(user);
            const userDTOSaved = UserMap.toDTO(userSaved);

            return Result.ok<IUserDTO>(userDTOSaved);

        } catch (e) {
            return Result.fail<IUserDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async getUser(email: string): Promise<Result<IUserDTO>> {
        try {
            const user = await this.userRepo.findByEmail(email);

            if (!user) {
                return Result.fail<IUserDTO>("User not found for email: " + email);
            }

            const userDTO = UserMap.toDTO(user);
            return Result.ok<IUserDTO>(userDTO);

        } catch (e) {
            return Result.fail<IUserDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }

    public async getRole(email: string): Promise<Result<Role>> {
        try {
            const user = await this.userRepo.findByEmail(email);

            if (!user) {
                return Result.fail<Role>("User not found locally.");
            }

            const userRole: Role = user.role;

            return Result.ok<Role>(userRole);

        } catch (e) {
            return Result.fail<Role>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }
}