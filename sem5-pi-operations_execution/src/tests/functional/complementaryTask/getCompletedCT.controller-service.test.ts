import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetCompletedCTController from "../../../controllers/complementaryTask/getCompletedCTController";



describe("CT | Get Completed | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetCompletedCTController);

    it("should return completed tasks", async () => {

        repoMock.findCompleted.mockResolvedValue([
            { code: "CT10" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = {};
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findCompleted).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT10" }
        ]);
    });
});