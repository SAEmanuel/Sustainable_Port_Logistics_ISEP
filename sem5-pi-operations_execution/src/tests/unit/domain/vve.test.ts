import { describe, it, expect, vi, afterEach } from "vitest";
import { VesselVisitExecution } from "../../../domain/vesselVisitExecution/vesselVisitExecution";
import { VesselVisitExecutionCode } from "../../../domain/vesselVisitExecution/vesselVisitExecutionCode";
import { BusinessRuleValidationError } from "../../../core/logic/BusinessRuleValidationError";

describe("VesselVisitExecution Domain", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const makeValidProps = () => {
    const arrival = new Date(Date.now() - 60_000);
    const year = new Date().getFullYear();

    return {
      code: VesselVisitExecutionCode.create(`VVE${year}000001`),
      vvnId: "VVN-123",
      vesselImo: "IMO1234567",
      actualArrivalTime: arrival,
      creatorEmail: "creator@test.com",
      status: "In Progress",
    };
  };

  it("should create a valid VVE", () => {
    const vve = VesselVisitExecution.create(makeValidProps());

    expect(vve.code).toBeDefined();
    expect(vve.vvnId).toBe("VVN-123");
    expect(vve.vesselImo).toBe("IMO1234567");
    expect(vve.creatorEmail).toBe("creator@test.com");
    expect(vve.status).toBe("In Progress");
    expect(vve.auditLog).toEqual([]);
    expect(vve.executedOperations).toEqual([]);
  });

  it("should throw when required fields are missing", () => {
    const props = makeValidProps();
    (props as any).code = undefined;

    expect(() => VesselVisitExecution.create(props as any)).toThrow(
      BusinessRuleValidationError
    );
  });

  it("should throw when actualArrivalTime is in the future", () => {
    const props = makeValidProps();
    props.actualArrivalTime = new Date(Date.now() + 60_000);

    expect(() => VesselVisitExecution.create(props)).toThrow(
      BusinessRuleValidationError
    );
  });

  it("updateBerthAndDock should update values, set updatedAt and add auditLog entry", () => {
    vi.useFakeTimers();
    const now = new Date("2025-01-01T12:00:00.000Z");
    vi.setSystemTime(now);

    const vve = VesselVisitExecution.create(makeValidProps());

    const berthTime = new Date(vve.actualArrivalTime.getTime() + 5 * 60_000);
    vve.updateBerthAndDock(berthTime, "DOCK-1", "ops@test.com", "note");

    expect(vve.actualBerthTime?.toISOString()).toBe(berthTime.toISOString());
    expect(vve.actualDockId).toBe("DOCK-1");
    expect(vve.dockDiscrepancyNote).toBe("note");

    expect(vve.updatedAt?.toISOString()).toBe(now.toISOString());

    expect(vve.auditLog.length).toBe(1);
    expect(vve.auditLog[0].action).toBe("UPDATE_BERTH_DOCK");
    expect(vve.auditLog[0].by).toBe("ops@test.com");
    expect(new Date(vve.auditLog[0].at).toISOString()).toBe(now.toISOString());

    expect(vve.auditLog[0].changes.to.actualDockId).toBe("DOCK-1");
    expect(new Date(vve.auditLog[0].changes.to.actualBerthTime).toISOString()).toBe(
      berthTime.toISOString()
    );
  });

  it("updateBerthAndDock should throw if berthTime is before actualArrivalTime", () => {
    const vve = VesselVisitExecution.create(makeValidProps());
    const berthTime = new Date(vve.actualArrivalTime.getTime() - 60_000);

    expect(() =>
      vve.updateBerthAndDock(berthTime, "DOCK-1", "ops@test.com")
    ).toThrow(BusinessRuleValidationError);
  });

  it("updateExecutedOperations should throw if status is not 'In Progress'", () => {
    const vve = VesselVisitExecution.create(makeValidProps());
    (vve as any).props.status = "Completed";

    expect(() =>
      vve.updateExecutedOperations(
        [{ plannedOperationId: "op-1", actualStart: new Date() }],
        "operator@test.com"
      )
    ).toThrow(BusinessRuleValidationError);
  });

  it("updateExecutedOperations should throw if operations is empty", () => {
    const vve = VesselVisitExecution.create(makeValidProps());

    expect(() => vve.updateExecutedOperations([], "operator@test.com")).toThrow(
      BusinessRuleValidationError
    );
  });

  it("updateExecutedOperations should throw if plannedOperationId is missing", () => {
    const vve = VesselVisitExecution.create(makeValidProps());

    expect(() =>
      vve.updateExecutedOperations(
        [{ plannedOperationId: "" as any, actualStart: new Date() }],
        "operator@test.com"
      )
    ).toThrow(BusinessRuleValidationError);
  });

  it("updateExecutedOperations should upsert operations, set updatedAt and add auditLog entry", () => {
    vi.useFakeTimers();
    const now = new Date("2025-01-01T12:00:00.000Z");
    vi.setSystemTime(now);

    const vve = VesselVisitExecution.create(makeValidProps());

    const start = new Date("2025-01-01T10:00:00.000Z");
    const end = new Date("2025-01-01T10:30:00.000Z");

    vve.updateExecutedOperations(
      [
        { plannedOperationId: "op-1", actualStart: start },
        { plannedOperationId: "op-2", actualStart: start, actualEnd: end },
      ],
      "operator@test.com"
    );

    expect(vve.executedOperations.length).toBe(2);
    expect(vve.executedOperations.find((o) => o.plannedOperationId === "op-1")?.status).toBe(
      "started"
    );
    expect(vve.executedOperations.find((o) => o.plannedOperationId === "op-2")?.status).toBe(
      "completed"
    );

    expect(vve.updatedAt?.toISOString()).toBe(now.toISOString());

    const lastLog = vve.auditLog[vve.auditLog.length - 1];
    expect(lastLog.action).toBe("UPDATE_EXECUTED_OPERATIONS");
    expect(lastLog.by).toBe("operator@test.com");
    expect(new Date(lastLog.at).toISOString()).toBe(now.toISOString());
  });

  it("setCompleted should throw if status is not 'In Progress'", () => {
    const vve = VesselVisitExecution.create(makeValidProps());
    (vve as any).props.status = "Completed";

    expect(() =>
      vve.setCompleted(
        new Date("2025-01-01T10:00:00.000Z"),
        new Date("2025-01-01T11:00:00.000Z"),
        "ops@test.com"
      )
    ).toThrow(BusinessRuleValidationError);
  });

  it("setCompleted should throw if actualLeavePortTime is before actualUnBerthTime", () => {
    const vve = VesselVisitExecution.create(makeValidProps());

    expect(() =>
      vve.setCompleted(
        new Date("2025-01-01T11:00:00.000Z"),
        new Date("2025-01-01T10:00:00.000Z"),
        "ops@test.com"
      )
    ).toThrow(BusinessRuleValidationError);
  });

  it("setCompleted should set status to 'Completed', set dates, set updatedAt and add auditLog entry", () => {
    vi.useFakeTimers();
    const now = new Date("2025-01-01T12:00:00.000Z");
    vi.setSystemTime(now);

    const vve = VesselVisitExecution.create(makeValidProps());

    const unberth = new Date("2025-01-01T10:00:00.000Z");
    const leave = new Date("2025-01-01T11:00:00.000Z");

    vve.setCompleted(unberth, leave, "ops@test.com");

    expect(vve.status).toBe("Completed");
    expect(vve.actualUnBerthTime?.toISOString()).toBe(unberth.toISOString());
    expect(vve.actualLeavePortTime?.toISOString()).toBe(leave.toISOString());
    expect(vve.updatedAt?.toISOString()).toBe(now.toISOString());

    const lastLog = vve.auditLog[vve.auditLog.length - 1];
    expect(lastLog.action).toBe("SET_COMPLETED");
    expect(lastLog.by).toBe("ops@test.com");
    expect(new Date(lastLog.at).toISOString()).toBe(now.toISOString());

    expect(new Date(lastLog.changes.to.actualUnBerthTime).toISOString()).toBe(
      unberth.toISOString()
    );
    expect(new Date(lastLog.changes.to.actualLeavePortTime).toISOString()).toBe(
      leave.toISOString()
    );
    expect(lastLog.changes.to.status).toBe("Completed");
  });

  it("areAllExecutedOperationsCompleted should return false when there are no operations", () => {
    const vve = VesselVisitExecution.create(makeValidProps());
    expect(vve.areAllExecutedOperationsCompleted()).toBe(false);
  });

  it("areAllExecutedOperationsCompleted should return true only if all are completed", () => {
    const vve = VesselVisitExecution.create(makeValidProps());

    vve.updateExecutedOperations(
      [
        { plannedOperationId: "op-1", actualStart: new Date(), actualEnd: new Date() }, // completed
        { plannedOperationId: "op-2", actualStart: new Date(), actualEnd: new Date() }, // completed
      ],
      "operator@test.com"
    );

    expect(vve.areAllExecutedOperationsCompleted()).toBe(true);

    // now make one started
    vve.updateExecutedOperations(
      [{ plannedOperationId: "op-2", actualStart: new Date() }], // no end -> started
      "operator@test.com"
    );

    expect(vve.areAllExecutedOperationsCompleted()).toBe(false);
  });
});
