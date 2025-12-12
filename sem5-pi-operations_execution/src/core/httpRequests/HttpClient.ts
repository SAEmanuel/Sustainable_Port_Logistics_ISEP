import axios, { AxiosInstance } from "axios";

export class HttpClient {
    private client: AxiosInstance;

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: 5000,
            headers: {
                "Accept": "application/json",
            },
        });
    }

    async get<T>(path: string): Promise<T> {
        const response = await this.client.get<T>(path);
        return response.data;
    }
}