import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";
import config from "../../config";

import CreatedITController from "../../controllers/incidentType/createdITController";
import UpdateITController from "../../controllers/incidentType/updateITController";
import GetITByCodeController from "../../controllers/incidentType/getITByCodeController";
import GetITByNameController from "../../controllers/incidentType/getITByNameController";
import GetITRootController from "../../controllers/incidentType/getITRootController";
import GetITDirectChildController from "../../controllers/incidentType/getITDirectChildController";
import GetITSubTreeController from "../../controllers/incidentType/getITSubTreeController";
import RemoveIncidentTypeController from "../../controllers/incidentType/removeIncidentTypeController"
import GetAllITController from "../../controllers/incidentType/getAllITController"

const route = Router();

export default (app: Router) => {
    app.use("/incidentTypes", route);

    const createCtrl = Container.get(
        config.controllers.incidentType.create.name
    ) as CreatedITController;

    const removeCtrl = Container.get(
        config.controllers.incidentType.remove.name
    ) as RemoveIncidentTypeController;

    const getAllCtrl = Container.get(
        config.controllers.incidentType.getAll.name
    ) as GetAllITController;

    const updateCtrl = Container.get(
        config.controllers.incidentType.update.name
    ) as UpdateITController;

    const getByCodeCtrl = Container.get(
        config.controllers.incidentType.getByCode.name
    ) as GetITByCodeController;

    const getByNameCtrl = Container.get(
        config.controllers.incidentType.getByName.name
    ) as GetITByNameController;

    const getRootCtrl = Container.get(
        config.controllers.incidentType.getRoot.name
    ) as GetITRootController;

    const getDirectChildCtrl = Container.get(
        config.controllers.incidentType.getDirectChilds.name
    ) as GetITDirectChildController;

    const getSubTreeCtrl = Container.get(
        config.controllers.incidentType.getSubTree.name
    ) as GetITSubTreeController;

    /**
     * IMPORTANT: order matters!
     * - Static routes (/roots, /search/...) must come before /:code
     */

    // ----------------------------
    // READ: Roots
    // GET /incidentTypes/roots
    // ----------------------------
    route.get("/roots", (req, res) => getRootCtrl.execute(req, res));

    // ----------------------------
    // READ: Search by name
    // GET /incidentTypes/search/name?name=...
    // ----------------------------
    route.get(
        "/search/name",
        celebrate({
            query: Joi.object({
                name: Joi.string().required(),
            }),
        }),
        (req, res) => getByNameCtrl.execute(req, res)
    );

    // ----------------------------
    // READ: Search by name
    // GET /incidentTypes/search/all
    // ----------------------------
    route.get("/search/all", (req, res) => getAllCtrl.execute(req, res));

    // ----------------------------
    // READ: Direct children
    // GET /incidentTypes/:code/children
    // ----------------------------
    route.get(
        "/:code/children",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => getDirectChildCtrl.execute(req, res)
    );

    // ----------------------------
    // READ: Subtree (all descendants)
    // GET /incidentTypes/:code/subtree
    // ----------------------------
    route.get(
        "/:code/subtree",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => getSubTreeCtrl.execute(req, res)
    );

    // ----------------------------
    // READ: By code
    // GET /incidentTypes/:code
    // ----------------------------
    route.get(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => getByCodeCtrl.execute(req, res)
    );

    // ----------------------------
    // CREATE
    // POST /incidentTypes
    // ----------------------------
    route.post(
        "/",
        celebrate({
            body: Joi.object({
                code: Joi.string().required(), // e.g., T-INC001 (domain validates format)
                name: Joi.string().required(),
                description: Joi.string().required(),
                severity: Joi.string().valid("Minor", "Major", "Critical").required(),
                parentCode: Joi.string().allow(null).optional(),
            }),
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    // ----------------------------
    // UPDATE
    // PUT /incidentTypes/:code
    // ----------------------------
    route.put(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
            body: Joi.object({
                name: Joi.string().required(),
                description: Joi.string().required(),
                severity: Joi.string().valid("Minor", "Major", "Critical").required(),
                parentCode: Joi.string().allow(null).optional(),
            }),
        }),
        (req, res) => updateCtrl.execute(req, res)
    );

    // DELETE /incidentTypes/:code (Delete Incident)
    route.delete(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().pattern(/^T-INC\d{3}$/).required(),
            }),
        }),
        (req, res) => removeCtrl.execute(req, res)
    );

};
