import {Result} from "../../core/logic/Result";
import {Role} from "../../domain/role";
import {IUserDTO} from "../../dto/IUserDTO";

export default interface IUserService {
    createUser(userDTO: IUserDTO): Promise<Result<IUserDTO>>;
    updateUser(userDTO: IUserDTO):  Promise<Result<IUserDTO>>;
    getUser (email: string): Promise<Result<IUserDTO>>;
    getRole (email: string) : Promise<Result<Role>>;

}