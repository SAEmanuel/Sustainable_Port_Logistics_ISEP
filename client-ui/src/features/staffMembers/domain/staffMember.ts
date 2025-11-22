import type { ShiftType } from "../helpers/staffMemberHelpers";

export interface Schedule {
    shift: ShiftType;
    daysOfWeek: string;
}

export interface StaffMember {
    id: string;
    shortName: string;
    mecanographicNumber: string;
    email: string;
    phone: string;
    schedule: Schedule;
    isActive: boolean;
    qualificationCodes: string[];
}