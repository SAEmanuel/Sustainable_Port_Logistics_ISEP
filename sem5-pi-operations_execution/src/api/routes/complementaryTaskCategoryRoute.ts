import { Router } from "express";
import { Container } from "typedi";
import { celebrate, Joi } from "celebrate";
import config from "../../config";

import CreateComplementaryTaskCategoryController from "../../controllers/complementaryTaskCategory/createComplementaryTaskCategoryController";
import UpdateComplementaryTaskCategoryController from "../../controllers/complementaryTaskCategory/updateComplementaryTaskCategoryController";
import GetCTCByCodeController from "../../controllers/complementaryTaskCategory/getCTCByCodeController";
import GetCTCByNameController from "../../controllers/complementaryTaskCategory/getCTCByNameController";
import GetCTCByDescriptionController from "../../controllers/complementaryTaskCategory/getCTCByDescriptionController";
import GetCTCByCategoryController from "../../controllers/complementaryTaskCategory/getCTCByCategoryController";
import ActivateComplementaryTaskCategoryController from "../../controllers/complementaryTaskCategory/activateComplementaryTaskCategoryController";
import DeactivateComplementaryTaskCategoryController from "../../controllers/complementaryTaskCategory/deactivateComplementaryTaskCategoryController";
import GetAllComplementaryTaskCategoryController from "../../controllers/complementaryTaskCategory/getAllComplementaryTaskCategoryController";
import { Role } from "../../domain/user/role";
import { requireRole } from "../middlewares/requireRole";

const route = Router();

/**
 * @openapi
 * tags:
 *   - name: ComplementaryTaskCategory
 *     description: Management of complementary task categories
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
 *     ComplementaryTaskCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         code:
 *           type: string
 *           example: "CTC-001"
 *         name:
 *           type: string
 *           example: "Mooring"
 *         description:
 *           type: string
 *           example: "Tasks related to mooring operations"
 *         category:
 *           type: string
 *           example: "Operations"
 *         defaultDuration:
 *           type: number
 *           example: 90
 *         active:
 *           type: boolean
 *           example: true
 *
 *     CreateComplementaryTaskCategoryRequest:
 *       type: object
 *       required: [code, name, description, category]
 *       properties:
 *         code:
 *           type: string
 *           example: "CTC-001"
 *         name:
 *           type: string
 *           example: "Mooring"
 *         description:
 *           type: string
 *           example: "Tasks related to mooring operations"
 *         category:
 *           type: string
 *           example: "Operations"
 *         defaultDuration:
 *           type: number
 *           example: 90
 *
 *     UpdateComplementaryTaskCategoryRequest:
 *       type: object
 *       required: [name, description, category]
 *       properties:
 *         name:
 *           type: string
 *           example: "Mooring"
 *         description:
 *           type: string
 *           example: "Updated description"
 *         category:
 *           type: string
 *           example: "Operations"
 *         defaultDuration:
 *           type: number
 *           example: 120
 */

