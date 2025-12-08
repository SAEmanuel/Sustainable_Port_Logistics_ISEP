import { Request, Response, NextFunction } from 'express';

export default interface IUserController  {
    createUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}