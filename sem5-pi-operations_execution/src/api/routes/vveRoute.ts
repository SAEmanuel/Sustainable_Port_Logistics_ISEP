import {Router} from "express";
import {Container} from "typedi";
import {celebrate, Joi} from "celebrate";
import config from "../../config";
import CreateVVEController from "../../controllers/vve/createVVEController";
import GetAllVVEController from "../../controllers/vve/getAllVVEController";
import GetVVEByIdController from "../../controllers/vve/getVVEByIdController";
import GetVVEByCodeController from "../../controllers/vve/getVVEByCodeController";
import GetVVEByImoController from "../../controllers/vve/getVVEByImoController";
import GetVVEInRangeController from "../../controllers/vve/getVVEInRangeController";
import UpdateVVEActualBerthAndDockController from "../../controllers/vve/updateVVEActualBerthAndDockController";

const route = Router();

export default (app: Router) => {
    app.use("/vve", route);

    const createCtrl = Container.get(config.controllers.vesselVisitExecution.create.name) as CreateVVEController;
    const getAllCtrl = Container.get(config.controllers.vesselVisitExecution.getAll.name) as GetAllVVEController;
    const getByIdCtrl = Container.get(config.controllers.vesselVisitExecution.getById.name) as GetVVEByIdController;
    const getByCodeCtrl = Container.get(config.controllers.vesselVisitExecution.getByCode.name) as GetVVEByCodeController;
    const getByImoCtrl = Container.get(config.controllers.vesselVisitExecution.getByImo.name) as GetVVEByImoController;
    const getInRangeCtrl = Container.get(config.controllers.vesselVisitExecution.getInRange.name) as GetVVEInRangeController;
    const updateBerthDockCtrl =
        Container.get(config.controllers.vesselVisitExecution.updateBerthDock.name) as UpdateVVEActualBerthAndDockController;

    route.post(
        "/",
        celebrate({
            body: Joi.object({
                vvnId: Joi.string().required(),
                actualArrivalTime: Joi.date().iso().required(),
                creatorEmail: Joi.string().email().optional()
            })
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    route.get("/", (req, res) => getAllCtrl.execute(req, res));

    route.get(
        "/range",
        celebrate({
            query: Joi.object({
                timeStart: Joi.number().required(),
                timeEnd: Joi.number().required(),
            })
        }),
        (req, res) => getInRangeCtrl.execute(req, res)
    );

    route.get("/code/:code", (req, res) => getByCodeCtrl.execute(req, res));
    route.get("/imo/:imo", (req, res) => getByImoCtrl.execute(req, res));

    route.put(
        "/:id/berth",
        celebrate({
            body: Joi.object({
                actualBerthTime: Joi.date().iso().required(),
                actualDockId: Joi.string().required(),
                updaterEmail: Joi.string().email().required()
            })
        }),
        (req, res, next) => updateBerthDockCtrl.execute(req, res, next)
    );

    route.get("/:id", (req, res) => getByIdCtrl.execute(req, res));
};
