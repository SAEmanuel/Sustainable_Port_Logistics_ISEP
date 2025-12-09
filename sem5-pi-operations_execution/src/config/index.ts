import dotenv from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (!envFound) {
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {

    port: parseInt(process.env.PORT as string, 10) || 3000,

    /**
     * That long string from mlab
     */
    databaseURL: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/test",

    /**
     * Your secret sauce
     */
    jwtSecret: process.env.JWT_SECRET || "my sakdfho2390asjod$%jl)!sdjas0i secret",
    //todo ver depois o secret

    /**
     * Used by winston logger
     */
    logs: {
        level: process.env.LOG_LEVEL || 'info',
    },

    /**
     * API configs
     */
    api: {
        prefix: '/api',
    },

    controllers: {
        user: {
            name: "UserController",
            path: "../controllers/userController"
        }
    },

    repos: {
        user: {
            name: "UserRepo",
            path: "../repos/userRepo"
        }
    },

    services: {
        user: {
            name: "UserService",
            path: "../services/userService"
        }
    },
};