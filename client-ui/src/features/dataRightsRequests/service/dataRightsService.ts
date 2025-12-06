import { webApi } from "../../../services/api";
import type {
    DataRightsRequestDto,
    CreateDataRightsRequestDto,
} from "../dto/dataRightsDtos";

/** Lista todos os pedidos de um user (email) */
export async function getRequestsForUser(
    email: string
): Promise<DataRightsRequestDto[]> {
    const res = await webApi.get(
        `/api/DataRigthsRequest/request/all/user/${encodeURIComponent(email)}`
    );
    return res.data;
}

/** Cria um novo pedido */
export async function createRequest(
    dto: CreateDataRightsRequestDto
): Promise<DataRightsRequestDto> {
    const res = await webApi.post("/api/DataRigthsRequest", dto);
    return res.data;
}

const dataRightsService = {
    getRequestsForUser,
    createRequest,
};

export default dataRightsService;
