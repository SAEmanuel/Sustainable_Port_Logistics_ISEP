import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";

import CreateOperationPlanController from "../../controllers/operationPlan/createOperationPlanController";
import GetOperationPlansController from "../../controllers/operationPlan/getOperationPlansController";
import OperationPlanUpdateController from "../../controllers/operationPlan/operationPlanUpdateController";

import middlewares from "../middlewares";

const route = Router();

export default (app: Router) => {
    app.use("/operation-plans", route);

    const ctrl = Container.get("CreateOperationPlanController") as CreateOperationPlanController;
    const listCtrl = Container.get("GetOperationPlansController") as GetOperationPlansController;
    const updateCtrl = Container.get("OperationPlanUpdateController") as OperationPlanUpdateController;

    // CREATE
    route.post(
        "/",
        // middlewares.attachCurrentUser,
        celebrate({
            body: Joi.object({
                algorithm: Joi.string().required(),
                total_delay: Joi.number().optional(), // compat
                totalDelay: Joi.number().optional(),  // compat
                status: Joi.string().required(),
                planDate: Joi.date().required(),
                best_sequence: Joi.array().optional(), // compat
                operations: Joi.array().optional(),
                author: Joi.string().optional(),
            }).unknown(true),
        }),
        (req, res) => ctrl.execute(req, res)
    );

    // LIST / SEARCH
    route.get(
        "/",
        // middlewares.attachCurrentUser,
        celebrate({
            query: Joi.object({
                startDate: Joi.date().optional(),
                endDate: Joi.date().optional(),
                vessel: Joi.string().optional(),
            }),
        }),
        (req, res) => listCtrl.execute(req, res)
    );

    route.patch(
        "/vvn",
        middlewares.attachCurrentUser, // para preencher req.user (author)
        celebrate({
            body: Joi.object({
                planDomainId: Joi.string().required(),
                vvnId: Joi.string().required(),
                reasonForChange: Joi.string().min(3).required(),
                status: Joi.string().optional(),
                operations: Joi.array().required(), // lista de IOperationDTO (podes reforçar o schema se quiseres)
            }).unknown(true),
        }),
        (req, res, next) => updateCtrl.updateForVvn(req, res, next)
    );
};
