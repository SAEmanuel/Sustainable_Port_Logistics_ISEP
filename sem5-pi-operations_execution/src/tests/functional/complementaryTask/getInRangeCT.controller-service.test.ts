import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import GetInRangeCTController from "../../../controllers/complementaryTask/getInRangeCTController";


describe("CT | Get In-Range | Controller + Service", () => {

    const {
        repoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, GetInRangeCTController);

    it("should return CTs in range (200)", async () => {

        const start = new Date("2025-01-01T10:00:00Z");
        const end = new Date("2025-01-01T12:00:00Z");

        repoMock.findInRange.mockResolvedValue([
            { code: "CT-50" }
        ]);

        mapperMock.toDTO.mockImplementation(t => t);

        const req = {
            query: {
                timeStart: start.getTime(),
                timeEnd: end.getTime()
            }
        };

        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.findInRange).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith([
            { code: "CT-50" }
        ]);
    });

    it("should return 400 if date params missing", async () => {

        const req = { query: {} };
        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if invalid date", async () => {

        const req = {
            query: {
                timeStart: "ABC",
                timeEnd: "123"
            }
        };

        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});