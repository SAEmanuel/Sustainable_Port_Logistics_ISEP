import axios from "axios";
import { notifyError } from "../utils/notify";
import { router } from "../app/router";

function extractApiError(error: any): string {
    const data = error?.response?.data;

    if (!error?.response)
        return "Servidor indisponível. Verifique a ligação.";

    if (data && typeof data === "object") {
        if (data.detail) return data.detail;
        if (data.title) return data.title;
        if (data.message) return data.message;
    }

    if (typeof data === "string") return data;

    return error?.message || "Erro inesperado.";
}


function buildClient(baseURL: string) {
    const client = axios.create({
        baseURL,
        timeout: 20000,
        headers: { "Content-Type": "application/json" },
    });

    client.interceptors.request.use((config) => {
        const token = localStorage.getItem("access_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    client.interceptors.response.use(
        (res) => res,
        (error) => {
            const status = error?.response?.status;
            const rawData = error?.response?.data;
            const message = extractApiError(error);

            switch (status) {
                case 400:
                    notifyError(message || "Pedido inválido.");
                    break;

                case 401:
                    notifyError("Sessão expirada.");
                    localStorage.removeItem("access_token");
                    window.dispatchEvent(new Event("sessionExpired"));
                    break;

                case 403: {
                    const isNetworkRestriction = typeof rawData === "string";

                    notifyError(
                        isNetworkRestriction
                            ? "Acesso restrito à rede interna."
                            : message || "Acesso negado."
                    );
                    router.navigate("/forbidden");
                    break;
                }

                case 404:
                    notifyError(message || "Recurso não encontrado.");
                    break;

                case 500:
                    notifyError("Erro interno.");
                    break;

                default:
                    notifyError(message);
            }

            return Promise.reject(error);
        }
    );

    return client;
}



const PLANNING_URL = import.meta.env.VITE_PLANNING_URL;
const WEBAPI_URL = import.meta.env.VITE_WEBAPI_URL;
const OPERATIONS_URL = import.meta.env.VITE_OPERATIONS_URL;

export const planningApi = buildClient(PLANNING_URL);
export const webApi = buildClient(WEBAPI_URL);
export const operationsApi = buildClient(OPERATIONS_URL)