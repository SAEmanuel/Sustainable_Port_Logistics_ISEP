import { Inject, Service } from "typedi";
import { BaseController } from "../core/infra/BaseController";
import IUserService from "../services/IServices/IUserService";
import { NextFunction, Request, Response } from "express";
import { IUserDTO } from "../dto/IUserDTO";
import { Logger } from "winston";
import IUserController from "../controllers/IControllers/IUserController";

@Service()
export default class UserController extends BaseController implements IUserController {

    constructor(
        @Inject("UserService") private userService: IUserService,
        @Inject("logger") private logger: Logger
    ) {
        super();
    }

    public async createOrSyncUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> {

        const dto = req.body as IUserDTO;

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

                return res.status(400).json({
                    error: result.errorValue()?.toString() ?? "Unknown error"
                });
            }

            this.logger.info("User synced successfully", {
                email: dto.email
            });

            return res.status(200).json(result.getValue());

        } catch (e) {
            this.logger.error("Unhandled error in UserController.createOrSyncUser", {
                error: e
            });

            return next(e);
        }
    }

    public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userDTO = (req as any).currentUser;

            if (!userDTO) {
                this.logger.warn("GET /users/me called without authenticated user");
                this.unauthorized("No user info available.");
                return;
            }

            this.ok(res, userDTO);

        } catch (e: any) {
            this.logger.error("Unhandled error in UserController.getMe", {
                error: e
            });

            this.fail(e instanceof Error ? e.message : String(e));
        }
    }

    protected executeImpl(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}