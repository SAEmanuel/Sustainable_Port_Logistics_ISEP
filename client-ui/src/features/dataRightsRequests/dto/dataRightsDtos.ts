import type { RequestType, RequestStatus, RectificationPayload } from "../domain/dataRights";

export interface DataRightsRequestDto {
    id: string;
    requestId: string;

    userId: string;
    userEmail: string;

    type: RequestType;
    status: RequestStatus;

    payload?: string | null;

    createdOn: { value: string };
    updatedOn?: { value: string } | null;

    processedBy?: string | null;
}

/** DTO que enviamos para o POST */
export interface CreateDataRightsRequestDto {
    userId: string;
    userEmail: string;
    type: RequestType;
    payload?: string | null;
}

/** Payload JSON para rectificação */
export type RectificationPayloadDto = RectificationPayload;
