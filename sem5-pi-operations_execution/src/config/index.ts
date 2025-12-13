import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "development";

const envPath = path.resolve(process.cwd(), `.env.${env}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`⚠️  Could not load ${envPath}. Falling back to .env`);
    dotenv.config();
}

console.log(`Loaded environment: ${env}`);
console.log(`Using env file: ${envPath}`);

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ Missing required environment variable: ${name}`);
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}

export default {
    port: parseInt(process.env.PORT || "3000", 10),

    databaseURL: required("MONGODB_URI"),

    logs: {
        level: process.env.LOG_LEVEL || "info",
    },

    api: {
        prefix: "/api",
    },

    controllers: {
        user: {
            name: "UserController",
            path: "../controllers/userController"
        },

        complementaryTaskCategory: {
            create: {
                name: "CreateComplementaryTaskCategoryController",
                path: "../controllers/complementaryTaskCategory/createComplementaryTaskCategoryController"
            },
            update: {
                name: "UpdateComplementaryTaskCategoryController",
                path: "../controllers/complementaryTaskCategory/updateComplementaryTaskCategoryController"
            },
            getByCode: {
                name: "GetCTCByCodeController",
                path: "../controllers/complementaryTaskCategory/getCTCByCodeController"
            },
            getByName: {
                name: "GetCTCByNameController",
                path: "../controllers/complementaryTaskCategory/getCTCByNameController"
            },
            getByDescription: {
                name: "GetCTCByDescriptionController",
                path: "../controllers/complementaryTaskCategory/getCTCByDescriptionController"
            },
            getByCategory: {
                name: "GetCTCByCategoryController",
                path: "../controllers/complementaryTaskCategory/getCTCByCategoryController"
            },
            activate: {
                name: "ActivateComplementaryTaskCategoryController",
                path: "../controllers/complementaryTaskCategory/activateComplementaryTaskCategoryController"
            },
            deactivate: {
                name: "DeactivateComplementaryTaskCategoryController",
                path: "../controllers/complementaryTaskCategory/deactivateComplementaryTaskCategoryController"
            }
        }
    },

    repos: {
        user: { name: "UserRepo", path: "../repos/userRepo" },
        complementaryTaskCategory: {
            name: "ComplementaryTaskCategoryRepo",
            path: "../repos/complementaryTaskCategoryRepo"
        }
    },

    services: {
        user: { name: "UserService", path: "../services/userService" },
        complementaryTaskCategory: {
            name: "ComplementaryTaskCategoryService",
            path: "../services/complementaryTaskCategoryService"
        }
    }
};