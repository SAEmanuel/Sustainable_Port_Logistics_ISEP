import api from "../../../services/api";
import type { StaffMember, CreateStaffMember, UpdateStaffMember } from "../types/staffMember";



export async function getStaffMembers(): Promise<StaffMember[]> {
    const res = await api.get("/api/StaffMembers");
    return res.data;
}

export async function getStaffMemberByMecNumber(mec: string): Promise<StaffMember> {
    const res = await api.get(`/api/StaffMembers/mec/${mec}`);
    return res.data;
}

export async function getStaffMembersByName(name: string): Promise<StaffMember> {
    const res = await api.get(`/api/StaffMembers/name/${name}`);
    return res.data;
}

export async function getStaffMembersByStatus(status: boolean): Promise<StaffMember> {
    const res = await api.get(`/api/StaffMembers/status/${status}`);
    return res.data;
}

export async function getStaffMembersByQualifications(qualifications: string[]): Promise<StaffMember> {
    const res = await api.get(`/api/StaffMembers/by-qualifications/${qualifications}`);
    return res.data;
}

export async function getStaffMembersByExactQualifications(qualifications: string[]): Promise<StaffMember> {
    const res = await api.get(`/api/StaffMembers/by-exact-qualifications/${qualifications}`);
    return res.data;
}

export async function createStaffMember(data: CreateStaffMember): Promise<StaffMember> {
    const res = await api.post("/api/StaffMembers", data);
    return res.data;
}

export async function updateStaffMember(data: UpdateStaffMember): Promise<StaffMember> {
    const res = await api.patch(`/api/StaffMembers/update`, data);
    return res.data;
}