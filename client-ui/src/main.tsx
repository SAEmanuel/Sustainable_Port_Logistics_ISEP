import React, {useEffect} from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {Auth0Provider} from "@auth0/auth0-react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { useAppStore } from "./app/store";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalsProvider } from "@mantine/modals"


const domain = import.meta.env.VITE_AUTH0_DOMAIN!;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID!;
const queryClient = new QueryClient();

function MantineThemeWrapper({ children }: { children: React.ReactNode }) {
    const theme = useAppStore((state) => state.theme);

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }, [theme]);

    return (
        <MantineProvider forceColorScheme={theme}>
            <ModalsProvider>{children}</ModalsProvider>
        </MantineProvider>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <Auth0Provider
                domain={domain}
                clientId={clientId}
                authorizationParams={{
                    redirect_uri: `${window.location.origin}`,
                }}
                cacheLocation="localstorage"
            >
                <QueryClientProvider client={queryClient}>
                    {}
                    <MantineThemeWrapper>
                        <App />
                    </MantineThemeWrapper>
                </QueryClientProvider>
            </Auth0Provider>
        </I18nextProvider>
    </React.StrictMode>
);