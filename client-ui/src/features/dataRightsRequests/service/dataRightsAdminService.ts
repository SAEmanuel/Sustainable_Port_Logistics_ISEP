import { webApi } from "../../../services/api";
import type { DataRightsRequestDto } from "../dto/dataRightsDtos";

/** Pedidos à espera de atribuição */
export async function getWaitingForAssignment(): Promise<DataRightsRequestDto[]> {
    const res = await webApi.get(
        "/api/DataRigthsRequest/requests/status/waitingforassignment",
    );
    return res.data;
}

/** Pedidos atribuídos a um responsável */
export async function getForResponsible(
    email: string,
): Promise<DataRightsRequestDto[]> {
    const res = await webApi.get(
        `/api/DataRigthsRequest/request/all/responsible/${encodeURIComponent(
            email,
        )}`,
    );
    return res.data;
}

/** Atribuir o pedido a um responsável (normalmente “eu”) */
export async function assignResponsible(
    requestId: string,
    responsibleEmail: string,
): Promise<DataRightsRequestDto> {
    const res = await webApi.patch(
        `/api/DataRigthsRequest/assignResponsible/${encodeURIComponent(
            requestId,
        )}`,
        null,
        { params: { responsibleEmail } },
    );
    return res.data;
}

/** Responder a pedido de ACCESS – backend gera o payload e marca como Completed */
export async function respondAccess(
    requestId: string,
): Promise<DataRightsRequestDto> {
    const res = await webApi.patch(
        `/api/DataRigthsRequest/response/request/type/access/${encodeURIComponent(
            requestId,
        )}`,
    );
    return res.data;
}

/** Responder a pedido de DELETION – backend faz o delete e marca como Completed */
export async function respondDeletion(
    requestId: string,
): Promise<DataRightsRequestDto> {
    await webApi.delete(
        `/api/DataRigthsRequest/response/request/type/deletion/${encodeURIComponent(
            requestId,
        )}`,
    );
    // o endpoint devolve 204, aqui não precisamos dos dados concreto
    return {
        id: "" as any,
        requestId,
        userId: "",
        userEmail: "",
        type: "Deletion",
        status: "Completed",
        payload: null,
        createdOn: { value: "" },
        updatedOn: { value: "" },
        processedBy: undefined,
    };
}

const adminDataRightsService = {
    getWaitingForAssignment,
    getForResponsible,
    assignResponsible,
    respondAccess,
    respondDeletion,
};

export default adminDataRightsService;
