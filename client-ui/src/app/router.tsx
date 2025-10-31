import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { RequireAuth, RequireRole } from "../hooks/useAuthGuard";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <Home /> },

            // Rotas protegidas (auth)
            {
                element: <RequireAuth />,
                children: [
                    // exemplo de rota por role
                    {
                        path: "admin",
                        element: <RequireRole roles={["Admin", "Manager"]} />,
                        children: [
                            { index: true, element: <div>Admin Dashboard</div> },
                        ],
                    },
                    { path: "forbidden", element: <div>Acesso negado</div> },
                ],
            },

            { path: "*", element: <NotFound /> },
        ],
    },
    { path: "/login", element: <Login /> },
]);
