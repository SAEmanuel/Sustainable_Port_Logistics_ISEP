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
import RemoveIncidentTypeController from "../../controllers/incidentType/removeIncidentTypeController";
import GetAllITController from "../../controllers/incidentType/getAllITController";

const route = Router();

/**
 * @openapi
 * tags:
 *   - name: IncidentTypes
 *     description: Incident Type management (CRUD + hierarchy queries)
 *
 * components:
 *   schemas:
 *     IncidentType:
 *       type: object
 *       description: Incident Type DTO
 *       properties:
 *         code:
 *           type: string
 *           description: Unique code in the format T-INC###
 *           example: T-INC001
 *           pattern: "^T-INC\\d{3}$"
 *         name:
 *           type: string
 *           example: Oil Spill
 *         description:
 *           type: string
 *           example: Incidents related to oil spills in port waters
 *         severity:
 *           type: string
 *           enum: [Minor, Major, Critical]
 *           example: Major
 *         parentCode:
 *           type: string
 *           nullable: true
 *           description: Parent incident type code (null if root)
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
 *     IncidentTypeCreateRequest:
 *       type: object
 *       required: [code, name, description, severity]
 *       properties:
 *         code:
 *           type: string
 *           pattern: "^T-INC\\d{3}$"
 *           example: T-INC001
 *         name:
 *           type: string
 *           example: Oil Spill
 *         description:
 *           type: string
 *           example: Incidents related to oil spills in port waters
 *         severity:
 *           type: string
 *           enum: [Minor, Major, Critical]
 *           example: Major
 *         parentCode:
 *           type: string
 *           nullable: true
 *           example: null
 *
 *     IncidentTypeUpdateRequest:
 *       type: object
 *       required: [name, description, severity]
 *       properties:
 *         name:
 *           type: string
 *           example: Oil Spill (Updated)
 *         description:
 *           type: string
 *           example: Updated description
 *         severity:
 *           type: string
 *           enum: [Minor, Major, Critical]
 *           example: Critical
 *         parentCode:
 *           type: string
 *           nullable: true
 *           example: T-INC010
 *
 *     IncidentTypeTreeNode:
 *       allOf:
 *         - $ref: "#/components/schemas/IncidentType"
 *         - type: object
 *           properties:
 *             children:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/IncidentTypeTreeNode"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Invalid input
 */

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

    /**
     * @openapi
     * /api/incidentTypes/roots:
     *   get:
     *     tags: [IncidentTypes]
     *     summary: Get root incident types
     *     description: Returns incident types that have no parent (root nodes).
     *     responses:
     *       200:
     *         description: List of root incident types
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/IncidentType"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/roots", (req, res) => getRootCtrl.execute(req, res));

    // ----------------------------
    // READ: Search by name
    // GET /incidentTypes/search/name?name=...
    // ----------------------------

    /**
     * @openapi
     * /api/incidentTypes/search/name:
     *   get:
     *     tags: [IncidentTypes]
     *     summary: Search incident types by name
     *     parameters:
     *       - in: query
     *         name: name
     *         required: true
     *         schema:
     *           type: string
     *         description: Name (or partial name) to search for
     *         example: Oil
     *     responses:
     *       200:
     *         description: List of matching incident types
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/IncidentType"
     *       400:
     *         description: Validation or business rule error
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
        "/search/name",
        celebrate({
            query: Joi.object({
                name: Joi.string().required(),
            }),
        }),
        (req, res) => getByNameCtrl.execute(req, res)
    );

    // ----------------------------
    // READ: Get all
    // GET /incidentTypes/search/all
    // ----------------------------

    /**
     * @openapi
     * /api/incidentTypes/search/all:
     *   get:
     *     tags: [IncidentTypes]
     *     summary: Get all incident types
     *     responses:
     *       200:
     *         description: List of all incident types
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/IncidentType"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/search/all", (req, res) => getAllCtrl.execute(req, res));

    // ----------------------------
    // READ: Direct children
    // GET /incidentTypes/:code/children
    // ----------------------------

    /**
     * @openapi
     * /api/incidentTypes/{code}/children:
     *   get:
     *     tags: [IncidentTypes]
     *     summary: Get direct children of an incident type
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^T-INC\\d{3}$"
     *         example: T-INC001
     *     responses:
     *       200:
     *         description: List of direct child incident types
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/IncidentType"
     *       400:
     *         description: Validation or business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Parent incident type not found (if enforced)
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

    /**
     * @openapi
     * /api/incidentTypes/{code}/subtree:
     *   get:
     *     tags: [IncidentTypes]
     *     summary: Get subtree (all descendants) from a parent incident type
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^T-INC\\d{3}$"
     *         example: T-INC001
     *     responses:
     *       200:
     *         description: Subtree rooted at the given incident type
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/IncidentTypeTreeNode"
     *       400:
     *         description: Validation or business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Parent incident type not found (if enforced)
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

    /**
     * @openapi
     * /api/incidentTypes/{code}:
     *   get:
     *     tags: [IncidentTypes]
     *     summary: Get an incident type by code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^T-INC\\d{3}$"
     *         example: T-INC001
     *     responses:
     *       200:
     *         description: Incident type
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/IncidentType"
     *       400:
     *         description: Validation or business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident type not found
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
     *     tags: [IncidentTypes]
     *     summary: Update an incident type by code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^T-INC\\d{3}$"
     *         example: T-INC001
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/IncidentTypeUpdateRequest"
     *     responses:
     *       200:
     *         description: Updated incident type
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/IncidentType"
     *       400:
     *         description: Validation or business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident type not found
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
     *     tags: [IncidentTypes]
     *     summary: Remove an incident type by code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *           pattern: "^T-INC\\d{3}$"
     *         example: T-INC001
     *     responses:
     *       204:
     *         description: Deleted successfully (no content)
     *       400:
     *         description: Validation or business rule error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Incident type not found
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

    // ----------------------------
    // CREATE
    // POST /incidentTypes
    // ----------------------------

    /**
     * @openapi
     * /api/incidentTypes:
     *   post:
     *     tags: [IncidentTypes]
     *     summary: Create a new incident type
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/IncidentTypeCreateRequest"
     *     responses:
     *       200:
     *         description: Created incident type
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/IncidentType"
     *       400:
     *         description: Validation or business rule error
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
    route.post(
        "/",
        celebrate({
            body: Joi.object({
                code: Joi.string().required(), // domain validates format
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

    // ----------------------------
    // DELETE
    // DELETE /incidentTypes/:code
    // ----------------------------
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
