import { useAuth0 } from "@auth0/auth0-react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./styles/globals.css";

import LoginButton from "./components/LoginButton";
import SyncUser from "./components/SyncUser";

import { Toaster } from "react-hot-toast";

export default function App() {
    const { isLoading, error, isAuthenticated } = useAuth0();

    if (isLoading) return <p style={{ textAlign: "center" }}>Loading...</p>;
    if (error) return <p style={{ color: "red", textAlign: "center" }}>Authentication Error</p>;

    if (!isAuthenticated) {
        return (
            <main style={{ textAlign: "center", marginTop: "3rem" }}>
                <h1>Auth0 Login</h1>
                <LoginButton />
                <Toaster position="top-right" toastOptions={{ style: { zIndex: 2147483647 } }} />
            </main>
        );
    }

    return (
        <>
            <SyncUser />
            <RouterProvider router={router} />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: { zIndex: 2147483647 }, // acima de qualquer overlay
                }}
            />
        </>
    );
}
