import express from 'express';
import expressLoader from './express';
import mongooseLoader from './mongoose';
import dependencyInjectorLoader from './dependencyInjector';
import config from '../config';
import Logger from './logger';

export default async ({expressApp}: { expressApp: express.Application }) => {
    const mongoConnection = await mongooseLoader();
    Logger.info('✌️ DB loaded and connected!');


    dependencyInjectorLoader({
        schemas: [
            {name: "userSchema", path: "../persistence/schemas/userSchema"},
            {name: "complementaryTaskCategorySchema", path: "../persistence/schemas/complementaryTaskCategorySchema"},
            {name: "incidentTypeSchema", path: "../persistence/schemas/incidentTypeSchema"}
        ],

        mappers: [
            {name: "UserMap", path: "../mappers/UserMap"},
            {name: "ComplementaryTaskCategoryMap", path: "../mappers/ComplementaryTaskCategoryMap"},
            {name: "IncidentTypeMap", path: "../mappers/IncidentTypeMap"}
        ],

        controllers: [
            config.controllers.user,

            // ComplementaryTaskCategory controllers
            config.controllers.complementaryTaskCategory.create,
            config.controllers.complementaryTaskCategory.update,
            config.controllers.complementaryTaskCategory.getByCode,
            config.controllers.complementaryTaskCategory.getByName,
            config.controllers.complementaryTaskCategory.getByDescription,
            config.controllers.complementaryTaskCategory.getByCategory,
            config.controllers.complementaryTaskCategory.activate,
            config.controllers.complementaryTaskCategory.deactivate,

            // IncidentType controllers
            config.controllers.complementaryTaskCategory.getAll,
            config.controllers.incidentType.create,
            config.controllers.incidentType.update,
            config.controllers.incidentType.getSubTree,
            config.controllers.incidentType.getRoot,
            config.controllers.incidentType.getByCode,
            config.controllers.incidentType.getByName,
            config.controllers.incidentType.getDirectChilds
        ],
        repos: [
            config.repos.user,
            config.repos.complementaryTaskCategory,
            config.repos.incidentType
        ],
        services: [
            config.services.user,
            config.services.complementaryTaskCategory,
            config.services.incidentType
        ]
    });

    Logger.info('✌️ DI container loaded');

    await expressLoader({app: expressApp});
    Logger.info('✌️ Express loaded');
};