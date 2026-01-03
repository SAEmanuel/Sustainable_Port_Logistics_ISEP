import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";

import config from "../../config";

import CreateCTController from "../../controllers/complementaryTask/createCTController";
import UpdateCTController from "../../controllers/complementaryTask/updateCTController";
import GetAllCTController from "../../controllers/complementaryTask/getAllCTController";
import GetCTByCodeController from "../../controllers/complementaryTask/getCTByCodeController";
import GetCompletedCTController from "../../controllers/complementaryTask/getCompletedCTController";
import GetCTByCategoryController from "../../controllers/complementaryTask/getCTByCategoryController";
import GetCTByStaffController from "../../controllers/complementaryTask/getCTByStaffController";
import GetCTByVveController from "../../controllers/complementaryTask/getCTByVveController";
import GetInProgressCTController from "../../controllers/complementaryTask/getInProgressCTController";
import GetInRangeCTController from "../../controllers/complementaryTask/getInRangeCTController";
import GetScheduledCTController from "../../controllers/complementaryTask/getScheduledCTController";
import GetCTByCategoryCodeController from "../../controllers/complementaryTask/getCTByCategoryCodeController";
import GetCTByVveCodeController from "../../controllers/complementaryTask/getCTByVveCodeController";

import { requireRole } from "../middlewares/requireRole";
import { Role } from "../../domain/user/role";

const route = Router();

export default (app: Router) => {
    app.use("/complementary-tasks", route);

    const createCtrl = Container.get(config.controllers.complementaryTask.create.name) as CreateCTController;
    const updateCtrl = Container.get(config.controllers.complementaryTask.update.name) as UpdateCTController;
    const getAllCtrl = Container.get(config.controllers.complementaryTask.getAll.name) as GetAllCTController;
    const getCompletedCtrl = Container.get(config.controllers.complementaryTask.getCompleted.name) as GetCompletedCTController;
    const getByCategoryCtrl = Container.get(config.controllers.complementaryTask.getByCategory.name) as GetCTByCategoryController;
    const getByCategoryCodeCtrl = Container.get(config.controllers.complementaryTask.getByCategoryCode.name) as GetCTByCategoryCodeController;
    const getByCodeCtrl = Container.get(config.controllers.complementaryTask.getByCode.name) as GetCTByCodeController;
    const getByStaffCtrl = Container.get(config.controllers.complementaryTask.getByStaff.name) as GetCTByStaffController;
    const getByVveCtrl = Container.get(config.controllers.complementaryTask.getByVve.name) as GetCTByVveController;
    const getByVveCodeCtrl = Container.get(config.controllers.complementaryTask.getByVveCode.name) as GetCTByVveCodeController;
    const getInProgressCtrl = Container.get(config.controllers.complementaryTask.getInProgress.name) as GetInProgressCTController;
    const getInRangeCtrl = Container.get(config.controllers.complementaryTask.getInRange.name) as GetInRangeCTController;
    const getScheduledCtrl = Container.get(config.controllers.complementaryTask.getScheduled.name) as GetScheduledCTController;



    route.post(
        "/",
        requireRole(Role.LogisticsOperator),
        celebrate({
            body: Joi.object({
                category: Joi.string().required(),
                staff: Joi.string().required(),
                timeStart: Joi.date().iso().required(),
                vve: Joi.string().required()
            })
        }),
        (req, res) => createCtrl.execute(req, res)
    );



    route.put(
        "/:code",
        requireRole(Role.LogisticsOperator),
        celebrate({
            body: Joi.object({
                category: Joi.string().required(),
                staff: Joi.string().required(),
                timeStart: Joi.date().iso().required(),
                status: Joi.string().valid("Scheduled", "InProgress", "Completed").required(),
                vve: Joi.string().required()
            })
        }),
        (req, res) => updateCtrl.execute(req, res)
    );



    route.get(
        "/search/completed",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getCompletedCtrl.execute(req, res)
    );

    route.get(
        "/search/in-progress",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getInProgressCtrl.execute(req, res)
    );

    route.get(
        "/search/scheduled",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getScheduledCtrl.execute(req, res)
    );

    route.get(
        "/search/category",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ category: Joi.string().required() }) }),
        (req, res) => getByCategoryCtrl.execute(req, res)
    );

    route.get(
        "/search/categoryCode",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ category: Joi.string().required() }) }),
        (req, res) => getByCategoryCodeCtrl.execute(req, res)
    );

    route.get(
        "/search/staff",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ staff: Joi.string().required() }) }),
        (req, res) => getByStaffCtrl.execute(req, res)
    );

    route.get(
        "/search/vve",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ vve: Joi.string().required() }) }),
        (req, res) => getByVveCtrl.execute(req, res)
    );

    route.get(
        "/search/vveCode",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ vve: Joi.string().required() }) }),
        (req, res) => getByVveCodeCtrl.execute(req, res)
    );

    route.get(
        "/search/in-range",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({
            query: Joi.object({
                timeStart: Joi.number().required(),
                timeEnd: Joi.number().required(),
            })
        }),
        (req, res) => getInRangeCtrl.execute(req, res)
    );


    route.get(
        "/",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getAllCtrl.execute(req, res)
    );

    route.get(
        "/search/code/:code",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getByCodeCtrl.execute(req, res)
    );
};