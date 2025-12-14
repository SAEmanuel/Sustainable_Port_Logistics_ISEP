export const CTCError = {
    AlreadyExists: "CTC_ALREADY_EXISTS",
    NotFound: "CTC_NOT_FOUND",
    InvalidCategory: "CTC_INVALID_CATEGORY",
    PersistError: "CTC_PERSIST_ERROR",
    ActivateError: "CTC_ACTIVATE_ERROR",
    DeactivateError: "CTC_DEACTIVATE_ERROR",
    InvalidCodeFormat: "CTC_INVALID_CODE_FORMAT",
    InvalidInput: "CTC_INVALID_INPUT",
    AlreadyActive: "CTC_ALREADY_ACTIVE",
    AlreadyInactive: "CTC_ALREADY_INACTIVE"
} as const;

export type CTCError = typeof CTCError[keyof typeof CTCError];