import { describe, it, beforeEach, expect, vi } from "vitest";

import UpdateVVEToCompletedController from "../../../../controllers/vve/updateVVEToCompletedController";
import { mockRes } from "../../../helpers/mockHttp";

import { VesselVisitExecutionCode } from "../../../../domain/vesselVisitExecution/vesselVisitExecutionCode";

vi.mock("../../../../domain/vesselVisitExecution/vesselVisitExecutionCode", () => {
  return {
    VesselVisitExecutionCode: {
      create: vi.fn(),
    },
  };
});

const mockService = {
  setCompletedAsync: vi.fn(),
};

let req: any;
let res: any;
let next: any;
let controller: UpdateVVEToCompletedController;

beforeEach(() => {
  vi.clearAllMocks();

  req = { params: {}, body: {} };
  res = mockRes();
  next = vi.fn();

  controller = new UpdateVVEToCompletedController(mockService as any);
});

describe("UpdateVVEToCompletedController.execute", () => {
  it("returns 200 and body when service succeeds", async () => {
    req.params.code = "VVE2026000006";
    req.body = {
      actualUnBerthTime: "2026-01-09T11:11:00.000Z",
      actualLeavePortTime: "2026-01-09T12:11:00.000Z",
      updaterEmail: "alexandre.moura.pinto.costa@gmail.com",
    };

    (VesselVisitExecutionCode.create as any).mockReturnValue("CODE_OBJ");

    mockService.setCompletedAsync.mockResolvedValue({
      isFailure: false,
      getValue: () => ({ status: "Completed" }),
    });

    await controller.execute(req, res, next);

    expect(VesselVisitExecutionCode.create).toHaveBeenCalledWith("VVE2026000006");

    expect(mockService.setCompletedAsync).toHaveBeenCalledTimes(1);
    const callArgs = mockService.setCompletedAsync.mock.calls[0];

    expect(callArgs[0]).toBe("CODE_OBJ");
    expect(callArgs[1]).toBeInstanceOf(Date);
    expect(callArgs[1].toISOString()).toBe("2026-01-09T11:11:00.000Z");
    expect(callArgs[2]).toBeInstanceOf(Date);
    expect(callArgs[2].toISOString()).toBe("2026-01-09T12:11:00.000Z");
    expect(callArgs[3]).toBe("alexandre.moura.pinto.costa@gmail.com");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "Completed" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when service returns failure", async () => {
    req.params.code = "VVE2026000006";
    req.body = {
      actualUnBerthTime: "2026-01-09T11:11:00.000Z",
      actualLeavePortTime: "2026-01-09T12:11:00.000Z",
      updaterEmail: "user@example.com",
    };

    (VesselVisitExecutionCode.create as any).mockReturnValue("CODE_OBJ");

    mockService.setCompletedAsync.mockResolvedValue({
      isFailure: true,
      errorValue: () => "Validation error",
    });

    await controller.execute(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Validation error" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next(e) when VesselVisitExecutionCode.create throws", async () => {
    req.params.code = "bad-code";
    req.body = {
      actualUnBerthTime: "2026-01-09T11:11:00.000Z",
      actualLeavePortTime: "2026-01-09T12:11:00.000Z",
      updaterEmail: "user@example.com",
    };

    (VesselVisitExecutionCode.create as any).mockImplementation(() => {
      throw new Error("Invalid code");
    });

    await controller.execute(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next(e) when service throws", async () => {
    req.params.code = "VVE2026000006";
    req.body = {
      actualUnBerthTime: "2026-01-09T11:11:00.000Z",
      actualLeavePortTime: "2026-01-09T12:11:00.000Z",
      updaterEmail: "user@example.com",
    };

    (VesselVisitExecutionCode.create as any).mockReturnValue("CODE_OBJ");

    mockService.setCompletedAsync.mockRejectedValue(new Error("DB crash"));

    await controller.execute(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
