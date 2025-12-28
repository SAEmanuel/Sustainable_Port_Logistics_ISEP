import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetScheduledCTController from "../../../controllers/complementaryTask/getScheduledCTController";


describe("CT | Get Scheduled | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetScheduledCTController);

    it("should return scheduled CTs (200)", async () => {

        repoMock.findScheduled.mockResolvedValue([
            { code: "CT-10" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = {};
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findScheduled).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT-10" }
        ]);
    });
});