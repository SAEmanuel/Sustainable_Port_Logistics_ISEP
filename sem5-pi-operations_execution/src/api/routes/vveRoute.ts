import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";
import config from "../../config";

import CreateVVEController from "../../controllers/vve/createVVEController";
import GetAllVVEController from "../../controllers/vve/getAllVVEController";
import GetVVEByIdController from "../../controllers/vve/getVVEByIdController";
import GetVVEByCodeController from "../../controllers/vve/getVVEByCodeController";
import GetVVEByImoController from "../../controllers/vve/getVVEByImoController";
import GetVVEInRangeController from "../../controllers/vve/getVVEInRangeController";
import UpdateVVEActualBerthAndDockController from "../../controllers/vve/updateVVEActualBerthAndDockController";
import UpdateVVEExecutedOperationsController from "../../controllers/vve/updateVVEExecutedOperationsController";
import UpdateVVEToCompletedController from "../../controllers/vve/updateVVEToCompletedController";

const route = Router();

/**
 * @openapi
 * tags:
 *   - name: VesselVisitExecution
 *     description: Real-time tracking of vessel visits (Arrivals, Berthing, Operations)
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
 *     ResourceUsed:
 *       type: object
 *       required: [resourceId]
 *       properties:
 *         resourceId:
 *           type: string
 *           example: RES-001
 *         quantity:
 *           type: number
 *           example: 2
 *         hours:
 *           type: number
 *           example: 4.5
 *
 *     ExecutedOperation:
 *       type: object
 *       required: [plannedOperationId]
 *       properties:
 *         plannedOperationId:
 *           type: string
 *           example: OP-100
 *         actualStart:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T10:00:00Z"
 *         actualEnd:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T12:00:00Z"
 *         status:
 *           type: string
 *           enum: [started, completed, delayed]
 *           example: completed
 *         note:
 *           type: string
 *           example: Operation delayed due to wind.
 *         resourcesUsed:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResourceUsed"
 *
 *     VesselVisitExecution:
 *       type: object
 *       description: Represents the actual execution of a vessel visit.
 *       properties:
 *         id:
 *           type: string
 *           description: Unique internal identifier
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         code:
 *           type: string
 *           description: Business ID (VVE + Year + Seq)
 *           example: VVE2025000001
 *         vvnId:
 *           type: string
 *           description: Reference to the Notification
 *           example: VVN-2025-001
 *         vesselImo:
 *           type: string
 *           description: Vessel Identifier
 *           example: IMO9999999
 *         status:
 *           type: string
 *           description: Current state (In Progress, Completed, etc.)
 *           example: In Progress
 *         actualArrivalTime:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T08:00:00Z"
 *         actualBerthTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         actualDockId:
 *           type: string
 *           nullable: true
 *         executedOperations:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ExecutedOperation"
 *
 *     CreateVVERequest:
 *       type: object
 *       required: [vvnId, actualArrivalTime]
 *       properties:
 *         vvnId:
 *           type: string
 *           example: VVN-2025-001
 *         actualArrivalTime:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T08:00:00Z"
 *         creatorEmail:
 *           type: string
 *           format: email
 *           example: operator@port.com
 *
 *     UpdateBerthRequest:
 *       type: object
 *       required: [actualBerthTime, actualDockId, updaterEmail]
 *       properties:
 *         actualBerthTime:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T09:30:00Z"
 *         actualDockId:
 *           type: string
 *           example: DOCK-A1
 *         updaterEmail:
 *           type: string
 *           format: email
 *           example: dockmaster@port.com
 *
 *     UpdateOperationsRequest:
 *       type: object
 *       required: [operatorId, operations]
 *       properties:
 *         operatorId:
 *           type: string
 *           example: user-123
 *         operations:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: "#/components/schemas/ExecutedOperation"
 */

