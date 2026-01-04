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

/**
 * @openapi
 * tags:
 *   - name: ComplementaryTask
 *     description: Management and search of complementary tasks
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
 *     ComplementaryTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         code:
 *           type: string
 *           example: "CT-2025-0001"
 *         category:
 *           type: string
 *           description: Category identifier/code (as stored by backend)
 *           example: "CTC-001"
 *         staff:
 *           type: string
 *           example: "user-123"
 *         timeStart:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T09:00:00Z"
 *         status:
 *           type: string
 *           enum: [Scheduled, InProgress, Completed]
 *           example: Scheduled
 *         vve:
 *           type: string
 *           description: VVE identifier/code (as stored by backend)
 *           example: "VVE2025000001"
 *
 *     CreateComplementaryTaskRequest:
 *       type: object
 *       required: [category, staff, timeStart, vve]
 *       properties:
 *         category:
 *           type: string
 *           example: "CTC-001"
 *         staff:
 *           type: string
 *           example: "user-123"
 *         timeStart:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T09:00:00Z"
 *         vve:
 *           type: string
 *           example: "VVE2025000001"
 *
 *     UpdateComplementaryTaskRequest:
 *       type: object
 *       required: [category, staff, timeStart, status, vve]
 *       properties:
 *         category:
 *           type: string
 *           example: "CTC-001"
 *         staff:
 *           type: string
 *           example: "user-123"
 *         timeStart:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T09:30:00Z"
 *         status:
 *           type: string
 *           enum: [Scheduled, InProgress, Completed]
 *           example: InProgress
 *         vve:
 *           type: string
 *           example: "VVE2025000001"
 */

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

    const getByCategoryCodeCtrl = Container.get(
        config.controllers.complementaryTask.getByCategoryCode.name
    ) as GetCTByCategoryCodeController;

    const getByCodeCtrl = Container.get(
        config.controllers.complementaryTask.getByCode.name
    ) as GetCTByCodeController;

    const getByStaffCtrl = Container.get(
        config.controllers.complementaryTask.getByStaff.name
    ) as GetCTByStaffController;

    const getByVveCtrl = Container.get(
        config.controllers.complementaryTask.getByVve.name
    ) as GetCTByVveController;

    const getByVveCodeCtrl = Container.get(
        config.controllers.complementaryTask.getByVveCode.name
    ) as GetCTByVveCodeController;

    const getInProgressCtrl = Container.get(
        config.controllers.complementaryTask.getInProgress.name
    ) as GetInProgressCTController;

    const getInRangeCtrl = Container.get(
        config.controllers.complementaryTask.getInRange.name
    ) as GetInRangeCTController;

    const getScheduledCtrl = Container.get(
        config.controllers.complementaryTask.getScheduled.name
    ) as GetScheduledCTController;

    /**
     * @openapi
     * /api/complementary-tasks:
     *   post:
     *     tags: [ComplementaryTask]
     *     summary: Create a complementary task
     *     description: Requires role LogisticsOperator
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/CreateComplementaryTaskRequest"
     *     responses:
     *       201:
     *         description: Complementary task created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.post(
        "/",
        requireRole(Role.LogisticsOperator),
        celebrate({
            body: Joi.object({
                category: Joi.string().required(),
                staff: Joi.string().required(),
                timeStart: Joi.date().iso().required(),
                vve: Joi.string().required(),
            }),
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/{code}:
     *   put:
     *     tags: [ComplementaryTask]
     *     summary: Update a complementary task by code
     *     description: Requires role LogisticsOperator
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: "CT-2025-0001"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/UpdateComplementaryTaskRequest"
     *     responses:
     *       200:
     *         description: Complementary task updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       404:
     *         description: Not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.put(
        "/:code",
        requireRole(Role.LogisticsOperator),
        celebrate({
            body: Joi.object({
                category: Joi.string().required(),
                staff: Joi.string().required(),
                timeStart: Joi.date().iso().required(),
                status: Joi.string()
                    .valid("Scheduled", "InProgress", "Completed")
                    .required(),
                vve: Joi.string().required(),
            }),
        }),
        (req, res) => updateCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/completed:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get completed complementary tasks
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     responses:
     *       200:
     *         description: List of completed tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/completed",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getCompletedCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/in-progress:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get in-progress complementary tasks
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     responses:
     *       200:
     *         description: List of in-progress tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/in-progress",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getInProgressCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/scheduled:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get scheduled complementary tasks
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     responses:
     *       200:
     *         description: List of scheduled tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/scheduled",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getScheduledCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/category:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get tasks by category (query)
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: category
     *         required: true
     *         schema:
     *           type: string
     *         example: "CTC-001"
     *     responses:
     *       200:
     *         description: Matching tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/category",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ category: Joi.string().required() }) }),
        (req, res) => getByCategoryCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/categoryCode:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get tasks by category code (query)
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: category
     *         required: true
     *         schema:
     *           type: string
     *         example: "CTC-001"
     *     responses:
     *       200:
     *         description: Matching tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/categoryCode",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ category: Joi.string().required() }) }),
        (req, res) => getByCategoryCodeCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/staff:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get tasks by staff (query)
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: staff
     *         required: true
     *         schema:
     *           type: string
     *         example: "user-123"
     *     responses:
     *       200:
     *         description: Matching tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/staff",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ staff: Joi.string().required() }) }),
        (req, res) => getByStaffCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/vve:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get tasks by VVE (query)
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: vve
     *         required: true
     *         schema:
     *           type: string
     *         example: "VVE2025000001"
     *     responses:
     *       200:
     *         description: Matching tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/vve",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ vve: Joi.string().required() }) }),
        (req, res) => getByVveCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/vveCode:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get tasks by VVE code (query)
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: vve
     *         required: true
     *         schema:
     *           type: string
     *         example: "VVE2025000001"
     *     responses:
     *       200:
     *         description: Matching tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/vveCode",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        celebrate({ query: Joi.object({ vve: Joi.string().required() }) }),
        (req, res) => getByVveCodeCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/in-range:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get tasks within a time range (milliseconds)
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
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
     *         description: Matching tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/in-range",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
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
     * /api/complementary-tasks:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get all complementary tasks
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     responses:
     *       200:
     *         description: List of tasks
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTask"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getAllCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-tasks/search/code/{code}:
     *   get:
     *     tags: [ComplementaryTask]
     *     summary: Get a complementary task by code
     *     description: Requires role LogisticsOperator or PortOperationsSupervisor
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: "CT-2025-0001"
     *     responses:
     *       200:
     *         description: Task details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTask"
     *       404:
     *         description: Not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ErrorResponse"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/search/code/:code",
        requireRole(Role.LogisticsOperator, Role.PortOperationsSupervisor),
        (req, res) => getByCodeCtrl.execute(req, res)
    );
};
