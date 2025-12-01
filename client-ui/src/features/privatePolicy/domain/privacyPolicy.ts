
import type { CreatePrivacyPolicyRequestDto } from "../dto/privacyPolicyDtos";

export interface PrivacyPolicy {
    id: string;
    version: string;

    titleEn: string;
    titlePT: string;

    contentEn: string;
    contentPT: string;

    createdAt: Date;
    effectiveFrom?: Date | null;

    isCurrent: boolean;
    createdByAdmin: string;
}

export type CreatePrivacyPolicyRequest = CreatePrivacyPolicyRequestDto;
