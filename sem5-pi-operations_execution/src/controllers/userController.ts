import { Inject, Service } from "typedi";
import { BaseController } from "../core/infra/BaseController";
import IUserService from "../services/IServices/IUserService";
import { IUserDTO } from "../dto/IUserDTO";
import { Logger } from "winston";

@Service()
export default class UserController extends BaseController {

    constructor(
        @Inject("UserService") private userService: IUserService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }


    protected async executeImpl(): Promise<void> {
        const dto = this.req.body as IUserDTO;

        this.logger.info("HTTP POST /users/sync", {
            email: dto?.email
        });

        try {
            const userExists = await this.userService.getUser(dto.email);

            this.logger.debug("User existence check", {
                email: dto.email,
                exists: userExists.isSuccess
            });

            const result = userExists.isSuccess
                ? await this.userService.updateUser(dto)
                : await this.userService.createUser(dto);

            if (result.isFailure) {
                this.logger.warn("User sync failed", {
                    email: dto.email,
                    reason: result.errorValue()
                });

                this.clientError(
                    result.errorValue()?.toString() ?? "Unknown error"
                );
                return;
            }

            this.logger.info("User synced successfully", {
                email: dto.email
            });

            this.ok(this.res, result.getValue());
            return;

        } catch (error) {
            this.logger.error("Unhandled error in UserController", { error });
            this.fail(error as Error);
            return;
        }
    }

    public async getMe(): Promise<void> {
        try {
            const userDTO = (this.req as any).currentUser;

            if (!userDTO) {
                this.logger.warn("GET /users/me without authenticated user");
                this.unauthorized("No user info available.");
                return;
            }

            this.ok(this.res, userDTO);
            return;

        } catch (error) {
            this.logger.error("Unhandled error in UserController.getMe", { error });
            this.fail(error as Error);
            return;
        }
    }
}