import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetInProgressCTController from "../../../controllers/complementaryTask/getInProgressCTController";


describe("CT | Get In-Progress | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetInProgressCTController);

    it("should return in-progress CTs (200)", async () => {

        repoMock.findInProgress.mockResolvedValue([
            { code: "CT-22" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = {};
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findInProgress).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT-22" }
        ]);
    });
});