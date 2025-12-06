
export type RequestType = "Access" | "Deletion" | "Rectification";

export type RequestStatus =
    | "WaitingForAssignment"
    | "InProgress"
    | "Completed"
    | "Rejected";

export interface DataRightsRequest {
    id: string;
    requestId: string;
    userId: string;
    userEmail: string;
    type: RequestType;
    status: RequestStatus;
    payload?: string | null;
    createdOn: { value: string }; // ou Date string; depende do ClockTime
updatedOn?: { value: string } | null;
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

/** Modelo de criação no frontend */
export interface CreatingDataRightsRequest {
    type: RequestType;
    rectification: RectificationPayload;
    deletionReason: string;
}