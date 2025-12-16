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


    operationsApiUrl: process.env.OPERATIONS_URL || "",
    planningApiUrl: process.env.PLANNING_URL || "",
    webApiUrl: process.env.WEBAPI_URL || "",

    controllers: {
        user: {
            name: "UserController",
            path: "../controllers/userController"
        },

        incidentType: {
            create:{
                name: "CreatedITController",
                path: "../controllers/incidentType/createdITController"
            },
            update:{
                name: "UpdateITController",
                path: "../controllers/incidentType/updateITController"
            },
            getByCode:{
                name: "GetITByCodeController",
                path: "../controllers/incidentType/getITByCodeController"
            },
            getByName: {
                name: "GetITByNameController",
                path: "../controllers/incidentType/getITByNameController"
            },
            getDirectChilds:{
                name: "GetITDirectChildController",
                path: "../controllers/incidentType/getITDirectChildController"
            },
            getRoot : {
                name: "GetITRootController",
                path: "../controllers/incidentType/getITRootController"
            },
            getSubTree:{
                name: "GetITSubTreeController",
                path: "../controllers/incidentType/getITSubTreeController"
            }
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
            getAll: {
                name: "GetAllComplementaryTaskCategoryController",
                path: "../controllers/complementaryTaskCategory/getAllComplementaryTaskCategoryController"
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
        },

        complementaryTask : {
            create : {
                name : "CreateCTController",
                path : "../controllers/complementaryTask/createCTController",
            },
            update : {
                name : "UpdateCTController",
                path : "../controllers/complementaryTask/updateCTController",
            },
            getAll : {
                name : "GetAllCTController",
                path : "../controllers/complementaryTask/getAllCTController",
            },
            getCompleted : {
                name : "GetCompletedCTController",
                path : "../controllers/complementaryTask/getCompletedCTController",
            },
            getByCategory: {
                name : "GetCTByCategoryController",
                path : "../controllers/complementaryTask/getCTByCategoryController",
            },
            getByCode: {
                name : "GetCTByCodeController",
                path : "../controllers/complementaryTask/getCTByCodeController",
            },
            getByStaff: {
                name : "GetCTByStaffController",
                path : "../controllers/complementaryTask/getCTByStaffController",
            },
            getByVve: {
                name : "GetCTByVveController",
                path : "../controllers/complementaryTask/getCTByVveController",
            },
            getInProgress: {
                name : "GetInProgressCtController",
                path : "../controllers/complementaryTask/getInProgressCtController",
            },
            getInRange: {
                name : "GetInRangeCTController",
                path : "../controllers/complementaryTask/getInRangeCTController",
            },
            getScheduled: {
                name : "GetScheduledCTController",
                path : "../controllers/complementaryTask/getScheduledCTController",
            },

        }
    },

    repos: {
        user: { name: "UserRepo", path: "../repos/userRepo" },
        complementaryTaskCategory: {
            name: "ComplementaryTaskCategoryRepo",
            path: "../repos/complementaryTaskCategoryRepo"
        },
        incidentType: {
            name: "IncidentTypeRepo",
            path: "../repos/incidentTypeRepo"
        },
        complementaryTask : {
            name: "ComplementaryTaskRepo",
            path : "../repos/complementaryTaskRepo"
        }
    },

    services: {
        user: { name: "UserService", path: "../services/userService" },
        complementaryTaskCategory: {
            name: "ComplementaryTaskCategoryService",
            path: "../services/complementaryTaskCategoryService"
        },
        incidentType: {
            name: "IncidentTypeService",
            path: "../services/incidentTypeService"
        },
        complementaryTask : {
            name: "ComplementaryTaskService",
            path : "../services/complementaryTaskService"
        }
    }
};