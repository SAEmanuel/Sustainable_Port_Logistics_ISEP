import { describe, it, expect } from "vitest";
import { createCtTestContext } from "./_ctTestContext";
import ComplementaryTaskService from "../../../services/complementaryTaskService";
import CreateCTController from "../../../controllers/complementaryTask/createCTController";


describe("CT | Create | Controller + Service", () => {

    const {
        repoMock,
        ctcRepoMock,
        vveRepoMock,
        mapperMock,
        controller,
        mockRes
    } =
        createCtTestContext(ComplementaryTaskService, CreateCTController);

    it("should create a complementary task (HTTP 200 OK)", async () => {


        repoMock.getNextSequenceNumber.mockResolvedValue(5);


        ctcRepoMock.findById.mockResolvedValue({
            code: "CTC001",
            categoryId: "CAT1"
        });


        vveRepoMock.findById.mockResolvedValue({ id: "VVE1" });


        repoMock.save.mockResolvedValue({ code: "CTC001-5" });


        mapperMock.toDTO.mockReturnValue({
            code: "CTC001-5"
        });

        const req = {
            body: {
                category: "CAT1",
                staff: "JOHN",
                vve: "VVE1",
                timeStart: "2025-01-01T10:00:00Z"
            }
        };

        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(repoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ code: "CTC001-5" });
    });

    it("should return 400 if category does not exist", async () => {

        ctcRepoMock.findById.mockResolvedValue(null);

        const req = {
            body: {
                category: "INVALID",
                staff: "JOHN",
                vve: "VVE1",
                timeStart: "2025-01-01T10:00:00Z"
            }
        };

        const res = mockRes();

        await controller.execute(req as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});