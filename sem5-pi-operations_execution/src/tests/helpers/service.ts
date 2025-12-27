import { Container } from "typedi";
import IComplementaryTaskService from "../../services/IServices/IComplementaryTaskService";

export const ctService = {
    createAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getByCodeAsync: jest.fn(),
    getByCategoryAsync: jest.fn(),
    getByCategoryCodeAsync: jest.fn(),
    getByStaffAsync: jest.fn(),
    getByVveAsync: jest.fn(),
    getByVveCodeAsync: jest.fn(),
    getCompletedAsync: jest.fn(),
    getScheduledAsync: jest.fn(),
    getInProgressAsync: jest.fn(),
    getInRangeAsync: jest.fn(),
    updateAsync: jest.fn()
} as jest.Mocked<IComplementaryTaskService>;

export function registerCTMocks() {
    Container.set("ComplementaryTaskService", ctService);
}