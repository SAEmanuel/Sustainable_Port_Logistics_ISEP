import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";

import CreateOperationPlanController from "../../controllers/operationPlan/createOperationPlanController";
import GetOperationPlansController from "../../controllers/operationPlan/getOperationPlansController";
import OperationPlanUpdateController from "../../controllers/operationPlan/operationPlanUpdateController";
import GetOperationPlansByPhysicalResourceController from "../../controllers/operationPlan/getOperationPlansByPhysicalResourceController";

const route = Router();

export default (app: Router) => {
    app.use("/operation-plans", route);

    const ctrl = Container.get(CreateOperationPlanController);
    const listCtrl = Container.get(GetOperationPlansController);
    const updateCtrl = Container.get(OperationPlanUpdateController);
    const byResourceCtrl = Container.get(GetOperationPlansByPhysicalResourceController) ;

    // CREATE
    route.post(
        "/",
        celebrate({
            body: Joi.object({
                algorithm: Joi.string().required(),
                total_delay: Joi.number().optional(),
                totalDelay: Joi.number().optional(),
                status: Joi.string().required(),
                planDate: Joi.date().required(),
                best_sequence: Joi.array().optional(),
                operations: Joi.array().optional(),
                author: Joi.string().optional(),
            }).unknown(true),
        }),
        (req, res) => ctrl.execute(req, res)
    );

    // LIST
    route.get(
        "/",
        celebrate({
            query: Joi.object({
                startDate: Joi.date().optional(),
                endDate: Joi.date().optional(),
                vessel: Joi.string().optional(),
            }),
        }),
        (req, res) => listCtrl.execute(req, res)
    );

    // UPDATE single VVN
    route.patch(
        "/vvn",
        celebrate({
            body: Joi.object({
                planDomainId: Joi.string().required(),
                vvnId: Joi.string().required(),
                reasonForChange: Joi.string().min(3).required(),
                author: Joi.string().min(3).required(),
                operations: Joi.array().min(1).required(),
            }).unknown(true),
        }),
        (req, res, next) => updateCtrl.updateForVvn(req, res, next)
    );

    // batch (várias VVNs no mesmo request)
    route.patch(
        "/batch",
        celebrate({
            body: Joi.object({
                planDomainId: Joi.string().required(),
                reasonForChange: Joi.string().min(3).required(),
                author: Joi.string().min(3).required(),
                updates: Joi.array()
                    .items(
                        Joi.object({
                            vvnId: Joi.string().required(),
                            operations: Joi.array().min(1).required(),
                        }).required()
                    )
                    .min(1)
                    .required(),
            }).unknown(true),
        }),
        (req, res, next) => updateCtrl.updateBatch(req, res, next)
    );

    route.get(
        '/by-resource',
        celebrate({
            query: Joi.object({
                crane: Joi.string().required(),
                startDate: Joi.date().required(),
                endDate: Joi.date().required()
            })
        }),
        (req, res) => byResourceCtrl.execute(req, res)
    );
};
