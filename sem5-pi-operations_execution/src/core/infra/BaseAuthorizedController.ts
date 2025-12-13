import { BaseController } from "./BaseController";
import { Inject } from "typedi";
import IUserRepo from "../../services/IRepos/IUserRepo";
import { Role } from "../../domain/user/role";
import { Result } from "../logic/Result";

export abstract class BaseAuthorizedController extends BaseController {

    constructor(
        @Inject("UserRepo") protected userRepo: IUserRepo
    ) {
        super();
    }

    protected async authorizeRequest(
        allowedRoles: Role[]
    ): Promise<Result<any>> {

        const email = this.req.headers["x-user-email"] as string;

        if (!email) {
            return Result.fail("Missing user email.");
        }

        const user = await this.userRepo.findByEmail(email);

        if (!user) return Result.fail("User not found.");
        if (!user.isActive) return Result.fail("User is not active.");
        if (user.isEliminated) return Result.fail("User has been eliminated.");

        if (!allowedRoles.includes(user.role)) {
            return Result.fail(
                `User lacks permission. Needed: ${allowedRoles.join(", ")}`
            );
        }

        return Result.ok();
    }
}