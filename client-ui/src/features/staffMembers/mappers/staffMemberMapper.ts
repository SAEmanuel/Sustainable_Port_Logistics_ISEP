import type { StaffMember, Schedule } from "../domain/staffMember";



export function mapToStaffMemberDomain(apiResponse: any): StaffMember {
    const schedule: Schedule = {
        shift: apiResponse.schedule.shift,
        daysOfWeek: apiResponse.schedule.daysOfWeek,
    };

    return {
        id: String(apiResponse.id),
        shortName: apiResponse.shortName,
        mecanographicNumber: apiResponse.mecanographicNumber,
        email: apiResponse.email,
        phone: apiResponse.phone,
        schedule: schedule,
        isActive: apiResponse.isActive,
        qualificationCodes: apiResponse.qualificationCodes || [],
    };
}