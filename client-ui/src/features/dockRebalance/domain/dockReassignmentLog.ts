export interface DockReassignmentLog {
    id?: string;
    vvnId: string;
    vesselName: string;
    originalDock: string;
    updatedDock: string;
    officerId: string;
    timestamp: string;
}