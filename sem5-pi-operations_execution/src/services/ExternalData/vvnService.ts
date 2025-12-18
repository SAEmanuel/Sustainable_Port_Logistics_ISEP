import { webApiClient } from "../../core/httpRequests";
import {Service} from "typedi";

export interface ExternalVVNotificationDTO {
    id: string;
    vesselImo: string;
    status: string;
    code: string;
    dock?: string;
}

@Service()
export default class VVNService {
    async fetchById(id:string): Promise<ExternalVVNotificationDTO> {
        return await webApiClient.get<ExternalVVNotificationDTO>(
            `/api/VesselVisitNotification/id/${id}`
        );
    }
}