export default (app: Router) => {
    app.use("/complementary-task-categories", route);

    const createCtrl = Container.get(
        config.controllers.complementaryTaskCategory.create.name
    ) as CreateComplementaryTaskCategoryController;

    const updateCtrl = Container.get(
        config.controllers.complementaryTaskCategory.update.name
    ) as UpdateComplementaryTaskCategoryController;

    const getByCodeCtrl = Container.get(
        config.controllers.complementaryTaskCategory.getByCode.name
    ) as GetCTCByCodeController;

    const getByIdCtrl = Container.get(
        config.controllers.complementaryTaskCategory.getById.name
    ) as GetCTCByCodeController;

    const getByNameCtrl = Container.get(
        config.controllers.complementaryTaskCategory.getByName.name
    ) as GetCTCByNameController;

    const getByDescriptionCtrl = Container.get(
        config.controllers.complementaryTaskCategory.getByDescription.name
    ) as GetCTCByDescriptionController;

    const getByCategoryCtrl = Container.get(
        config.controllers.complementaryTaskCategory.getByCategory.name
    ) as GetCTCByCategoryController;

    const activateCtrl = Container.get(
        config.controllers.complementaryTaskCategory.activate.name
    ) as ActivateComplementaryTaskCategoryController;

    const deactivateCtrl = Container.get(
        config.controllers.complementaryTaskCategory.deactivate.name
    ) as DeactivateComplementaryTaskCategoryController;

    const getAllCtrl = Container.get(
        config.controllers.complementaryTaskCategory.getAll.name
    ) as GetAllComplementaryTaskCategoryController;

    /**
     * @openapi
     * /api/complementary-task-categories:
     *   post:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Create a complementary task category
     *     description: Requires role PortOperationsSupervisor
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/CreateComplementaryTaskCategoryRequest"
     *     responses:
     *       201:
     *         description: Category created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        requireRole(Role.PortOperationsSupervisor),
        celebrate({
            body: Joi.object({
                code: Joi.string().required(),
                name: Joi.string().required(),
                description: Joi.string().required(),
                category: Joi.string().required(),
                defaultDuration: Joi.number().optional(),
            }),
        }),
        (req, res) => createCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/{code}:
     *   put:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Update a complementary task category by code
     *     description: Requires role PortOperationsSupervisor
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: "CTC-001"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/UpdateComplementaryTaskCategoryRequest"
     *     responses:
     *       200:
     *         description: Category updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        requireRole(Role.PortOperationsSupervisor),
        celebrate({
            body: Joi.object({
                name: Joi.string().required(),
                description: Joi.string().required(),
                category: Joi.string().required(),
                defaultDuration: Joi.number().optional(),
            }),
        }),
        (req, res) => updateCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories:
     *   get:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Get all complementary task categories
     *     description: Requires role PortOperationsSupervisor or LogisticsOperator
     *     responses:
     *       200:
     *         description: List of categories
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTaskCategory"
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    route.get(
        "/",
        requireRole(Role.PortOperationsSupervisor, Role.LogisticsOperator),
        (req, res) => getAllCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/{code}:
     *   get:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Get a complementary task category by code
     *     description: Requires role PortOperationsSupervisor or LogisticsOperator
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: "CTC-001"
     *     responses:
     *       200:
     *         description: Category details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        "/:code",
        requireRole(Role.PortOperationsSupervisor, Role.LogisticsOperator),
        (req, res) => getByCodeCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/search/name:
     *   get:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Search categories by name
     *     description: Requires role PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: name
     *         required: true
     *         schema:
     *           type: string
     *         example: "Mooring"
     *     responses:
     *       200:
     *         description: Matching categories
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        "/search/name",
        requireRole(Role.PortOperationsSupervisor),
        celebrate({
            query: Joi.object({
                name: Joi.string().required(),
            }),
        }),
        (req, res) => getByNameCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/search/description:
     *   get:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Search categories by description
     *     description: Requires role PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: description
     *         required: true
     *         schema:
     *           type: string
     *         example: "mooring"
     *     responses:
     *       200:
     *         description: Matching categories
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        "/search/description",
        requireRole(Role.PortOperationsSupervisor),
        celebrate({
            query: Joi.object({
                description: Joi.string().required(),
            }),
        }),
        (req, res) => getByDescriptionCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/search/category:
     *   get:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Search categories by category field
     *     description: Requires role PortOperationsSupervisor
     *     parameters:
     *       - in: query
     *         name: category
     *         required: true
     *         schema:
     *           type: string
     *         example: "Operations"
     *     responses:
     *       200:
     *         description: Matching categories
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        requireRole(Role.PortOperationsSupervisor),
        celebrate({
            query: Joi.object({
                category: Joi.string().required(),
            }),
        }),
        (req, res) => getByCategoryCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/{code}/activate:
     *   patch:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Activate a complementary task category
     *     description: Requires role PortOperationsSupervisor
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: "CTC-001"
     *     responses:
     *       200:
     *         description: Category activated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTaskCategory"
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
    route.patch(
        "/:code/activate",
        requireRole(Role.PortOperationsSupervisor),
        (req, res) => activateCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/{code}/deactivate:
     *   patch:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Deactivate a complementary task category
     *     description: Requires role PortOperationsSupervisor
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         example: "CTC-001"
     *     responses:
     *       200:
     *         description: Category deactivated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTaskCategory"
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
    route.patch(
        "/:code/deactivate",
        requireRole(Role.PortOperationsSupervisor),
        (req, res) => deactivateCtrl.execute(req, res)
    );

    /**
     * @openapi
     * /api/complementary-task-categories/search/id/{id}:
     *   get:
     *     tags: [ComplementaryTaskCategory]
     *     summary: Get category by internal id
     *     description: Requires role PortOperationsSupervisor or LogisticsOperator
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: "123e4567-e89b-12d3-a456-426614174000"
     *     responses:
     *       200:
     *         description: Category details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/ComplementaryTaskCategory"
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
        "/search/id/:id",
        requireRole(Role.PortOperationsSupervisor, Role.LogisticsOperator),
        (req, res) => getByIdCtrl.execute(req, res)
    );
};
