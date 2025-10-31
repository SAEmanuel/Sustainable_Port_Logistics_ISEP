export type Role = "Admin" | "Manager" | "Agent" | "Operator" | "Viewer";
export interface User {
    id: string;
    name: string;
    roles: Role[];
}
