export interface PrivacyPolicyDto {
    id: string;
    version: string;
    titleEn: string;
    titlePT: string;
    contentEn: string;
    contentPT: string;
    createdAt: string;
    effectiveFrom?: string | null;
    isCurrent: boolean;
    createdByAdmin: string;
}

export interface CreatePrivacyPolicyRequestDto {
    titleEn: string;
    titlePT: string;
    contentEn: string;
    contentPT: string;
    effectiveFrom: string;
    createdByAdmin: string;
}

export interface ConfirmationDto {
    id: string;
    userEmail: string;
    versionPrivacyPolicy: string;
    isAccepted: boolean;
    accpetedAtTime: string | null;
}
