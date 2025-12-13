export const CTStatus = {
   Scheduled : "Scheduled",
   InProgress : "In Progress",
   Completed: "Completed"
} as const;

export type CTStatus = typeof CTStatus[keyof typeof CTStatus];