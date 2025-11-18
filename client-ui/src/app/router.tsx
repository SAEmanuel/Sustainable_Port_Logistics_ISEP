import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Qualification from "../features/qualifications/pages/Qualification.tsx";
import StaffMember from "../features/staffMembers/pages/StaffMember.tsx";
import VesselsTypes from "../features/vesselsTypes/pages/VesselsTypes";
import Vessels from "../features/vessels/pages/Vessel";
import StorageArea from "../features/storageAreas/pages/storageAreaPage";
import StorageAreaCreate from "../features/storageAreas/pages/StorageAreaCreatePage.tsx";
import PortScene from "../features/viewer3d/pages/Viewer3DPage";
import PhysicalResource from "../features/physicalResource/pages/PhysicalResource";
import GenericDashboard from "../pages/GenericDashboard";
import VvnPage from "../features/vesselVisitNotification/pages/VvnListPage";
import VvnResponse from "../features/vesselVisitNotification/pages/VvnSubmittedAdminPage";
import NotFound from "../pages/NotFound";
import Forbidden from "../pages/Forbidden";
import PendingApproval from "../pages/PendingApproval.tsx";
import InactiveAccount from "../pages/InactiveAccount.tsx";
import { RequireAuth, RequireRole, RequireApproved } from "../hooks/useAuthGuard";
import { Roles } from "../app/types";
import User from "../features/users/pages/User.tsx";
import ActivateAccount from "../pages/ActivateAccount.tsx";
import DeletedAccount from "../pages/DeletedAccount.tsx";
import Dock from "../features/docks/pages/Dock";
import SAO from "../features/sao/pages/sao.tsx";
import SAR from "../features/sar/pages/sar.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <Home /> },

            {
                element: <RequireAuth />,
                children: [
                    { path: "activate", element: <ActivateAccount /> },

                    { path: "inactive", element: <InactiveAccount /> },

                    { path: "deleted", element: <DeletedAccount /> },

                    { path: "pending-approval", element: <PendingApproval /> },

                    {
                        element: <RequireApproved />,
                        children: [
                            { path: "dashboard", element: <GenericDashboard /> },
                            {
                                path: "3dSecene",
                                element: (<RequireRole roles={[Roles.Administrator, Roles.PortAuthorityOfficer, Roles.ShippingAgentRepresentative]}/>),
                                children: [{ index: true, element: <PortScene /> }],
                            },
                            {
                                path: "vvn",
                                element: (
                                    <RequireRole
                                        roles={[Roles.Administrator, Roles.ShippingAgentRepresentative, Roles.PortAuthorityOfficer]}
                                    />
                                ),
                                children: [{ index: true, element: <VvnPage /> }],
                            },
                            {
                                path: "responsevvn",
                                element: (
                                    <RequireRole
                                        roles={[Roles.PortAuthorityOfficer]}
                                    />
                                ),
                                children: [{ index: true, element: <VvnResponse /> }],
                            },
                            {
                                path: "qualifications",
                                element: <RequireRole roles={[Roles.LogisticsOperator]} />,
                                children: [{ index: true, element: <Qualification /> }],
                            },
                            {
                                path: "staff-members",
                                element: <RequireRole roles={[Roles.LogisticsOperator]} />,
                                children: [{ index: true, element: <StaffMember /> }],
                            },
                            {
                                path: "physical-resources",
                                element: <RequireRole roles={[Roles.LogisticsOperator]} />,
                                children: [{ index: true, element: <PhysicalResource /> }],
                            },
                            {
                                path: "storage-areas",
                                element: <RequireRole roles={[Roles.Administrator,Roles.PortAuthorityOfficer]} />,
                                children: [
                                    { index: true, element: <StorageArea /> },
                                    { path: "new", element: <StorageAreaCreate /> },
                                ],
                            },
                            {
                                path: "vessel-types",
                                element: <RequireRole roles={[Roles.Administrator, Roles.PortAuthorityOfficer]} />,
                                children: [{ index: true, element: <VesselsTypes /> }],
                            },
                            {
                                path: "vessels",
                                element: <RequireRole roles={[Roles.Administrator, Roles.PortAuthorityOfficer]} />,
                                children: [{ index: true, element: <Vessels /> }],
                            },
                            {
                                path: "users",
                                element: <RequireRole roles={[Roles.Administrator]} />,
                                children: [{ index: true, element: <User /> }],
                            },
                            {
                                path: "docks",
                                element: <RequireRole roles={[Roles.PortAuthorityOfficer]} />,
                                children: [{ index: true, element: <Dock /> }],
                            },
                            {
                                path: "sao",
                                element: <RequireRole roles={[Roles.PortAuthorityOfficer]} />,
                                children: [{ index: true, element: <SAO /> }],
                            },
                            {
                                path: "sar",
                                element: <RequireRole roles={[Roles.PortAuthorityOfficer]} />,
                                children: [{ index: true, element: <SAR /> }],
                            },
                            { path: "forbidden", element: <Forbidden /> },
                        ],
                    },
                ],
            },

            { path: "*", element: <NotFound /> },
        ],
    },
]);