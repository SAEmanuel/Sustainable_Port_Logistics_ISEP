export const CTError = {
    InvalidCode : "CT_INVALID_CODE",
    InvalidInput : "CT_INVALID_INPUT",
    NotScheduled : "CT_NOT_SCHEDULED",
    NotInProgress : "CT_NOT_IN_PROGRESS",
    AlreadyCompleted : "CT_ALREADY_COMPLETED",
    InvalidTimeWindow : "CT_INVALID_TIME_WINDOW",
    PersistError : "CT_PERSIST_ERROR",
    NotFound : "CT_NOT_FOUND",
    InvalidTimeRange : "CT_INVALID_TIME_RANGE"
} as const;

export type CTError = typeof CTError[keyof typeof CTError];