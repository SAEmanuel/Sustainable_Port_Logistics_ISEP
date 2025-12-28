import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetCTByStaffController from "../../../controllers/complementaryTask/getCTByStaffController";


describe("CT | Get By Staff | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetCTByStaffController);

    it("should return CTs by staff", async () => {

        repoMock.findByStaff.mockResolvedValue([
            { code: "CT51" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = { query: { staff: "JOHN" } };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findByStaff).toHaveBeenCalledWith("JOHN");

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT51" }
        ]);
    });

    it("should return 400 if staff param missing", async () => {

        const req = { query: {} };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});