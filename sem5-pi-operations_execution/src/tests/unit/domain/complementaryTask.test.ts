import { describe, it, expect } from "vitest";
import {ComplementaryTask} from "../../../domain/complementaryTask/complementaryTask";
import {CTStatus} from "../../../domain/complementaryTask/ctstatus";
import {BusinessRuleValidationError} from "../../../core/logic/BusinessRuleValidationError";
import {VesselVisitExecutionId} from "../../../domain/vesselVisitExecution/vesselVisitExecutionId";
import {ComplementaryTaskCategoryId} from "../../../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import {ComplementaryTaskCode} from "../../../domain/complementaryTask/ComplementaryTaskCode";



describe("ComplementaryTask Domain", () => {

    const baseProps = {
        code: ComplementaryTaskCode.create("CTC001", 1),
        category: ComplementaryTaskCategoryId.create("cat-1"),
        staff: "John Doe",
        timeStart: new Date("2025-01-01T10:00:00Z"),
        timeEnd: null,
        status: CTStatus.Scheduled,
        vve: VesselVisitExecutionId.create("vve-1"),
        createdAt: new Date(),
        updatedAt: null
    };

    it("should create a valid scheduled task", () => {
        const task = ComplementaryTask.create(baseProps);

        expect(task.status).toBe(CTStatus.Scheduled);
        expect(task.timeEnd).toBeNull();
    });

    it("should not allow creation with InProgress or Completed", () => {
        expect(() =>
            ComplementaryTask.create({ ...baseProps, status: CTStatus.InProgress })
        ).toThrow(BusinessRuleValidationError);

        expect(() =>
            ComplementaryTask.create({ ...baseProps, status: CTStatus.Completed })
        ).toThrow(BusinessRuleValidationError);
    });

    it("should not allow empty staff name", () => {
        expect(() =>
            ComplementaryTask.create({ ...baseProps, staff: " " })
        ).toThrow(BusinessRuleValidationError);
    });

    it("should transition from Scheduled → InProgress", () => {
        const task = ComplementaryTask.create(baseProps);

        const now = new Date("2025-01-01T10:05:00Z");

        task.changeStatus(CTStatus.InProgress, now);

        expect(task.status).toBe(CTStatus.InProgress);
    });

    it("should not allow InProgress before start time", () => {
        const task = ComplementaryTask.create(baseProps);

        const early = new Date("2024-12-31T10:00:00Z");

        expect(() => task.changeStatus(CTStatus.InProgress, early))
            .toThrow(BusinessRuleValidationError);
    });

    it("should complete task and set end time", () => {
        const task = ComplementaryTask.create(baseProps);

        const start = new Date("2025-01-01T10:10:00Z");
        task.changeStatus(CTStatus.InProgress, start);

        const end = new Date("2025-01-01T11:00:00Z");
        task.changeStatus(CTStatus.Completed, end);

        expect(task.status).toBe(CTStatus.Completed);
        expect(task.timeEnd).toEqual(end);
    });

    it("should not allow completing before start", () => {
        const task = ComplementaryTask.create(baseProps);

        task.changeStatus(CTStatus.InProgress, new Date("2025-01-01T10:10:00Z"));

        const invalidEnd = new Date("2025-01-01T09:00:00Z");

        expect(() => task.changeStatus(CTStatus.Completed, invalidEnd))
            .toThrow(BusinessRuleValidationError);
    });

    it("should not allow editing completed task", () => {
        const task = ComplementaryTask.create(baseProps);

        task.changeStatus(CTStatus.InProgress, new Date("2025-01-01T10:10:00Z"));
        task.changeStatus(CTStatus.Completed, new Date("2025-01-01T11:00:00Z"));

        expect(() =>
            task.changeDetails(
                baseProps.category,
                "Another User",
                new Date(),
                baseProps.vve
            )
        ).toThrow(BusinessRuleValidationError);
    });

});