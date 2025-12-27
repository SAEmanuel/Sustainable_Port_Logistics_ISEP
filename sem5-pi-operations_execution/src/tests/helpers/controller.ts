import { Container } from "typedi";
import config from "../../config";
import { Logger } from "winston";

import IComplementaryTaskService from "../../services/IServices/IComplementaryTaskService";

import CreateCTController from "../../controllers/complementaryTask/createCTController";
import UpdateCTController from "../../controllers/complementaryTask/updateCTController";
import GetAllCTController from "../../controllers/complementaryTask/getAllCTController";
import GetCompletedCTController from "../../controllers/complementaryTask/getCompletedCTController";
import GetCTByCategoryController from "../../controllers/complementaryTask/getCTByCategoryController";
import GetCTByCategoryCodeController from "../../controllers/complementaryTask/getCTByCategoryCodeController";
import GetCTByCodeController from "../../controllers/complementaryTask/getCTByCodeController";
import GetCTByStaffController from "../../controllers/complementaryTask/getCTByStaffController";
import GetCTByVveController from "../../controllers/complementaryTask/getCTByVveController";
import GetCTByVveCodeController from "../../controllers/complementaryTask/getCTByVveCodeController";
import GetInProgressCTController from "../../controllers/complementaryTask/getInProgressCTController";
import GetInRangeCTController from "../../controllers/complementaryTask/getInRangeCTController";
import GetScheduledCTController from "../../controllers/complementaryTask/getScheduledCTController";

export function registerCTControllers() {

    const service = Container.get("ComplementaryTaskService") as IComplementaryTaskService;
    const logger = Container.get("logger") as Logger;

    Container.set(
        config.controllers.complementaryTask.create.name,
        new CreateCTController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.update.name,
        new UpdateCTController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getAll.name,
        new GetAllCTController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getCompleted.name,
        new GetCompletedCTController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getByCategory.name,
        new GetCTByCategoryController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getByCategoryCode.name,
        new GetCTByCategoryCodeController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getByCode.name,
        new GetCTByCodeController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getByStaff.name,
        new GetCTByStaffController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getByVve.name,
        new GetCTByVveController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getByVveCode.name,
        new GetCTByVveCodeController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getInProgress.name,
        new GetInProgressCTController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getInRange.name,
        new GetInRangeCTController(service, logger)
    );

    Container.set(
        config.controllers.complementaryTask.getScheduled.name,
        new GetScheduledCTController(service, logger)
    );
}