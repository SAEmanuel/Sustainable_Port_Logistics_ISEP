import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Qualification from "../features/qualifications/pages/Qualification.tsx";
import StaffMember from "../features/staffMembers/pages/StaffMember.tsx";
import Logout from "../pages/Logout";
import VesselsTypes from "../features/vesselsTypes/pages/VesselsTypes";
import Vessels from "../features/vessels/pages/Vessel";
import StorageArea from "../features/storageAreas/pages/storageAreaPage";
import StorageAreaCreate from "../features/storageAreas/pages/StorageAreaCreatePage.tsx";
import PhysicalResource from "../features/physicalResource/pages/PhysicalResource";
import GenericDashboard from "../pages/GenericDashboard"
import VvnPage from "../features/vesselVisitNotification/pages/VvnListPage"
import Viewer3DPage from "../features/viewer3d/pages/Viewer3DPage";
import NotFound from "../pages/NotFound";
import Forbidden from "../pages/Forbidden";
import { RequireAuth, RequireRole, RequireGuest } from "../hooks/useAuthGuard";
import { Roles } from "../app/types";
//import LogisticsOperatorDashboard from "../pages/LogisticsOperatorDashboard";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <Home /> },

            {
                element: <RequireAuth />,
                children: [
                    { path: "dashboard", element: <RequireRole roles={[Roles.LogisticsOperator,Roles.ShippingAgentRepresentative,Roles.PortAuthorityOfficer]} />, children: [{ index: true, element: <GenericDashboard /> }]},
                    {path: "viewer", element: (<RequireRole roles={[Roles.Administrator, Roles.PortAuthorityOfficer, Roles.LogisticsOperator]} />), children: [{ index: true, element: <Viewer3DPage /> }],},
                    { path: "vvn", element: <RequireRole roles={[Roles.Administrator, Roles.ShippingAgentRepresentative]} />, children: [{ index: true, element: <VvnPage /> }]},
                    { path: "qualifications", element: <RequireRole roles={[Roles.LogisticsOperator]} />, children: [{ index: true, element: <Qualification /> }]},
                    { path: "staff-members", element: <RequireRole roles={[Roles.LogisticsOperator]} />, children: [{ index: true, element: <StaffMember /> }]},
                    { path: "physical-resources", element: <RequireRole roles={[Roles.LogisticsOperator]} />, children: [{ index: true, element: <PhysicalResource/> }]},
                    { path: "storage-areas", element: <RequireRole roles={[Roles.Administrator]} />, children: [{index: true, element: <StorageArea />}, {path: "new", element: <StorageAreaCreate />}]},
                    { path: "vessel-types", element: <RequireRole roles={[Roles.Administrator]} />, children: [{index: true, element: <VesselsTypes />}]},
                    { path: "vessels", element: <RequireRole roles={[Roles.Administrator]} />, children: [{index: true, element: <Vessels />}]},
                    { path: "admin", element: <RequireRole roles={[Roles.Administrator]} />, children: [{ index: true, element: <div>Admin Dashboard</div> },],},
                    { path: "forbidden", element: <Forbidden/> },
                ],
            },
            { path: "*", element: <NotFound /> },
        ],
    },

    { path: "/login", element: (<RequireGuest><Login /></RequireGuest>) },
    { path: "/logout", element: <Logout /> },
]);