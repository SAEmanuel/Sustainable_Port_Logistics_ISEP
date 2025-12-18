import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";
import config from "../../config";

import AddVVEToIncidentController from "../../controllers/incident/addVVEToIncidentController";
import CreateIncidentController from "../../controllers/incident/createIncidentController";
import DeleteIncidentController from "../../controllers/incident/deleteIncidentController";
import GetActiveIncidentsController from "../../controllers/incident/getActiveIncidentsController";
import GetAllIncidentsController from "../../controllers/incident/getAllIncidentsController";
import GetIncidentByCodeController from "../../controllers/incident/getIncidentByCodeController";
import GetIncidentsByDataRangeController from "../../controllers/incident/getIncidentsByDataRangeController";
import GetIncidentsBySeverityController from "../../controllers/incident/getIncidentsBySeverityController";
import GetIncidentsByVVEController from "../../controllers/incident/getIncidentsByVVEController";
import GetResolvedIncidentsController from "../../controllers/incident/getResolvedIncidentsController";
import MarkIncidentResolvedController from "../../controllers/incident/markIncidentResolvedController";
import RemoveVVEFromIncidentController from "../../controllers/incident/removeVVEFromIncidentController";
import UpdateIncidentController from "../../controllers/incident/updateIncidentController";

const route = Router();

export default (app: Router) => {
    app.use("/incidents", route);

    // --------------------------------------
    // Controller Injection
    // --------------------------------------
    const createCtrl = Container.get(config.controllers.incident.create.name) as CreateIncidentController;
    const updateCtrl = Container.get(config.controllers.incident.update.name) as UpdateIncidentController;
    const deleteCtrl = Container.get(config.controllers.incident.delete.name) as DeleteIncidentController;

    const getAllCtrl = Container.get(config.controllers.incident.getAll.name) as GetAllIncidentsController;
    const getByCodeCtrl = Container.get(config.controllers.incident.getByCode.name) as GetIncidentByCodeController;

    const getActiveCtrl = Container.get(config.controllers.incident.getActive.name) as GetActiveIncidentsController;
    const getResolvedCtrl = Container.get(config.controllers.incident.getResolved.name) as GetResolvedIncidentsController;

    const getByDateRangeCtrl = Container.get(config.controllers.incident.getByDateRange.name) as GetIncidentsByDataRangeController;
    const getBySeverityCtrl = Container.get(config.controllers.incident.getBySeverity.name) as GetIncidentsBySeverityController;
    const getByVVECtrl = Container.get(config.controllers.incident.getByVVE.name) as GetIncidentsByVVEController;

    const addVVECtrl = Container.get(config.controllers.incident.addVVE.name) as AddVVEToIncidentController;
    const removeVVECtrl = Container.get(config.controllers.incident.removeVVE.name) as RemoveVVEFromIncidentController;
    const markResolvedCtrl = Container.get(config.controllers.incident.markResolved.name) as MarkIncidentResolvedController;

    // --------------------------------------
    // Routes Definitions
    // IMPORTANT: Static routes before /:code
    // --------------------------------------

    // GET /incidents/active
    route.get("/active", (req, res) => getActiveCtrl.execute(req, res));

    // GET /incidents/resolved
    route.get("/resolved", (req, res) => getResolvedCtrl.execute(req, res));

    // GET /incidents/search/date?start=...&end=...
    route.get(
        "/search/date",
        celebrate({
            query: Joi.object({
                start: Joi.date().required(),
                end: Joi.date().required(),
            }),
        }),
        (req, res) => getByDateRangeCtrl.execute(req, res)
    );

    // GET /incidents/search/severity?severity=...
    route.get(
        "/search/severity",
        celebrate({
            query: Joi.object({
                severity: Joi.string().valid("Minor", "Major", "Critical").required(),
            }),
        }),
        (req, res) => getBySeverityCtrl.execute(req, res)
    );

    // GET /incidents/vve/:vveCode
    route.get(
        "/vve/:vveCode",
        celebrate({
            params: Joi.object({
                vveCode: Joi.string().required(),
            }),
        }),
        (req, res) => getByVVECtrl.execute(req, res)
    );

    // GET /incidents (Get All)
    route.get("/", (req, res) => getAllCtrl.execute(req, res));

    // GET /incidents/:code
    route.get(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => getByCodeCtrl.execute(req, res)
    );

    // POST /incidents (Create)
    route.post(
        "/",
        celebrate({
            body: Joi.object({
                code: Joi.string().required(),
                incidentTypeCode: Joi.string().required(),
                vveList: Joi.array().items(Joi.string()).required(),
                startTime: Joi.date().iso().required(),
                endTime: Joi.date().iso().allow(null).optional(),
                severity: Joi.string().valid("Minor", "Major", "Critical").required(),
                impactMode: Joi.string().valid("Specific", "Upcoming", "Global").required(), // Adjust enums as needed
                description: Joi.string().required(),
                createdByUser: Joi.string().required(),
                upcomingWindowStartTime: Joi.date().iso().allow(null).optional(),
                upcomingWindowEndTime: Joi.date().iso().allow(null).optional(),
            }),
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    // PUT /incidents/:code (Update)
    route.put(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
            body: Joi.object({
                incidentTypeCode: Joi.string().required(),
                vveList: Joi.array().items(Joi.string()).required(),
                startTime: Joi.date().iso().required(),
                endTime: Joi.date().iso().allow(null).optional(),
                severity: Joi.string().valid("Minor", "Major", "Critical").required(),
                impactMode: Joi.string().valid("Specific", "Upcoming", "Global").required(),
                description: Joi.string().required(),
                upcomingWindowStartTime: Joi.date().iso().allow(null).optional(),
                upcomingWindowEndTime: Joi.date().iso().allow(null).optional(),
            }),
        }),
        (req, res) => updateCtrl.execute(req, res)
    );

    // PATCH /incidents/:code/resolve (Mark as Resolved)
    route.patch(
        "/:code/resolve",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => markResolvedCtrl.execute(req, res)
    );

    // POST /incidents/:code/vve/:vveCode (Add VVE)
    route.post(
        "/:code/vve/:vveCode",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
                vveCode: Joi.string().required(),
            }),
        }),
        (req, res) => addVVECtrl.execute(req, res)
    );

    // DELETE /incidents/:code/vve/:vveCode (Remove VVE)
    route.delete(
        "/:code/vve/:vveCode",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
                vveCode: Joi.string().required(),
            }),
        }),
        (req, res) => removeVVECtrl.execute(req, res)
    );

    // DELETE /incidents/:code (Delete Incident)
    route.delete(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => deleteCtrl.execute(req, res)
    );
};