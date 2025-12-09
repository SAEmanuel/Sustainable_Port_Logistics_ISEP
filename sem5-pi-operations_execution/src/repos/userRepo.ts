import IUserRepo from "../services/IRepos/IUserRepo";
import { Inject, Service } from "typedi";
import { User } from "../domain/user";
import { IUserPersistence } from "../dataschema/IUserPersistence";
import { Document, Model } from "mongoose";
import { UserMap } from "../mappers/UserMap";

@Service()
export default class UserRepo implements IUserRepo {

    constructor(
        @Inject("userSchema")
        private userSchema: Model<IUserPersistence & Document>,

        @Inject("logger")
        private logger: any
    ) {}

    public async exists(user: User): Promise<boolean> {
        const id = user.id.toString();
        const record = await this.userSchema.findOne({ domainId: id });
        return !!record;
    }

    public async save(user: User): Promise<User | null> {
        try {
            // mapped object from domain to persistence
            const rawUser = UserMap.toPersistence(user);

            // find existing user by email (unique key)
            const existing = await this.userSchema.findOne({ email: rawUser.email });

            let persistedDoc;

            if (existing) {
                // update allowed fields
                existing.name = rawUser.name;
                existing.role = rawUser.role;
                existing.auth0UserId = rawUser.auth0UserId;

                // optional update: ensure email synced
                existing.email = rawUser.email;

                await existing.save();
                persistedDoc = existing;
            } else {
                // create new user
                const created = await this.userSchema.create(rawUser);
                persistedDoc = created;
            }

            return UserMap.toDomain(persistedDoc);

        } catch (err) {
            this.logger.error("Error in UserRepo.save:", err);
            throw err;
        }
    }

    public async findByEmail(email: string): Promise<User | null> {
        const userRecord = await this.userSchema.findOne({ email });

        return userRecord ? UserMap.toDomain(userRecord) : null;
    }
}