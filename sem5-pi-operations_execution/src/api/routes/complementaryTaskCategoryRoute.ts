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

const route = Router();

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


    route.post(
        "/",
        celebrate({
            body: Joi.object({
                code: Joi.string().required(),
                name: Joi.string().required(),
                description: Joi.string().required(),
                category: Joi.string().required(),
                defaultDuration: Joi.number().optional()
            })
        }),
        (req, res) => createCtrl.execute(req, res)
    );


    route.put(
        "/:code",
        celebrate({
            body: Joi.object({
                name: Joi.string().required(),
                description: Joi.string().required(),
                category: Joi.string().required(),
                defaultDuration: Joi.number().optional()
            })
        }),
        (req, res) => updateCtrl.execute(req, res)
    );


    route.get(
        "/",
        (req, res) => getAllCtrl.execute(req, res)
    );


    route.get(
        "/:code",
        (req, res) => getByCodeCtrl.execute(req, res)
    );

    route.get(
        "/search/name",
        celebrate({
            query: Joi.object({
                name: Joi.string().required()
            })
        }),
        (req, res) => getByNameCtrl.execute(req, res)
    );

    route.get(
        "/search/description",
        celebrate({
            query: Joi.object({
                description: Joi.string().required()
            })
        }),
        (req, res) => getByDescriptionCtrl.execute(req, res)
    );

    route.get(
        "/search/category",
        celebrate({
            query: Joi.object({
                category: Joi.string().required()
            })
        }),
        (req, res) => getByCategoryCtrl.execute(req, res)
    );


    route.patch(
        "/:code/activate",
        (req, res) => activateCtrl.execute(req, res)
    );

    route.patch(
        "/:code/deactivate",
        (req, res) => deactivateCtrl.execute(req, res)
    );

    route.get("/search/id/:id", (req, res) => getByIdCtrl.execute(req, res));
};