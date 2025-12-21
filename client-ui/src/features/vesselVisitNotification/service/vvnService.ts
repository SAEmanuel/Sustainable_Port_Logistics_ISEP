import {webApi} from "../../../services/api";
import type {
    VesselVisitNotificationDto,
    FilterInProgressPendingVvnStatusDto,
    FilterWithdrawnVvnStatusDto,
    FilterSubmittedVvnStatusDto,
    FilterAcceptedVvnStatusDto,
    UpdateVesselVisitNotificationDto,
    RejectVesselVisitNotificationDto,
    CreatingVesselVisitNotificationDto,
} from "../dto/vvnTypesDtos";

export async function getIdSarByEmail(email: string) {
    const res = await webApi.get(
        `/api/ShippingAgentRepresentative/id/email/${encodeURIComponent(email)}`,
    );
    return res.data as string;
}

export async function getVvnById(id: string) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/id/${id}`,
    );
    return res.data as VesselVisitNotificationDto;
}

/* ===== BY SAR ===== */
export async function getInProgressPendingBySar(
    sarId: string,
    f: FilterInProgressPendingVvnStatusDto,
) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/shippingAgentRepresentative/inProgress-pendingInformation/${sarId}`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

export async function getWithdrawnBySar(
    sarId: string,
    f: FilterWithdrawnVvnStatusDto,
) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/shippingAgentRepresentative/withDrawn/${sarId}`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

export async function getSubmittedBySar(
    sarId: string,
    f: FilterSubmittedVvnStatusDto,
) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/shippingAgentRepresentative/submitted/${sarId}`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

export async function getAcceptedBySar(
    sarId: string,
    f: FilterAcceptedVvnStatusDto,
) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/shippingAgentRepresentative/accepted/${sarId}`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

/* ===== ADMIN (ALL)  ===== */
export async function getInProgressPendingAll(
    f: FilterInProgressPendingVvnStatusDto,
) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/all/inProgress-pendingInformation`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

export async function getWithdrawnAll(f: FilterWithdrawnVvnStatusDto) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/all/withDrawn`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

export async function getSubmittedAll(f: FilterSubmittedVvnStatusDto) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/all/submitted`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

export async function getAcceptedAll(f: FilterAcceptedVvnStatusDto) {
    const res = await webApi.get(
        `/api/VesselVisitNotification/all/accepted`,
        {params: f},
    );
    return res.data as VesselVisitNotificationDto[];
}

/* ===== Ações ===== */
export async function submitById(id: string) {
    const res = await webApi.put(`/api/VesselVisitNotification/${id}/submit`);
    return res.data as VesselVisitNotificationDto;
}

export async function withdrawById(id: string) {
    const res = await webApi.put(`/api/VesselVisitNotification/${id}/withdraw`);
    return res.data as VesselVisitNotificationDto;
}

export async function acceptById(id: string) {
    const res = await webApi.put(`/api/VesselVisitNotification/accept/id/${id}`);
    return res.data as VesselVisitNotificationDto;
}

export async function updateVvn(
    id: string,
    dto: UpdateVesselVisitNotificationDto,
) {
    const res = await webApi.put(`/api/VesselVisitNotification/${id}/update`, dto);
    return res.data as VesselVisitNotificationDto;
}

export async function createVvn(dto: CreatingVesselVisitNotificationDto) {
    const res = await webApi.post(`/api/VesselVisitNotification`, dto);
    return res.data as VesselVisitNotificationDto;
}

export async function rejectByCode(dto: RejectVesselVisitNotificationDto) {
    const res = await webApi.put(`/api/VesselVisitNotification/reject/`, dto);
    return res.data as VesselVisitNotificationDto;
}

const vvnService = {
    getIdSarByEmail,
    getInProgressPendingBySar,
    getWithdrawnBySar,
    getSubmittedBySar,
    getAcceptedBySar,
    getInProgressPendingAll,
    getWithdrawnAll,
    getSubmittedAll,
    getAcceptedAll,
    submitById,
    withdrawById,
    acceptById,
    updateVvn,
    createVvn,
    rejectByCode,
};

export default vvnService;
