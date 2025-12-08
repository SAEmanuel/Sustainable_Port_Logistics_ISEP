import { Inject, Service } from "typedi";
import IUserController from "./IControllers/IUserController";
import { BaseController } from "../core/infra/BaseController";
import IUserService from "../services/IServices/IUserService";
import { NextFunction, Request, Response } from "express";
import { IUserDTO } from "../dto/IUserDTO";
import { Result } from "../core/logic/Result";
import config from "../config";

@Service()
export default class UserController extends BaseController implements IUserController {

    constructor(
        @Inject(config.services.user.name)
        private userServiceInstance: IUserService
    ) {
        super();
    }

    public async createUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userOrError = await this.userServiceInstance.createUser(req.body as IUserDTO) as Result<IUserDTO>;

            if (userOrError.isFailure) {
                return res.status(402).send();
            }

            const userDTO = userOrError.getValue();
            return res.status(201).json(userDTO);

        } catch (e) {
            return next(e);
        }
    }

    public async updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userOrError = await this.userServiceInstance.updateUser(req.body as IUserDTO) as Result<IUserDTO>;

            if (userOrError.isFailure) {
                return res.status(404).send();
            }

            const userDTO = userOrError.getValue();
            return res.status(200).json(userDTO);

        } catch (e) {
            return next(e);
        }
    }

    protected executeImpl(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}