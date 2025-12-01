import type { PrivacyPolicyDto } from "../dto/privacyPolicyDtos";
import type { PrivacyPolicy } from "../domain/PrivacyPolicy";

export function mapPrivacyPolicyDto(dto: PrivacyPolicyDto): PrivacyPolicy {
    return {
        id: dto.id,
        version: dto.version,

        titleEn: dto.titleEn,
        titlePT: dto.titlePT,

        contentEn: dto.contentEn,
        contentPT: dto.contentPT,

        createdAt: new Date(dto.createdAt),
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,

        isCurrent: dto.isCurrent,
        createdByAdmin: dto.createdByAdmin,
    };
}
