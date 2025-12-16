import {Router} from "express";
import CreateCTController from "../../controllers/complementaryTask/createCTController";
import config from "../../config";
import {Container} from "typedi";
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
import {celebrate, Joi} from "celebrate";


const route = Router();

export default (app: Router) => {
    app.use("/complementary-tasks", route);


    const createCtrl = Container.get(
        config.controllers.complementaryTask.create.name
    ) as CreateCTController;

    const updateCtrl = Container.get(
        config.controllers.complementaryTask.update.name
    ) as UpdateCTController;

    const getAllCtrl = Container.get(
        config.controllers.complementaryTask.getAll.name
    ) as GetAllCTController;

    const getCompletedCtrl = Container.get(
        config.controllers.complementaryTask.getCompleted.name
    ) as GetCompletedCTController;

    const getByCategoryCtrl = Container.get(
        config.controllers.complementaryTask.getByCategory.name
    ) as GetCTByCategoryController;

    const getByCodeCtrl = Container.get(
        config.controllers.complementaryTask.getByCode.name
    ) as GetCTByCodeController;

    const getByStaffCtrl = Container.get(
        config.controllers.complementaryTask.getByStaff.name
    ) as GetCTByStaffController;

    const getByVveCtrl = Container.get(
        config.controllers.complementaryTask.getByVve.name
    ) as GetCTByVveController;

    const getInProgressCtrl = Container.get(
        config.controllers.complementaryTask.getInProgress.name
    ) as GetInProgressCTController;

    const getInRangeCtrl = Container.get(
        config.controllers.complementaryTask.getInRange.name
    ) as GetInRangeCTController;

    const getScheduledCtrl = Container.get(
        config.controllers.complementaryTask.getScheduled.name
    ) as GetScheduledCTController;


    route.post(
        "/",
        celebrate({
            body: Joi.object({
                code: Joi.string().optional(),
                category: Joi.string().required(),
                staff: Joi.string().required(),
                timeStart: Joi.number().required(),
                timeEnd: Joi.number().required(),
                status: Joi.string().required(),
                vve: Joi.string().required()
            })
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    route.put(
        "/:code",
        celebrate({
            body: Joi.object({
                category: Joi.string().required(),
                staff: Joi.string().required(),
                timeStart: Joi.number().required(),
                timeEnd: Joi.number().required(),
                status: Joi.string().required(),
                vve: Joi.string().required()
            })
        }),
        (req, res) => updateCtrl.execute(req, res)
    );

    route.get(
        "/",
        (req, res) => getAllCtrl.execute(req, res)
    );

    route.get(
        "/:code",
        (req, res) => getByCodeCtrl.execute(req, res)
    );

    route.get(
        "/search/completed",
        celebrate({
            query: Joi.object({
                status: Joi.string().required()
            })
        }),
        (req, res) => getCompletedCtrl.execute(req, res)
    );

    route.get(
        "/search/category",
        celebrate({
            query: Joi.object({
                category: Joi.string().required()
            })
        }),
        (req, res) => getByCategoryCtrl.execute(req, res)
    );

    route.get(
        "/search/staff",
        celebrate({
            query: Joi.object({
                staff: Joi.string().required()
            })
        }),
        (req, res) => getByStaffCtrl.execute(req, res)
    );

    route.get(
        "/search/vve",
        celebrate({
            query: Joi.object({
                vve: Joi.string().required()
            })
        }),
        (req, res) => getByVveCtrl.execute(req, res)
    );

    route.get(
        "/search/in-progress",
        celebrate({
            query: Joi.object({
                status: Joi.string().required()
            })
        }),
        (req, res) => getInProgressCtrl.execute(req, res)
    );

    route.get(
        "/search/in-range",
        celebrate({
            query: Joi.object({
                start: Joi.number().required(),
                end: Joi.number().required(),
            })
        }),
        (req, res) => getInRangeCtrl.execute(req, res)
    );

    route.get(
        "/search/scheduled",
        celebrate({
            query: Joi.object({
                status: Joi.string().required()
            })
        }),
        (req, res) => getScheduledCtrl.execute(req, res)
    );
}