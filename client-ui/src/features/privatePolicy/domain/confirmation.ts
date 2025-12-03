export interface Confirmation{
    id: string;
    userEmail: string;
    versionPrivacyPolicy: string;
    isAccepted: boolean;
    accpetedAtTime: Date | null;
}