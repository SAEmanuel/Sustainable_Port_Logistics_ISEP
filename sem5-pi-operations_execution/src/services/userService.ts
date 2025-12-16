import { Service, Inject } from "typedi";
import IUserService from "../services/IServices/IUserService";
import IUserRepo from "../services/IRepos/IUserRepo";
import { User } from "../domain/user/user";
import UserMap from "../mappers/UserMap";
import { IUserDTO } from "../dto/IUserDTO";
import { Result } from "../core/logic/Result";
import { GenericAppError } from "../core/logic/AppError";
import { Role } from "../domain/user/role";
import { Logger } from "winston";

@Service()
export default class UserService implements IUserService {

    constructor(
        @Inject("UserRepo") private userRepo: IUserRepo,
        @Inject("UserMap") private userMap: UserMap,
        @Inject("logger") private logger: Logger
    ) {}



    public async createUser(userDTO: IUserDTO): Promise<Result<IUserDTO>> {
        this.logger.info("Creating user", {
            email: userDTO.email,
            role: userDTO.role
        });

        try {
            const userExists = await this.userRepo.findByEmail(userDTO.email);

            if (userExists) {
                this.logger.warn("User already exists", {
                    email: userDTO.email
                });

                return Result.fail<IUserDTO>("User already exists.");
            }

            const userOrError = User.create({
                name: userDTO.name,
                email: userDTO.email,
                role: userDTO.role as Role,
                auth0UserId: userDTO.auth0UserId,
                isActive: userDTO.isActive,
                isEliminated: userDTO.isEliminated
            });

            if (userOrError.isFailure) {
                this.logger.warn("User creation failed due to domain validation", {
                    email: userDTO.email,
                    reason: userOrError.errorValue()
                });

                return Result.fail<IUserDTO>(
                    String(userOrError.errorValue())
                );
            }

            const user = userOrError.getValue();
            const userSaved = await this.userRepo.save(user);

            if (!userSaved) {
                this.logger.error("User repository failed to save user", {
                    email: userDTO.email
                });

                return Result.fail<IUserDTO>("Error saving user.");
            }

            this.logger.info("User created successfully", {
                email: userDTO.email
            });

            return Result.ok<IUserDTO>(
                this.userMap.toDTO(userSaved)
            );

        } catch (e) {
            this.logger.error("Unexpected error while creating user", {
                email: userDTO.email
            });

            return Result.fail<IUserDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }



    public async updateUser(userDTO: IUserDTO): Promise<Result<IUserDTO>> {
        this.logger.info("Updating user", {
            email: userDTO.email
        });

        try {
            const user = await this.userRepo.findByEmail(userDTO.email);

            if (!user) {
                this.logger.warn("User not found for update", {
                    email: userDTO.email
                });

                return Result.fail<IUserDTO>("User not found.");
            }

            user.name = userDTO.name;
            user.role = userDTO.role as Role;
            user.isActive = userDTO.isActive;
            user.isEliminated = userDTO.isEliminated;

            const userSaved = await this.userRepo.save(user);

            if (!userSaved) {
                this.logger.error("User repository failed to update user", {
                    email: userDTO.email
                });

                return Result.fail<IUserDTO>("Error updating user.");
            }

            this.logger.info("User updated successfully", {
                email: userDTO.email
            });

            return Result.ok<IUserDTO>(
                this.userMap.toDTO(userSaved)
            );

        } catch (e) {
            this.logger.error("Unexpected error while updating user", {
                email: userDTO.email
            });

            return Result.fail<IUserDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }



    public async getUser(email: string): Promise<Result<IUserDTO>> {
        this.logger.debug("Fetching user", { email });

        try {
            const user = await this.userRepo.findByEmail(email);

            if (!user) {
                this.logger.warn("User not found", { email });

                return Result.fail<IUserDTO>(
                    "User not found for email: " + email
                );
            }

            return Result.ok<IUserDTO>(
                this.userMap.toDTO(user)
            );

        } catch (e) {
            this.logger.error("Unexpected error while fetching user", { email });

            return Result.fail<IUserDTO>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }



    public async getRole(email: string): Promise<Result<Role>> {
        this.logger.debug("Fetching user role", { email });

        try {
            const user = await this.userRepo.findByEmail(email);

            if (!user) {
                this.logger.warn("User not found when fetching role", { email });

                return Result.fail<Role>("User not found locally.");
            }

            return Result.ok<Role>(user.role);

        } catch (e) {
            this.logger.error("Unexpected error while fetching user role", {
                email
            });

            return Result.fail<Role>(
                String(new GenericAppError.UnexpectedError(e).errorValue())
            );
        }
    }
}