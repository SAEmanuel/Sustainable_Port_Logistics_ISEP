import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";
import config from "../../config";
import middlewares from "../middlewares";
import CreateVVEController from "../../controllers/vve/createVVEController";
import GetAllVVEController from "../../controllers/vve/getAllVVEController";
import GetVVEByIdController from "../../controllers/vve/getVVEByIdController";

const route = Router();

export default (app: Router) => {
    app.use("/vve", route);

    const createCtrl = Container.get(config.controllers.vesselVisitExecution.create.name) as CreateVVEController;
    const getAllCtrl = Container.get(config.controllers.vesselVisitExecution.getAll.name) as GetAllVVEController;
    const getByIdCtrl = Container.get(config.controllers.vesselVisitExecution.getAll.name) as GetVVEByIdController;
    
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
    route.get("/:id", (req, res) => getByIdCtrl.execute(req, res));
};