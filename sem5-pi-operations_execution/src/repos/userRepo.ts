import IUserRepo from "../services/IRepos/IUserRepo";
import { Inject, Service } from "typedi";
import { User } from "../domain/user/user";
import { IUserPersistence } from "../dataschema/IUserPersistence";
import { Document, Model } from "mongoose";
import  UserMap  from "../mappers/UserMap";
import { Logger } from "winston";

@Service()
export default class UserRepo implements IUserRepo {

    constructor(
        @Inject("userSchema")
        private userSchema: Model<IUserPersistence & Document>,

        @Inject("UserMap")
        private userMap: UserMap,

        @Inject("logger")
        private logger: Logger
    ) {}

    public async exists(user: User): Promise<boolean> {
        const record = await this.userSchema.findOne({ domainId: user.id.toString() });
        return !!record;
    }

    public async save(user: User): Promise<User | null> {
        try {
            const rawUser = this.userMap.toPersistence(user);
            const existing = await this.userSchema.findOne({ email: rawUser.email });

            let persistedDoc;

            if (existing) {
                Object.assign(existing, rawUser);
                await existing.save();
                persistedDoc = existing;
            } else {
                persistedDoc = await this.userSchema.create(rawUser);
            }

            return this.userMap.toDomain(persistedDoc);

        } catch (err) {
            this.logger.error("Error in UserRepo.save", {
                error: err,
                email: user.email,
                domainId: user.id.toString()
            });
            throw err;
        }
    }

    public async findByEmail(email: string): Promise<User | null> {
        const userRecord = await this.userSchema.findOne({ email });
        return userRecord ? this.userMap.toDomain(userRecord) : null;
    }
}