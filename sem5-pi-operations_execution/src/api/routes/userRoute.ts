import { Router } from 'express';
import { Container } from 'typedi';
import { celebrate, Joi } from 'celebrate';
import IUserController from '../../controllers/IControllers/IUserController';
import middlewares from "../middlewares";
import config from '../../config';

const route = Router();

export default (app: Router) => {
    app.use('/users', route);

    const ctrl = Container.get(config.controllers.user.name) as IUserController;


    route.get(
        '/me',
        middlewares.injectUser,
        (req, res, next) => ctrl.getMe(req, res, next)
    );


    route.post(
        '/sync',
        celebrate({
            body: Joi.object({
                email: Joi.string().email().required(),
                role: Joi.string().required(),
                auth0UserId: Joi.string().required(),
                name: Joi.string().required(),
            }),
        }),
        (req, res, next) => ctrl.createOrSyncUser(req, res, next)
    );


    route.post('/logout', (req, res) => res.status(200).end());
};