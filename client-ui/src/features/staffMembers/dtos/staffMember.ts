import type { Schedule } from "../domain/staffMember";

export interface CreateStaffMemberRequest {
    shortName: string;
    email: string;
    phone: string;
    schedule: Schedule;
    isActive: boolean;
    qualificationCodes?: string[];
}

export interface UpdateStaffMemberRequest {
    mecNumber: string;
    shortName?: string;
    email?: string;
    phone?: string;
    schedule?: Schedule;
    isActive?: boolean;
    qualificationCodes?: string[];
    addQualifications?: boolean;
}