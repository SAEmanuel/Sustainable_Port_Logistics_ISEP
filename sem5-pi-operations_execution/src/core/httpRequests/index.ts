import config from "../../config";
import { HttpClient } from "./HttpClient";

if (!config.webApiUrl || !config.planningApiUrl) {
    throw new Error("❌ Missing upstream API URLs");
}

export const webApiClient = new HttpClient(config.webApiUrl);
export const planningClient = new HttpClient(config.planningApiUrl);