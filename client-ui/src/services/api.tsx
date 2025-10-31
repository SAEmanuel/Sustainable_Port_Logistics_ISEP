import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // vem do .env
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            // opcional: redirecionar para login
            // window.location.href = "/login";
        }
        // aqui podes disparar um toast/mensagem global
        return Promise.reject(error);
    }
);

export default api;
