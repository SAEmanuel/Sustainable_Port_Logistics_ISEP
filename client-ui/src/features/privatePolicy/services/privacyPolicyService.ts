import { webApi } from "../../../services/api";
import type {
    PrivacyPolicyDto,
    CreatePrivacyPolicyRequestDto,
    ConfirmationDto
} from "../dto/privacyPolicyDtos";
import type { PrivacyPolicy } from "../domain/privacyPolicy";
import type { Confirmation } from "../domain/confirmation";
import { mapPrivacyPolicyDto } from "../mappers/privacyPolicyMapper";
import { mapConfirmationDto } from "../mappers/confirmationMapper";

// GET /api/PrivacyPolicy
export async function getPrivacyPolicies(): Promise<PrivacyPolicy[]> {
    const res = await webApi.get<PrivacyPolicyDto[]>("/api/PrivacyPolicy");
    return res.data.map(mapPrivacyPolicyDto);
}

// POST /api/PrivacyPolicy
export async function createPrivacyPolicy(
    data: CreatePrivacyPolicyRequestDto
): Promise<PrivacyPolicy> {
    const res = await webApi.post<PrivacyPolicyDto>("/api/PrivacyPolicy", data);
    return mapPrivacyPolicyDto(res.data);
}

// GET /api/PrivacyPolicy/currentPrivacyPolicy
export async function getCurrentPrivacyPolicy(): Promise<PrivacyPolicy>{
    const res = await webApi.get<PrivacyPolicyDto>("/api/PrivacyPolicy/currentPrivacyPolicy");
    return mapPrivacyPolicyDto(res.data);
}


export async function getConfirmationByUser(email:string): Promise<Confirmation> {
    const res = await webApi.get<ConfirmationDto>(`/api/Confirmation/user/email/${email}`);
    return mapConfirmationDto(res.data);
}

export async function acceptConfirmationByUser(email:string): Promise<Confirmation> {
    const res = await webApi.get<ConfirmationDto>(`/api/Confirmation/confirmation/accept/pp/user/email/${email}`);
    return mapConfirmationDto(res.data);
}

export async function rejectConfirmationByUser(email:string): Promise<Confirmation> {
    const res = await webApi.get<ConfirmationDto>(`/api/Confirmation/confirmation/reject/pp/user/email/${email}`);
    return mapConfirmationDto(res.data);
}