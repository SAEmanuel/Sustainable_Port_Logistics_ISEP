import { beforeAll, beforeEach, afterAll } from "vitest";
import { connectInMemoryMongo, clearDatabase, closeDatabase } from "./mongo";

beforeAll(async () => {
    await connectInMemoryMongo();
});

beforeEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await closeDatabase();
});