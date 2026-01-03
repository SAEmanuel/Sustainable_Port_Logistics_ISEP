import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";
import config from "../../config";

import CreateDockReassignmentLogController
    from "../../controllers/dockReassignmentLog/createDockReassignmentLogController";

import GetAllDockReassignmentLog
    from "../../controllers/dockReassignmentLog/getAllDockReassignmentLog";

import { Role } from "../../domain/user/role";
import { requireRole } from "../middlewares/requireRole";

const route = Router();

export default (app: Router) => {
    app.use("/dock-reassignment-log", route);

    const createCtrl = Container.get(
        config.controllers.dockReassignmentLog.create.name
    ) as CreateDockReassignmentLogController;

    const getAllCtrl = Container.get(
        config.controllers.dockReassignmentLog.getAll.name
    ) as GetAllDockReassignmentLog;


    route.post(
        "/",
        requireRole(Role.PortAuthorityOfficer),

        celebrate({
            body: Joi.object({
                vvnId: Joi.string().required(),
                vesselName: Joi.string().required(),
                originalDock: Joi.string().required(),
                updatedDock: Joi.string().required(),
                officerId: Joi.string().required(),
                timestamp: Joi.string().required()
            })
        }),

        (req, res) => createCtrl.execute(req, res)
    );


    route.get(
        "/",
        requireRole(Role.PortAuthorityOfficer),
        (req, res) => getAllCtrl.execute(req, res)
    );
};