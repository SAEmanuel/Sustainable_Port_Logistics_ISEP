import { describe, it, beforeEach, expect, vi } from "vitest";
import { Container } from "typedi";

import OperationPlanUpdateController
    from "../../../../controllers/operationPlan/operationPlanUpdateController";

import { mockRes } from "../../../helpers/mockHttp";

// ✅ mock parcial do typedi (não quebra @Inject/@Service)
vi.mock("typedi", async (importOriginal) => {
    const actual = await importOriginal<typeof import("typedi")>();
    return {
        ...actual,
        Container: {
            ...actual.Container,
            get: vi.fn(),
        },
    };
});

type FakeResultOk<T> = { isFailure: false; getValue: () => T };
type FakeResultFail = { isFailure: true; errorValue?: () => any };

const ok = <T,>(v: T): FakeResultOk<T> => ({ isFailure: false, getValue: () => v });
const fail = (e: any): FakeResultFail => ({ isFailure: true, errorValue: () => e });

describe("OperationPlanUpdateController", () => {
    const mockService = {
        updatePlanForVvnAsync: vi.fn(),
        updatePlanBatchAsync: vi.fn(),
    };

    let req: any;
    let res: any;
    let next: any;
    let controller: OperationPlanUpdateController;

    beforeEach(() => {
        vi.clearAllMocks();

        (Container.get as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockService);

        req = { body: {}, user: undefined };
        res = mockRes();
        next = vi.fn();

        controller = new OperationPlanUpdateController();
    });

    describe("updateForVvn", () => {
        it("returns 200 on success", async () => {
            req.body = {
                planDomainId: "plan-1",
                vvnId: "VVN-1",
                reasonForChange: "test",
                author: "author@test.com",
                operations: [],
            };

            const payload = { plan: { domainId: "plan-1" }, warnings: [] };
            mockService.updatePlanForVvnAsync.mockResolvedValue(ok(payload));

            await controller.updateForVvn(req, res, next);

            expect(mockService.updatePlanForVvnAsync).toHaveBeenCalledWith(req.body, "author@test.com");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(payload);
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 409 when service result isFailure (with message)", async () => {
            req.body = {
                planDomainId: "plan-1",
                vvnId: "VVN-1",
                reasonForChange: "test",
                author: "author@test.com",
                operations: [],
            };

            mockService.updatePlanForVvnAsync.mockResolvedValue(fail("CRANE_OVERLAP"));

            await controller.updateForVvn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: "CRANE_OVERLAP" });
            expect(next).not.toHaveBeenCalled();
        });

        it("calls next on unexpected exception", async () => {
            req.body = {
                planDomainId: "plan-1",
                vvnId: "VVN-1",
                reasonForChange: "test",
                operations: [],
            };

            mockService.updatePlanForVvnAsync.mockRejectedValue(new Error("boom"));

            await controller.updateForVvn(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe("updateBatch", () => {
        it("returns 200 on success", async () => {
            req.body = {
                planDomainId: "plan-1",
                reasonForChange: "batch reason",
                author: "author@test.com",
                updates: [{ vvnId: "VVN-1", operations: [] }],
            };

            const payload = { plan: { domainId: "plan-1" }, warnings: [] };
            mockService.updatePlanBatchAsync.mockResolvedValue(ok(payload));

            await controller.updateBatch(req, res, next);

            expect(mockService.updatePlanBatchAsync).toHaveBeenCalledWith(req.body, "author@test.com");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(payload);
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 409 when service result isFailure", async () => {
            req.body = {
                planDomainId: "plan-1",
                reasonForChange: "batch reason",
                updates: [{ vvnId: "VVN-1", operations: [] }],
            };
            req.user = { name: "User Name" };

            mockService.updatePlanBatchAsync.mockResolvedValue(fail("CRANE_CAPACITY_EXCEEDED"));

            await controller.updateBatch(req, res, next);

            expect(mockService.updatePlanBatchAsync).toHaveBeenCalledWith(req.body, "User Name");
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: "CRANE_CAPACITY_EXCEEDED" });
        });

        it("calls next on unexpected exception", async () => {
            req.body = {
                planDomainId: "plan-1",
                reasonForChange: "batch reason",
                updates: [{ vvnId: "VVN-1", operations: [] }],
            };

            mockService.updatePlanBatchAsync.mockRejectedValue(new Error("boom"));

            await controller.updateBatch(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
