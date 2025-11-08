export const Roles = {
    Administrator: "Administrator",
    PortAuthorityOfficer: "PortAuthorityOfficer",
    LogisticsOperator: "LogisticsOperator",
    ShippingAgentRepresentative: "ShippingAgentRepresentative",
    ProjectManager: "ProjectManager",
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export interface User {
    id?: string;
    auth0UserId?: string;
    email: string;
    name?: string;
    picture?: string;
    role?: Role | null;
    isActive?: boolean;
    eliminated?: boolean;
}