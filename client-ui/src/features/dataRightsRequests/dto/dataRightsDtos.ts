
import type {
    RequestType,
    RequestStatus,
    RectificationPayload,
} from "../domain/dataRights";

export interface ClockTimeDto {
    value: string;
}

export interface DataRightsRequestDto {
    id: string;
    requestId: string;

    userId: string;
    userEmail: string;

    type: RequestType;
    status: RequestStatus;

    payload?: string | null;

    createdOn: ClockTimeDto;
    updatedOn?: ClockTimeDto | null;

    processedBy?: string | null;
}

/** DTO que enviamos para o POST (user side) */
export interface CreateDataRightsRequestDto {
    userId: string;
    userEmail: string;
    type: RequestType;
    payload?: string | null;
}

/** Payload JSON para rectificação */
export type RectificationPayloadDto = RectificationPayload;

/** DTO enviado pelo ADMIN para aplicar a rectificação (rectification) */
export interface RectificationApplyDto {
    requestId: string;

    // Se o admin rejeitar tudo
    rejectEntireRequest: boolean;
    globalReason?: string | null;

    // CAMPOS DE USER
    finalName?: string | null;
    finalNameReason?: string | null;

    finalEmail?: string | null;
    finalEmailReason?: string | null;

    finalPicture?: string | null;
    finalPictureReason?: string | null;

    finalIsActive?: boolean | null;
    finalIsActiveReason?: string | null;

    // CAMPOS DE SAR
    finalPhoneNumber?: string | null;
    finalPhoneNumberReason?: string | null;

    finalNationality?: string | null;
    finalNationalityReason?: string | null;

    finalCitizenId?: string | null;
    finalCitizenIdReason?: string | null;

    // Comentário geral
    adminGeneralComment?: string | null;
}
