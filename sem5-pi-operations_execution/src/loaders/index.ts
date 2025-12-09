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
            { name: "userSchema", path: "../persistence/schemas/userSchema" }
        ],
        controllers: [
            config.controllers.user
        ],
        repos: [
            config.repos.user
        ],
        services: [
            config.services.user
        ]
    });

    Logger.info('✌️ DI container loaded');

    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');
};