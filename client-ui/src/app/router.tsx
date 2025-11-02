import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import VesselsTypes from "../features/vesselsTypes/pages/VesselsTypes";
import Logout from "../pages/Logout"; 
import NotFound from "../pages/NotFound";
import Forbidden from "../pages/Forbidden";
import { RequireAuth, RequireRole, RequireGuest } from "../hooks/useAuthGuard";
import { Roles } from "../app/types";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <Home /> },

            {
                element: <RequireAuth />,
                children: [
                    { path: "vessel-types", element: <RequireRole roles={[Roles.Administrator]} />, children: [{index: true, element: <VesselsTypes />}]},
                    { path: "admin", element: <RequireRole roles={[Roles.Administrator]} />, children: [{ index: true, element: <div>Admin Dashboard</div> },],},
                    { path: "forbidden", element: <Forbidden/> },
                ],
            },

            { path: "*", element: <NotFound /> },
        ],
    },
    
    {path: "/login", element: (<RequireGuest><Login /></RequireGuest>),}, 
    {path: "/logout", element: <Logout /> },

]);
