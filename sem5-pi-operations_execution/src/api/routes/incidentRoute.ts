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
import UpdateListsVVEsController from "../../controllers/incident/updateListsVVEsController";

const route = Router();

/**
 * @openapi
 * tags:
 *   - name: Incidents
 *     description: Incident management (CRUD + queries + VVE links)
 *
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Invalid input
 *
 *     Incident:
 *       type: object
 *       description: Incident DTO
 *       properties:
 *         code:
 *           type: string
 *           description: Unique incident code
 *           pattern: "^INC-\\d{4}-\\d{5}$"
 *           example: INC-2026-00001
 *         incidentTypeCode:
 *           type: string
 *           description: Incident Type code (T-INC###)
 *           pattern: "^T-INC\\d{3}$"
 *           example: T-INC001
 *         vveList:
 *           type: array
 *           items:
 *             type: string
 *           example: ["VVE-001", "VVE-002"]
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: "2026-01-03T10:00:00.000Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         duration:
 *           type: integer
 *           nullable: true
 *           description: Derived duration in minutes when endTime exists
 *           example: 120
 *         severity:
 *           type: string
 *           enum: [Minor, Major, Critical]
 *           example: Major
 *         impactMode:
 *           type: string
 *           enum: [Specific, Upcoming, AllOnGoing]
 *           example: Specific
 *         description:
 *           type: string
 *           example: "Oil spill detected near berth 3."
 *         createdByUser:
 *           type: string
 *           example: "user@company.com"
 *         upcomingWindowStartTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Only relevant when impactMode is Upcoming
 *           example: null
 *         upcomingWindowEndTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Only relevant when impactMode is Upcoming
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-03T15:06:37.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-01-03T15:10:00.000Z"
 *
 *     IncidentCreateRequest:
 *       type: object
 *       required:
 *         - code
 *         - incidentTypeCode
 *         - vveList
 *         - startTime
 *         - severity
 *         - impactMode
 *         - description
 *         - createdByUser
 *       properties:
 *         code:
 *           type: string
 *           pattern: "^INC-\\d{4}-\\d{5}$"
 *           example: INC-2026-00001
 *         incidentTypeCode:
 *           type: string
 *           pattern: "^T-INC\\d{3}$"
 *           example: T-INC001
 *         vveList:
 *           type: array
 *           items:
 *             type: string
 *           example: ["VVE-001", "VVE-002"]
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: "2026-01-03T10:00:00.000Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         severity:
 *           type: string
 *           enum: [Minor, Major, Critical]
 *           example: Major
 *         impactMode:
 *           type: string
 *           enum: [Specific, Upcoming, AllOnGoing]
 *           example: Specific
 *         description:
 *           type: string
 *           example: "Oil spill detected near berth 3."
 *         createdByUser:
 *           type: string
 *           example: "user@company.com"
 *         upcomingWindowStartTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         upcomingWindowEndTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *
 *     IncidentUpdateRequest:
 *       type: object
 *       required:
 *         - incidentTypeCode
 *         - vveList
 *         - startTime
 *         - severity
 *         - impactMode
 *         - description
 *       properties:
 *         incidentTypeCode:
 *           type: string
 *           pattern: "^T-INC\\d{3}$"
 *           example: T-INC001
 *         vveList:
 *           type: array
 *           items:
 *             type: string
 *           example: ["VVE-001"]
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: "2026-01-03T10:00:00.000Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         severity:
 *           type: string
 *           enum: [Minor, Major, Critical]
 *           example: Critical
 *         impactMode:
 *           type: string
 *           enum: [Specific, Upcoming, AllOnGoing]
 *           example: Upcoming
 *         description:
 *           type: string
 *           example: "Updated description."
 *         upcomingWindowStartTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-01-03T12:00:00.000Z"
 *         upcomingWindowEndTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-01-03T18:00:00.000Z"
 */

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

    const getByDateRangeCtrl = Container.get(
        config.controllers.incident.getByDateRange.name
    ) as GetIncidentsByDataRangeController;

    const getBySeverityCtrl = Container.get(
        config.controllers.incident.getBySeverity.name
    ) as GetIncidentsBySeverityController;

    const getByVVECtrl = Container.get(config.controllers.incident.getByVVE.name) as GetIncidentsByVVEController;

    const addVVECtrl = Container.get(config.controllers.incident.addVVE.name) as AddVVEToIncidentController;
    const removeVVECtrl = Container.get(config.controllers.incident.removeVVE.name) as RemoveVVEFromIncidentController;
    const markResolvedCtrl = Container.get(
        config.controllers.incident.markResolved.name
    ) as MarkIncidentResolvedController;

    const updateList = Container.get(config.controllers.incident.updateVEEList.name) as UpdateListsVVEsController;

    /**
     * IMPORTANT: Static routes before /:code
     */

    // ----------------------------
    // GET /incidents/active
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/active:
     *   get:
     *     tags: [Incidents]
     *     summary: Get active incidents
     *     description: Returns incidents that are currently active (typically endTime is null).
     *     responses:
     *       200:
     *         description: List of active incidents
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/Incident"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/active", (req, res) => getActiveCtrl.execute(req, res));

    // ----------------------------
    // GET /incidents/resolved
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/resolved:
     *   get:
     *     tags: [Incidents]
     *     summary: Get resolved incidents
     *     description: Returns incidents that are resolved (typically endTime is not null).
     *     responses:
     *       200:
     *         description: List of resolved incidents
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/Incident"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/resolved", (req, res) => getResolvedCtrl.execute(req, res));

    // ----------------------------
    // GET /incidents/search/date?start=...&end=...
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/search/date:
     *   get:
     *     tags: [Incidents]
     *     summary: Get incidents in a date range
     *     parameters:
     *       - in: query
     *         name: start
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Start date-time (ISO 8601)
     *         example: "2025-12-20T10:00:00Z"
     *       - in: query
     *         name: end
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *         description: End date-time (ISO 8601)
     *         example: "2025-12-21T10:00:00Z"
     *     responses:
     *       200:
     *         description: List of incidents in range
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
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

    // ----------------------------
    // GET /incidents/search/severity?severity=...
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/search/severity:
     *   get:
     *     tags: [Incidents]
     *     summary: Get incidents by severity
     *     parameters:
     *       - in: query
     *         name: severity
     *         required: true
     *         schema:
     *           type: string
     *           enum: [Minor, Major, Critical]
     *         example: Critical
     *     responses:
     *       200:
     *         description: List of incidents with given severity
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get(
        "/search/severity",
        celebrate({
            query: Joi.object({
                severity: Joi.string().valid("Minor", "Major", "Critical").required(),
            }),
        }),
        (req, res) => getBySeverityCtrl.execute(req, res)
    );

    // ----------------------------
    // GET /incidents/vve/:vveCode
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/vve/{vveCode}:
     *   get:
     *     tags: [Incidents]
     *     summary: Get incidents by VVE code
     *     parameters:
     *       - in: path
     *         name: vveCode
     *         required: true
     *         schema:
     *           type: string
     *         example: VVE-001
     *     responses:
     *       200:
     *         description: List of incidents associated with the VVE
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get(
        "/vve/:vveCode",
        celebrate({
            params: Joi.object({
                vveCode: Joi.string().required(),
            }),
        }),
        (req, res) => getByVVECtrl.execute(req, res)
    );

    // ----------------------------
    // GET /incidents
    // ----------------------------
    /**
     * @openapi
     * /api/incidents:
     *   get:
     *     tags: [Incidents]
     *     summary: Get all incidents
     *     responses:
     *       200:
     *         description: List of incidents
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/Incident"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *
     *   post:
     *     tags: [Incidents]
     *     summary: Create a new incident
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/IncidentCreateRequest"
     *     responses:
     *       200:
     *         description: Created incident
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       409:
     *         description: Conflict (e.g., duplicated code) if enforced
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/", (req, res) => getAllCtrl.execute(req, res));

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
                impactMode: Joi.string().valid("Specific", "Upcoming", "AllOnGoing").required(),
                description: Joi.string().required(),
                createdByUser: Joi.string().required(),
                upcomingWindowStartTime: Joi.date().iso().allow(null).optional(),
                upcomingWindowEndTime: Joi.date().iso().allow(null).optional(),
            }),
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    // ----------------------------
    // GET/PUT/DELETE /incidents/:code
    // + PATCH /incidents/:code/resolve
    // + PATCH /incidents/:code/updateList
    // + POST/DELETE /incidents/:code/vve/:vveCode
    // ----------------------------

    /**
     * @openapi
     * /api/incidents/{code}:
     *   get:
     *     tags: [Incidents]
     *     summary: Get an incident by code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *     responses:
     *       200:
     *         description: Incident
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *
     *   put:
     *     tags: [Incidents]
     *     summary: Update an incident by code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/IncidentUpdateRequest"
     *     responses:
     *       200:
     *         description: Updated incident
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *
     *   delete:
     *     tags: [Incidents]
     *     summary: Delete an incident by code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *     responses:
     *       204:
     *         description: Deleted successfully (no content)
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => getByCodeCtrl.execute(req, res)
    );

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
                impactMode: Joi.string().valid("Specific", "Upcoming", "AllOnGoing").required(),
                description: Joi.string().required(),
                upcomingWindowStartTime: Joi.date().iso().allow(null).optional(),
                upcomingWindowEndTime: Joi.date().iso().allow(null).optional(),
            }),
        }),
        (req, res) => updateCtrl.execute(req, res)
    );

    route.delete(
        "/:code",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => deleteCtrl.execute(req, res)
    );

    // ----------------------------
    // PATCH /incidents/:code/resolve
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/{code}/resolve:
     *   patch:
     *     tags: [Incidents]
     *     summary: Mark an incident as resolved
     *     description: Marks the incident as resolved (typically sets endTime to now and derives duration).
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *     responses:
     *       200:
     *         description: Updated incident (resolved)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.patch(
        "/:code/resolve",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => markResolvedCtrl.execute(req, res)
    );

    // ----------------------------
    // PATCH /incidents/:code/updateList
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/{code}/updateList:
     *   patch:
     *     tags: [Incidents]
     *     summary: Update incident VVE list automatically
     *     description: Updates the incident's VVE list according to server-side rules.
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *     responses:
     *       200:
     *         description: Updated incident
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.patch(
        "/:code/updateList",
        celebrate({
            params: Joi.object({
                code: Joi.string().required(),
            }),
        }),
        (req, res) => updateList.execute(req, res)
    );

    // ----------------------------
    // POST /incidents/:code/vve/:vveCode (Add VVE)
    // ----------------------------
    /**
     * @openapi
     * /api/incidents/{code}/vve/{vveCode}:
     *   post:
     *     tags: [Incidents]
     *     summary: Add a VVE to an incident
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *       - in: path
     *         name: vveCode
     *         required: true
     *         schema:
     *           type: string
     *         example: VVE-001
     *     responses:
     *       200:
     *         description: Updated incident (after adding VVE)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident or VVE not found (if enforced)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *
     *   delete:
     *     tags: [Incidents]
     *     summary: Remove a VVE from an incident
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^INC-\\d{4}-\\d{5}$"
     *         example: INC-2026-00001
     *       - in: path
     *         name: vveCode
     *         required: true
     *         schema:
     *           type: string
     *         example: VVE-001
     *     responses:
     *       200:
     *         description: Updated incident (after removing VVE)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/Incident"
     *       400:
     *         description: Validation/business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident or VVE not found (if enforced)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
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
};
