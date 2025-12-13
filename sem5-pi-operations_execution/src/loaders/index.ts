import express from 'express';
import expressLoader from './express';
import mongooseLoader from './mongoose';
import dependencyInjectorLoader from './dependencyInjector';
import config from '../config';
import Logger from './logger';

export default async ({ expressApp }: { expressApp: express.Application }) => {
    const mongoConnection = await mongooseLoader();
    Logger.info('✌️ DB loaded and connected!');


    dependencyInjectorLoader({
        schemas: [
            { name: "userSchema", path: "../persistence/schemas/userSchema" },
            { name: "complementaryTaskCategorySchema", path: "../persistence/schemas/complementaryTaskCategorySchema" }
        ],
        controllers: [
            config.controllers.user,
            config.controllers.complementaryTaskCategory.create,
            config.controllers.complementaryTaskCategory.update,
            config.controllers.complementaryTaskCategory.getByCode,
            config.controllers.complementaryTaskCategory.getByName,
            config.controllers.complementaryTaskCategory.getByDescription,
            config.controllers.complementaryTaskCategory.getByCategory,
            config.controllers.complementaryTaskCategory.activate,
            config.controllers.complementaryTaskCategory.deactivate
        ],
        repos: [
            config.repos.user,
            config.repos.complementaryTaskCategory
        ],
        services: [
            config.services.user,
            config.services.complementaryTaskCategory
        ]
    });

    Logger.info('✌️ DI container loaded');

    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');
};