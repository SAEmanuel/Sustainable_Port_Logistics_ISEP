import { Container } from "typedi";

export function registerTestLogger() {

    const fakeLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    };

    Container.set("logger", fakeLogger);
}