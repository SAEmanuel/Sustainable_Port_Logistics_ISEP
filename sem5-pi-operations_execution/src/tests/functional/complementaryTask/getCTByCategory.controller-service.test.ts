import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetCTByCategoryController from "../../../controllers/complementaryTask/getCTByCategoryController";


describe("CT | Get By Category | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetCTByCategoryController);

    it("should return CTs filtered by category", async () => {

        repoMock.findByCategory.mockResolvedValue([
            { code: "CT100" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = {
            query: { category: "CAT1" }
        };

        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findByCategory).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT100" }
        ]);
    });

    it("should return 400 if category is missing", async () => {

        const req = { query: {} };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});