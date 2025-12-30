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
            status: "In Progress"
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
    });

    it("should force status to 'In Progress' even if provided differently", () => {
        const props = makeValidProps();
        props.status = "Completed";

        const vve = VesselVisitExecution.create(props);

        expect(vve.status).toBe("In Progress");
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

    it("updateBerthAndDock should throw if status is not 'In Progress'", () => {
        const vve = VesselVisitExecution.create(makeValidProps());
        (vve as any).props.status = "Completed";

        const berthTime = new Date(vve.actualArrivalTime.getTime() + 60_000);

        expect(() =>
            vve.updateBerthAndDock(berthTime, "DOCK-1", "ops@test.com")
        ).toThrow(BusinessRuleValidationError);
    });

    it("updateBerthAndDock should throw if berthTime is before actualArrivalTime", () => {
        const vve = VesselVisitExecution.create(makeValidProps());
        const berthTime = new Date(vve.actualArrivalTime.getTime() - 60_000);

        expect(() =>
            vve.updateBerthAndDock(berthTime, "DOCK-1", "ops@test.com")
        ).toThrow(BusinessRuleValidationError);
    });
});
