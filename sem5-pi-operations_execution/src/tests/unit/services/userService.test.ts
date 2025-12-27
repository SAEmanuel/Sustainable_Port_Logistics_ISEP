import { describe, it, expect, vi, beforeEach } from "vitest";
import UserService from "../../../services/userService";
import { Role } from "../../../domain/user/role";



const mockRepo = {
    findByEmail: vi.fn(),
    save: vi.fn()
};

const mockMapper = {
    toDTO: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
};

let service: UserService;

beforeEach(() => {
    vi.clearAllMocks();

    service = new UserService(
        mockRepo as any,
        mockMapper as any,
        mockLogger as any
    );
});


const fakeUser: any = {
    name: "John Doe",
    email: "john@test.com",
    role: Role.Administrator,
    auth0UserId: "auth0|123",
    isActive: true,
    isEliminated: false
};

// =======================
// CREATE USER
// =======================

describe("UserService - createUser", () => {

    it("should create a new user", async () => {

        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.save.mockResolvedValue(fakeUser);
        mockMapper.toDTO.mockReturnValue({ email: "john@test.com" });

        const result = await service.createUser({
            ...fakeUser
        });

        expect(result.isSuccess).toBeTruthy;
        expect(mockRepo.save).toHaveBeenCalled();
    });


    it("should fail if user already exists", async () => {

        mockRepo.findByEmail.mockResolvedValue(fakeUser);

        const result = await service.createUser(fakeUser);

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe("User already exists.");
    });


    it("should fail if repository save returns null", async () => {

        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.save.mockResolvedValue(null);

        const result = await service.createUser(fakeUser);

        expect(result.isFailure).toBe(true);
    });


    it("should return failure on unexpected error", async () => {

        mockRepo.findByEmail.mockRejectedValue(new Error("DB error"));

        const result = await service.createUser(fakeUser);

        expect(result.isFailure).toBe(true);
    });

});


// =======================
// UPDATE USER
// =======================

describe("UserService - updateUser", () => {

    it("should update an existing user", async () => {

        mockRepo.findByEmail.mockResolvedValue(fakeUser);
        mockRepo.save.mockResolvedValue(fakeUser);
        mockMapper.toDTO.mockReturnValue({ email: "john@test.com" });

        const result = await service.updateUser(fakeUser);

        expect(result.isSuccess).toBe(true);
        expect(mockRepo.save).toHaveBeenCalled();
    });


    it("should fail if user does not exist", async () => {

        mockRepo.findByEmail.mockResolvedValue(null);

        const result = await service.updateUser(fakeUser);

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe("User not found.");
    });


    it("should fail if repo update returns null", async () => {

        mockRepo.findByEmail.mockResolvedValue(fakeUser);
        mockRepo.save.mockResolvedValue(null);

        const result = await service.updateUser(fakeUser);

        expect(result.isFailure).toBe(true);
    });

});


// =======================
// GET USER
// =======================

describe("UserService - getUser", () => {

    it("should return user DTO", async () => {

        mockRepo.findByEmail.mockResolvedValue(fakeUser);
        mockMapper.toDTO.mockReturnValue({ email: "john@test.com" });

        const result = await service.getUser("john@test.com");

        expect(result.isSuccess).toBe(true);
    });


    it("should fail if user not found", async () => {

        mockRepo.findByEmail.mockResolvedValue(null);

        const result = await service.getUser("notfound@test.com");

        expect(result.isFailure).toBe(true);
    });

});


// =======================
// GET ROLE
// =======================

describe("UserService - getRole", () => {

    it("should return user role", async () => {

        mockRepo.findByEmail.mockResolvedValue(fakeUser);

        const result = await service.getRole("john@test.com");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe(Role.Administrator);
    });


    it("should fail if user not found", async () => {

        mockRepo.findByEmail.mockResolvedValue(null);

        const result = await service.getRole("ghost@test.com");

        expect(result.isFailure).toBe(true);
    });

});