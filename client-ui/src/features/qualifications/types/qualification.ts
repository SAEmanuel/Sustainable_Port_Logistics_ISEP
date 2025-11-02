export interface Qualification {
    code: string,
    name: string,
    id: string
}

export interface CreateQualificationRequest {
    name: string,
    code?: string
}

export interface UpdateQualificationRequest {
    name?: string,
    code?: string
}

export interface QualificationsList {
    qualificationsCodes: string[]
}