import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetCTByCategoryCodeController from "../../../controllers/complementaryTask/getCTByCategoryCodeController";


describe("CT | Get By Category Code | Controller + Service", () => {

    const {
        repoMock,
        ctcRepoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetCTByCategoryCodeController);

    it("should return CTs by category code", async () => {

        ctcRepoMock.findByCode.mockResolvedValue({
            categoryId: "CAT1"
        });

        repoMock.findByCategory.mockResolvedValue([
            { code: "CT20" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = { query: { category: "CTC001" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(ctcRepoMock.findByCode).toHaveBeenCalledWith("CTC001");

        expect(repoMock.findByCategory).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT20" }
        ]);
    });

    it("should return 400 if category code is missing", async () => {

        const req = { query: {} };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});