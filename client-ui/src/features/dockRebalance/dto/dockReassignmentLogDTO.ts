export interface DockReassignmentLogDTO {
    id?: string;
    vvnId: string;
    vesselName: string;
    originalDock: string;
    updatedDock: string;
    officerId: string;
    timestamp: string;
}