import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetCTByVveController from "../../../controllers/complementaryTask/getCTByVveController";


describe("CT | Get By VVE | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetCTByVveController);

    it("should return CT by VVE id", async () => {

        repoMock.findByVve.mockResolvedValue({ code: "CT200" });

        mapperMock.toDTO.mockReturnValue({ code: "CT200" });

        const req = { query: { vve: "VVE123" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findByVve).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({ code: "CT200" });
    });

    it("should return 400 if VVE param missing", async () => {

        const req = { query: {} };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});