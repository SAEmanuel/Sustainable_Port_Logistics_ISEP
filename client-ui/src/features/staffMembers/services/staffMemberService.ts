import api from "../../../services/api";
import type { StaffMember } from "../domain/staffMember"; 
import type { CreateStaffMemberRequest, UpdateStaffMemberRequest } from "../dtos/staffMember"; 
import { mapToStaffMemberDomain } from "../mappers/staffMemberMapper"; 


export async function getStaffMembers(): Promise<StaffMember[]> {
    const res = await api.get("/api/StaffMembers");
    return res.data.map(mapToStaffMemberDomain);
}

export async function getStaffMemberByMecNumber(mec: string): Promise<StaffMember> {
    const res = await api.get(`/api/StaffMembers/mec/${mec}`);
    return mapToStaffMemberDomain(res.data);
}

export async function getStaffMembersByName(name: string): Promise<StaffMember[]> {
    const res = await api.get(`/api/StaffMembers/name/${name}`);
    return res.data.map(mapToStaffMemberDomain);
}

export async function getStaffMembersByStatus(status: boolean): Promise<StaffMember[]> {
    const res = await api.get(`/api/StaffMembers/status/${status}`);
    return res.data.map(mapToStaffMemberDomain);
}

export async function getStaffMembersByQualifications(qualifications: string[]): Promise<StaffMember[]> {
    const params = new URLSearchParams();
    qualifications.forEach(q => params.append("codes", q));
    const res = await api.get(`/api/StaffMembers/by-qualifications`, { params });
    return res.data.map(mapToStaffMemberDomain);
}

export async function getStaffMembersByExactQualifications(qualifications: string[]): Promise<StaffMember[]> {
    const params = new URLSearchParams();
    qualifications.forEach(q => params.append("codes", q));
    const res = await api.get(`/api/StaffMembers/by-exact-qualifications`, { params });
    return res.data.map(mapToStaffMemberDomain);
}

export async function createStaffMember(data: CreateStaffMemberRequest): Promise<StaffMember> {
    const res = await api.post("/api/StaffMembers", data);
    return mapToStaffMemberDomain(res.data);
}

export async function updateStaffMember(data: UpdateStaffMemberRequest): Promise<StaffMember> {
    const res = await api.put(`/api/StaffMembers/update`, data);
    return mapToStaffMemberDomain(res.data);
}

export async function toggleStaffMemberStatus(mec: string): Promise<StaffMember> {
    const res = await api.put(`/api/StaffMembers/toggle/${mec}`);
    return mapToStaffMemberDomain(res.data);
}