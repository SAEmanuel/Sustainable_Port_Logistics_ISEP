
export type RequestType = "Access" | "Deletion" | "Rectification";

export type RequestStatus =
    | "WaitingForAssignment"
    | "InProgress"
    | "Completed"
    | "Rejected";

export interface ClockTimeDto {
    value: string;
}

export interface DataRightsRequest {
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

/** Payload que o USER envia num pedido de rectificação */
export interface RectificationPayload {
    newName?: string | null;
    newEmail?: string | null;
    newPicture?: string | null;
    isActive?: boolean | null;

    newPhoneNumber?: string | null;
    newNationality?: string | null;
    newCitizenId?: string | null;

    reason?: string | null;
}

/** Modelo de criação no frontend (lado do user) */
export interface CreatingDataRightsRequest {
    type: RequestType;
    rectification: RectificationPayload;
    deletionReason: string;
}
