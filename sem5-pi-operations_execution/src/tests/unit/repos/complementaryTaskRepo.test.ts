import { describe, it, expect, beforeAll, afterEach } from "vitest";
import mongoose, { Document, Model } from "mongoose";

import ComplementaryTaskRepo from "../../../repos/complementaryTaskRepo";
import ComplementaryTaskMap from "../../../mappers/ComplementaryTaskMap";

import { ComplementaryTask } from "../../../domain/complementaryTask/complementaryTask";
import { ComplementaryTaskCode } from "../../../domain/complementaryTask/ComplementaryTaskCode";
import { ComplementaryTaskCategoryId } from "../../../domain/complementaryTaskCategory/complementaryTaskCategoryId";
import { VesselVisitExecutionId } from "../../../domain/vesselVisitExecution/vesselVisitExecutionId";
import { CTStatus } from "../../../domain/complementaryTask/ctstatus";

import { IComplementaryTaskPersistence } from "../../../dataschema/IComplementaryTaskPersistence";

describe("ComplementaryTaskRepo", () => {

    let repo: ComplementaryTaskRepo;
    let schema: Model<IComplementaryTaskPersistence & Document>;

    beforeAll(async () => {

        schema = mongoose.model<IComplementaryTaskPersistence & Document>(
            "ComplementaryTask_Test",
            new mongoose.Schema({
                domainId: String,
                code: String,
                category: String,
                staff: String,
                timeStart: Date,
                timeEnd: Date,
                status: String,
                vve: String,
                createdAt: Date,
                updatedAt: Date
            })
        );

        repo = new ComplementaryTaskRepo(
            schema,
            new ComplementaryTaskMap(),
            console
        );
    });


    afterEach(async () => {
        await schema.deleteMany({});
    });


    function makeTask({
                          code = "CTC001[1]",
                          category = ComplementaryTaskCategoryId.create(
                              new mongoose.Types.ObjectId().toString()
                          ),
                          staff = "Test Staff",
                          start = new Date(),
                          vve = VesselVisitExecutionId.create(
                              new mongoose.Types.ObjectId().toString()
                          )
                      } = {}) {

        return ComplementaryTask.create({
            code: ComplementaryTaskCode.createFromString(code),
            category,
            staff,
            status: CTStatus.Scheduled,
            timeStart: start,
            timeEnd: null,
            vve,
            createdAt: new Date(),
            updatedAt: null
        });
    }

    it("should save and retrieve a ComplementaryTask", async () => {

        const task = makeTask();
        await repo.save(task);

        const found = await repo.findByCode(task.code);

        expect(found).not.toBeNull();
        expect(found?.code.value).toBe(task.code.value);
    });

    it("should update an existing record instead of duplicating", async () => {

        const task = makeTask();
        await repo.save(task);

        task.changeDetails(
            task.category,
            "New Staff Member",
            task.timeStart,
            task.vve
        );

        await repo.save(task);

        const all = await repo.findAll();

        expect(all.length).toBe(1);
        expect(all[0].staff).toBe("New Staff Member");
    });

    it("should find by category", async () => {

        const task = makeTask();
        await repo.save(task);

        const results = await repo.findByCategory(task.category);

        expect(results.length).toBe(1);
    });

    it("should find by staff", async () => {

        const task = makeTask({ staff: "John Worker" });
        await repo.save(task);

        const results = await repo.findByStaff("John Worker");

        expect(results.length).toBe(1);
    });

    it("should return scheduled tasks", async () => {

        const task = makeTask();
        await repo.save(task);

        const results = await repo.findScheduled();

        expect(results.length).toBe(1);
    });

    it("should return tasks in range", async () => {

        const task = makeTask({
            start: new Date("2025-01-10T10:00:00Z")
        });

        await repo.save(task);

        const results = await repo.findInRange(
            new Date("2025-01-01"),
            new Date("2025-01-31")
        );

        expect(results.length).toBe(1);
    });

    it("should compute next sequence number", async () => {

        const task1 = makeTask();
        const task2 = makeTask();

        await repo.save(task1);
        await repo.save(task2);

        const next = await repo.getNextSequenceNumber();

        expect(next).toBe(3);
    });

});