
import { webApi } from "../../../services/api";
import type {
    PrivacyPolicyDto,
    CreatePrivacyPolicyRequestDto,
} from "../dto/privacyPolicyDtos";
import type { PrivacyPolicy } from "../domain/PrivacyPolicy";
import { mapPrivacyPolicyDto } from "../mappers/privacyPolicyMapper";

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
