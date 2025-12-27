import express from 'express';
import expressLoader from './express';
import mongooseLoader from './mongoose';
import dependencyInjectorLoader from './dependencyInjector';
import config from '../config';
import Logger from './logger';

export default async ({expressApp}: { expressApp: express.Application }) => {
    await mongooseLoader();
    Logger.info('✌️ DB loaded and connected!');


    dependencyInjectorLoader({
        schemas: [
            {name: "userSchema", path: "../persistence/schemas/userSchema"},
            {name: "complementaryTaskCategorySchema", path: "../persistence/schemas/complementaryTaskCategorySchema"},
            {name: "incidentTypeSchema", path: "../persistence/schemas/incidentTypeSchema"},
            {name: "complementaryTaskSchema", path: "../persistence/schemas/complementaryTaskSchema"},
            {name: "incidentSchema", path: "../persistence/schemas/incidentSchema"},
            {name: "complementaryTaskSchema", path: "../persistence/schemas/complementaryTaskSchema"},
            {name: "vesselVisitExecutionSchema", path: "../persistence/schemas/vesselVisitExecutionSchema"}
        ],

        mappers: [
            {name: "UserMap", path: "../mappers/UserMap"},
            {name: "ComplementaryTaskCategoryMap", path: "../mappers/ComplementaryTaskCategoryMap"},
            {name: "IncidentTypeMap", path: "../mappers/IncidentTypeMap"},
            {name: "ComplementaryTaskMap", path: "../mappers/ComplementaryTaskMap"},
            {name: "VesselVisitExecutionMap", path: "../mappers/VesselVisitExecutionMap"},

            {name: "IncidentMap", path: "../mappers/IncidentMap"}
        ],

        controllers: [
            config.controllers.user,

            // ComplementaryTaskCategory controllers
            config.controllers.complementaryTaskCategory.create,
            config.controllers.complementaryTaskCategory.update,
            config.controllers.complementaryTaskCategory.getByCode,
            config.controllers.complementaryTaskCategory.getById,
            config.controllers.complementaryTaskCategory.getByName,
            config.controllers.complementaryTaskCategory.getByDescription,
            config.controllers.complementaryTaskCategory.getByCategory,
            config.controllers.complementaryTaskCategory.activate,
            config.controllers.complementaryTaskCategory.deactivate,

            // ComplementaryTask controllers
            config.controllers.complementaryTask.create,
            config.controllers.complementaryTask.update,
            config.controllers.complementaryTask.getAll,
            config.controllers.complementaryTask.getCompleted,
            config.controllers.complementaryTask.getByCategory,
            config.controllers.complementaryTask.getByCategoryCode,
            config.controllers.complementaryTask.getByCode,
            config.controllers.complementaryTask.getByStaff,
            config.controllers.complementaryTask.getByVve,
            config.controllers.complementaryTask.getByVveCode,
            config.controllers.complementaryTask.getInProgress,
            config.controllers.complementaryTask.getInRange,
            config.controllers.complementaryTask.getScheduled,

            // IncidentType controllers
            config.controllers.complementaryTaskCategory.getAll,
            config.controllers.incidentType.create,
            config.controllers.incidentType.update,
            config.controllers.incidentType.getSubTree,
            config.controllers.incidentType.getRoot,
            config.controllers.incidentType.getByCode,
            config.controllers.incidentType.getByName,
            config.controllers.incidentType.getDirectChilds,
            config.controllers.incidentType.remove,
            config.controllers.incidentType.getAll,

            // VesselVisitExecution controllers
            config.controllers.vesselVisitExecution.create,
            config.controllers.vesselVisitExecution.getAll,
            config.controllers.vesselVisitExecution.getById,
            config.controllers.vesselVisitExecution.getByCode,
            config.controllers.vesselVisitExecution.getByImo,
            config.controllers.vesselVisitExecution.getInRange,
            config.controllers.vesselVisitExecution.updateBerthDock,


            // Incident controllers
            config.controllers.incident.create,
            config.controllers.incident.update,
            config.controllers.incident.delete,
            config.controllers.incidentType.getDirectChilds,
            config.controllers.incident.getAll,
            config.controllers.incident.getByCode,
            config.controllers.incident.getActive,
            config.controllers.incident.getResolved,
            config.controllers.incident.getByDateRange,
            config.controllers.incident.getBySeverity,
            config.controllers.incident.getByVVE,
            config.controllers.incident.addVVE,
            config.controllers.incident.removeVVE,
            config.controllers.incident.markResolved,
            config.controllers.incident.updateVEEList,
        ],
        repos: [
            config.repos.user,
            config.repos.complementaryTaskCategory,
            config.repos.incidentType,
            config.repos.complementaryTask,
            config.repos.incident,
            config.repos.complementaryTask,
            config.repos.VesselVisitExecution
        ],
        services: [
            config.services.user,
            config.services.complementaryTaskCategory,
            config.services.incidentType,
            config.services.complementaryTask,
            config.services.VesselVisitExecution,
            config.services.complementaryTask,
            config.services.incident,
        ]
    });

    Logger.info('✌️ DI container loaded');

    await expressLoader({app: expressApp});
    Logger.info('✌️ Express loaded');
};