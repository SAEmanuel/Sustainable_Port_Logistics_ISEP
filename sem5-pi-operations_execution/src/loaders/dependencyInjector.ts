import { Container } from 'typedi';
import Logger from './logger';

interface SchemaConfig {
    name: string;
    path: string;
}

interface ModuleConfig {
    name: string;
    path: string;
}

interface DependencyInjectorInput {
    schemas: SchemaConfig[];
    controllers: ModuleConfig[];
    repos: ModuleConfig[];
    services: ModuleConfig[];
    mappers: MapperConfig[];
}

interface MapperConfig {
    name: string;
    path: string;
}

export default ({ schemas, controllers, repos, services, mappers }: DependencyInjectorInput) => {
    try {
        Container.set("logger", Logger);

        // Load mappers
        mappers.forEach((m: MapperConfig) => {
            const MapperClass = require(m.path).default;
            const mapperInstance = new MapperClass();
            Container.set(m.name, mapperInstance);
        });

        // Load schemas
        schemas.forEach((s: SchemaConfig) => {
            const schema = require(s.path).default;
            Container.set(s.name, schema);
        });

        // Load repositories
        repos.forEach((r: ModuleConfig) => {
            const RepoClass = require(r.path).default;
            const repoInstance = Container.get(RepoClass);
            Container.set(r.name, repoInstance);
        });

        // Load services
        services.forEach((s: ModuleConfig) => {
            const ServiceClass = require(s.path).default;
            const serviceInstance = Container.get(ServiceClass);
            Container.set(s.name, serviceInstance);
        });

        // Load controllers
        controllers.forEach((c: ModuleConfig) => {
            const ControllerClass = require(c.path).default;
            const controllerInstance = Container.get(ControllerClass);
            Container.set(c.name, controllerInstance);
        });

    } catch (e) {
        Logger.error("Error on dependency injector loader: %o", e);
        throw e;
    }
};