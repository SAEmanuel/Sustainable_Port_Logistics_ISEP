import { Repo } from "../../core/infra/Repo";
import { User } from "../../domain/user";


export default interface IUserRepo extends Repo<User> {
    findByEmail(email: string): Promise<User | null>;
}