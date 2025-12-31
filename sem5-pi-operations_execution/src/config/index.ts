import dotenv from "dotenv";
import path from "path";
import GetAllITController from "../controllers/incidentType/getAllITController";

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
            create: {
                name: "CreatedITController",
                path: "../controllers/incidentType/createdITController"
            },
            remove: {
                name: "RemoveIncidentTypeController",
                path: "../controllers/incidentType/removeIncidentTypeController"
            },
            getAll: {
                name: "GetAllITController",
                path: "../controllers/incidentType/getAllITController"
            },
            update: {
                name: "UpdateITController",
                path: "../controllers/incidentType/updateITController"
            },
            getByCode: {
                name: "GetITByCodeController",
                path: "../controllers/incidentType/getITByCodeController"
            },
            getByName: {
                name: "GetITByNameController",
                path: "../controllers/incidentType/getITByNameController"
            },
            getDirectChilds: {
                name: "GetITDirectChildController",
                path: "../controllers/incidentType/getITDirectChildController"
            },
            getRoot: {
                name: "GetITRootController",
                path: "../controllers/incidentType/getITRootController"
            },
            getSubTree: {
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
            getById: {
                name: "GetCTCByIdController",
                path: "../controllers/complementaryTaskCategory/getCTCByIdController"
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

        complementaryTask: {
            create: {
                name: "CreateCTController",
                path: "../controllers/complementaryTask/createCTController",
            },
            update: {
                name: "UpdateCTController",
                path: "../controllers/complementaryTask/updateCTController",
            },
            updateStatus: {
                name: "ChangeCTController",
                path: "../controllers/complementaryTask/changeCTController",
            },
            getAll: {
                name: "GetAllCTController",
                path: "../controllers/complementaryTask/getAllCTController",
            },
            getCompleted: {
                name: "GetCompletedCTController",
                path: "../controllers/complementaryTask/getCompletedCTController",
            },
            getByCategory: {
                name: "GetCTByCategoryController",
                path: "../controllers/complementaryTask/getCTByCategoryController",
            },
            getByCategoryCode: {
                name: "GetCTByCategoryCodeController",
                path: "../controllers/complementaryTask/getCTByCategoryCodeController",
            },
            getByCode: {
                name: "GetCTByCodeController",
                path: "../controllers/complementaryTask/getCTByCodeController",
            },
            getByStaff: {
                name: "GetCTByStaffController",
                path: "../controllers/complementaryTask/getCTByStaffController",
            },
            getByVve: {
                name: "GetCTByVveController",
                path: "../controllers/complementaryTask/getCTByVveController",
            },
            getByVveCode: {
                name: "GetCTByVveCodeController",
                path: "../controllers/complementaryTask/getCTByVveCodeController",
            },
            getInProgress: {
                name: "GetInProgressCtController",
                path: "../controllers/complementaryTask/getInProgressCTController",
            },
            getInRange: {
                name: "GetInRangeCTController",
                path: "../controllers/complementaryTask/getInRangeCTController",
            },
            getScheduled: {
                name: "GetScheduledCTController",
                path: "../controllers/complementaryTask/getScheduledCTController",
            },

        },
        incident: {
            create: {
                name: "CreateIncidentController",
                path: "../controllers/incident/createIncidentController",
            },

            updateVEEList: {
                name : "UpdateListsVVEsController",
                path : "../controllers/incident/updateListsVVEsController",
            },

            update: {
                name: "UpdateIncidentController",
                path: "../controllers/incident/updateIncidentController",
            },

            delete: {
                name: "DeleteIncidentController",
                path: "../controllers/incident/deleteIncidentController",
            },

            getAll: {
                name: "GetAllIncidentsController",
                path: "../controllers/incident/getAllIncidentsController",
            },

            getByCode: {
                name: "GetIncidentByCodeController",
                path: "../controllers/incident/getIncidentByCodeController",
            },

            getActive: {
                name: "GetActiveIncidentsController",
                path: "../controllers/incident/getActiveIncidentsController",
            },

            getResolved: {
                name: "GetResolvedIncidentsController",
                path: "../controllers/incident/getResolvedIncidentsController",
            },

            getByDateRange: {
                name: "GetIncidentsByDataRangeController",
                path: "../controllers/incident/getIncidentsByDataRangeController",
            },

            getBySeverity: {
                name: "GetIncidentsBySeverityController",
                path: "../controllers/incident/getIncidentsBySeverityController",
            },

            getByVVE: {
                name: "GetIncidentsByVVEController",
                path: "../controllers/incident/getIncidentsByVVEController",
            },

            addVVE: {
                name: "AddVVEToIncidentController",
                path: "../controllers/incident/addVVEToIncidentController",
            },

            removeVVE: {
                name: "RemoveVVEFromIncidentController",
                path: "../controllers/incident/removeVVEFromIncidentController",
            },

            markResolved: {
                name: "MarkIncidentResolvedController",
                path: "../controllers/incident/markIncidentResolvedController",
            }
        },

        vesselVisitExecution: {
            create: {
                name: "createVVEController",
                path: "../controllers/vve/createVVEController",
            },

            getAll: {
                name: "getAllVVEController",
                path: "../controllers/vve/getAllVVEController",
            },
            getById: {
                name: "GetVVEByIdController",
                path: "../controllers/vve/getVVEByIdController",
            },
            getByCode: {
                name: "GetVVEByCodeController",
                path: "../controllers/vve/getVVEByCodeController",
            },
            getByImo: {
                name: "GetVVEByImoController",
                path: "../controllers/vve/getVVEByImoController",
            },
            getInRange: {
                name: "GetVVEInRangeController",
                path: "../controllers/vve/getVVEInRangeController",
            },
            update: {
                name: "OperationPlanUpdateController",
                path: "../controllers/operationPlan/operationPlanUpdateController",
            },
            updateBerthDock: {
                name: "UpdateVVEActualBerthAndDockController",
                path: "../controllers/vve/updateVVEActualBerthAndDockController",
            },
        },

        operationPlan: {
            create: {
                name: "CreateOperationPlanController",
                path: "../controllers/operationPlan/createOperationPlanController",
            },
            list: {
                name: "GetOperationPlansController",
                path: "../controllers/operationPlan/getOperationPlansController",
            },
            update: {
                name: "OperationPlanUpdateController",
                path: "../controllers/operationPlan/operationPlanUpdateController",
            },
        },

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
        },
        VesselVisitExecution: {
            name: "VesselVisitExecutionRepo",
            path: "../repos/vesselVisitExecutionRepo"
        },
        incident: {
            name: "incidentRepo",
            path: "../repos/incidentRepo",
        },
        operationPlan: { name: "OperationPlanRepo", path: "../repos/operationPlanRepo" },

        operationPlanChangeLog: {
            name: "OperationPlanChangeLogRepo",
            path: "../repos/operationPlanChangeLogRepo"
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
        },
        VesselVisitExecution: {
            name: "VesselVisitExecutionService",
            path: "../services/vesselVisitExecutionService"
        },
        incident: {
            name: "IncidentService",
            path: "../services/incidentService"
        },
        operationPlan: {
            name: "OperationPlanService",
            path: "../services/operationPlanService" }
    }
};