export default (app: Router) => {
    app.use("/vve", route);

    const createCtrl = Container.get(
        config.controllers.vesselVisitExecution.create.name
    ) as CreateVVEController;

    const getAllCtrl = Container.get(
        config.controllers.vesselVisitExecution.getAll.name
    ) as GetAllVVEController;

    const getByIdCtrl = Container.get(
        config.controllers.vesselVisitExecution.getById.name
    ) as GetVVEByIdController;

    const getByCodeCtrl = Container.get(
        config.controllers.vesselVisitExecution.getByCode.name
    ) as GetVVEByCodeController;

    const getByImoCtrl = Container.get(
        config.controllers.vesselVisitExecution.getByImo.name
    ) as GetVVEByImoController;

    const getInRangeCtrl = Container.get(
        config.controllers.vesselVisitExecution.getInRange.name
    ) as GetVVEInRangeController;

    const updateBerthDockCtrl = Container.get(
        config.controllers.vesselVisitExecution.updateBerthDock.name
    ) as UpdateVVEActualBerthAndDockController;

    const updateExecOpsCtrl = Container.get(
        config.controllers.vesselVisitExecution.updateExecutedOperations.name
    ) as UpdateVVEExecutedOperationsController;
    
    const completeCtrl = Container.get(UpdateVVEToCompletedController);
    /**
     * @openapi
     * /api/vve:
     *   post:
     *     tags: [VesselVisitExecution]
     *     summary: Register a vessel arrival (Create VVE)
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/CreateVVERequest"
     *     responses:
     *       201:
     *         description: VVE Created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/VesselVisitExecution"
     *       400:
     *         description: Validation error
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
     *   get:
     *     tags: [VesselVisitExecution]
     *     summary: Get all vessel visit executions
     *     responses:
     *       200:
     *         description: List of VVE
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/VesselVisitExecution"
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
                vvnId: Joi.string().required(),
                actualArrivalTime: Joi.date().iso().required(),
                creatorEmail: Joi.string().email().optional(),
            }),
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    route.get("/", (req, res) => getAllCtrl.execute(req, res));

    /**
     * @openapi
     * /api/vve/range:
     *   get:
     *     tags: [VesselVisitExecution]
     *     summary: Get VVEs within a time range
     *     parameters:
     *       - in: query
     *         name: timeStart
     *         required: true
     *         schema:
     *           type: number
     *         description: Start timestamp (milliseconds)
     *         example: 1704067200000
     *       - in: query
     *         name: timeEnd
     *         required: true
     *         schema:
     *           type: number
     *         description: End timestamp (milliseconds)
     *         example: 1704153600000
     *     responses:
     *       200:
     *         description: Filtered list of VVE
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/VesselVisitExecution"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get(
        "/range",
        celebrate({
            query: Joi.object({
                timeStart: Joi.number().required(),
                timeEnd: Joi.number().required(),
            }),
        }),
        (req, res) => getInRangeCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/vve/code/{code}:
     *   get:
     *     tags: [VesselVisitExecution]
     *     summary: Get VVE by Code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: VVE2025000001
     *     responses:
     *       200:
     *         description: VVE details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/VesselVisitExecution"
     *       404:
     *         description: Not Found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/code/:code", (req, res) => getByCodeCtrl.execute(req, res));

    /**
     * @openapi
     * /api/vve/imo/{imo}:
     *   get:
     *     tags: [VesselVisitExecution]
     *     summary: Get VVEs by Vessel IMO
     *     parameters:
     *       - in: path
     *         name: imo
     *         required: true
     *         schema:
     *           type: string
     *         example: IMO9999999
     *     responses:
     *       200:
     *         description: List of VVEs for this vessel
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/VesselVisitExecution"
     */
    route.get("/imo/:imo", (req, res) => getByImoCtrl.execute(req, res));

    /**
     * @openapi
     * /api/vve/{id}:
     *   get:
     *     tags: [VesselVisitExecution]
     *     summary: Get VVE by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: VVE details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/VesselVisitExecution"
     *       404:
     *         description: Not Found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.get("/:id", (req, res) => getByIdCtrl.execute(req, res));

    /**
     * @openapi
     * /api/vve/{id}/berth:
     *   put:
     *     tags: [VesselVisitExecution]
     *     summary: Update Actual Berth Time and Dock
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: VVE Internal ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/UpdateBerthRequest"
     *     responses:
     *       200:
     *         description: Updated VVE
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/VesselVisitExecution"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Not Found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       409:
     *         description: Conflict - VVE not in progress (business rule)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.put(
        "/:id/berth",
        celebrate({
            body: Joi.object({
                actualBerthTime: Joi.date().iso().required(),
                actualDockId: Joi.string().required(),
                updaterEmail: Joi.string().email().required(),
            }),
        }),
        (req, res, next) => updateBerthDockCtrl.execute(req, res, next)
    );

    /**
     * @openapi
     * /api/vve/{id}/executed-operations:
     *   put:
     *     tags: [VesselVisitExecution]
     *     summary: Update Executed Operations for a VVE
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: VVE Internal ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/UpdateOperationsRequest"
     *     responses:
     *       200:
     *         description: Updated VVE
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/VesselVisitExecution"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Not Found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       409:
     *         description: Conflict - VVE not in progress (business rule)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     */
    route.put(
        "/:id/executed-operations",
        celebrate({
            body: Joi.object({
                operatorId: Joi.string().required(),
                operations: Joi.array()
                    .items(
                        Joi.object({
                            plannedOperationId: Joi.string().required(),
                            actualStart: Joi.date().iso().optional(),
                            actualEnd: Joi.date().iso().optional(),
                            status: Joi.string()
                                .valid("started", "completed", "delayed")
                                .optional(),
                            note: Joi.string().optional(),
                            resourcesUsed: Joi.array()
                                .items(
                                    Joi.object({
                                        resourceId: Joi.string().required(),
                                        quantity: Joi.number().optional(),
                                        hours: Joi.number().optional(),
                                    })
                                )
                                .optional(),
                        })
                    )
                    .min(1)
                    .required(),
            }),
        }),
        (req, res, next) => updateExecOpsCtrl.execute(req, res, next)
    );

    
    /**
     * @openapi
     * /api/vve/{code}/complete:
     *   put:
     *     tags: [VesselVisitExecution]
     *     summary: Complete a Vessel Visit Execution
     *     description: Marks a VVE as completed by providing actual unberth and leave port times.
     *     parameters:
     *       - name: code
     *         in: path
     *         required: true
     *         description: Code of the Vessel Visit Execution to complete
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - actualUnBerthTime
     *               - actualLeavePortTime
     *               - updaterEmail
     *             properties:
     *               actualUnBerthTime:
     *                 type: string
     *                 format: date-time
     *                 description: Actual unberth time of the vessel
     *               actualLeavePortTime:
     *                 type: string
     *                 format: date-time
     *                 description: Actual time the vessel left the port
     *               updaterEmail:
     *                 type: string
     *                 format: email
     *                 description: Email of the user completing the VVE
     *     responses:
     *       200:
     *         description: VVE completed successfully
     *       400:
     *         description: Invalid input or business rule violation (e.g., operations not completed)
     *       404:
     *         description: VVE not found
     */
    route.put(
        "/:code/complete",
        celebrate({
            body: Joi.object({
            actualUnBerthTime: Joi.date().iso().required(),
            actualLeavePortTime: Joi.date().iso().required(),
            updaterEmail: Joi.string().email().required(),
            }),
        }),
        (req, res, next) => completeCtrl.execute(req, res, next)
    );
};
