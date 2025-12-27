import { describe, it, expect } from "vitest";
import { User } from "../../../domain/user/user";
import { Role, RoleFactory } from "../../../domain/user/role";


describe("User Domain", () => {

    const validProps = {
        auth0UserId: "auth0|123",
        email: "john.doe@example.com",
        name: "John Doe",
        role: Role.Administrator,
        isActive: true,
        isEliminated: false
    };

    it("should create a valid User", () => {
        const result = User.create(validProps);

        expect(result.isSuccess).toBe(true);

        const user = result.getValue();
        expect(user.email).toBe(validProps.email);
        expect(user.role).toBe(Role.Administrator);
        expect(user.isActive).toBe(true);
    });

    it("should fail when required fields are missing", () => {
        const result = User.create({
            ...validProps,
            name: undefined as unknown as string
        });

        expect(result.isFailure).toBe(true);
    });

    it("should allow updating name via setter", () => {
        const result = User.create(validProps);
        const user = result.getValue();

        user.name = "Jane Doe";

        expect(user.name).toBe("Jane Doe");
    });

    it("should allow changing role", () => {
        const result = User.create(validProps);
        const user = result.getValue();

        user.role = Role.ProjectManager;

        expect(user.role).toBe(Role.ProjectManager);
    });

    it("should toggle active state", () => {
        const result = User.create(validProps);
        const user = result.getValue();

        user.isActive = false;

        expect(user.isActive).toBe(false);
    });

    it("should toggle elimination state", () => {
        const result = User.create(validProps);
        const user = result.getValue();

        user.isEliminated = true;

        expect(user.isEliminated).toBe(true);
    });

    it("should parse valid roles using RoleFactory", () => {
        const role = RoleFactory.fromString("ProjectManager");
        expect(role).toBe(Role.ProjectManager);
    });

    it("should reject invalid roles in RoleFactory", () => {
        expect(() => RoleFactory.fromString("DogTrainer")).toThrow();
    });

});