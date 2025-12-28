import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetAllCTController from "../../../controllers/complementaryTask/getAllCTController";


describe("CT | Get All | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetAllCTController);

    it("should return all complementary tasks", async () => {

        repoMock.findAll.mockResolvedValue([
            { code: "CT1" },
            { code: "CT2" }
        ]);

        mapperMock.toDTO.mockImplementation(task => task);

        const req = {};
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findAll).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT1" },
            { code: "CT2" }
        ]);
    });
});