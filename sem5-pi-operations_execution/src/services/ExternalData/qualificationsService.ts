import { webApiClient } from "../../core/httpRequests";

export interface ExternalQualificationDTO {
    id: string;
    name: string;
    description: string;
}

export default class QualificationsService {

    async fetchAll(): Promise<ExternalQualificationDTO[]> {
        return await webApiClient.get<ExternalQualificationDTO[]>(
            "/api/Qualifications"
        );
    }

}