// src/features/vvn/types/vvnTypes.ts

/* ===== Enums vindos do backend (string literals) ===== */
export type VvnStatus = "InProgress" | "PendingInformation" | "Withdrawn" | "Submitted" | "Accepted";
export type CargoManifestType = "Loading" | "Unloading";
export type ContainerType = "General" | "Reefer" | "Electronic" | "Hazmat" | "Oversized";
export type ContainerStatus = "Empty" | "Full" | "Reserved" | "Damaged" | "InTransit";
export type CrewRole =
    | "Captain" | "ChiefOfficer" | "SecondOfficer" | "ThirdOfficer"
    | "ChiefEngineer" | "SecondEngineer" | "ThirdEngineer" | "FourthEngineer"
    | "Electrician" | "Bosun" | "AbleSeaman" | "OrdinarySeaman" | "Cook" | "Steward"
    | "DeckCadet" | "EngineCadet" | "RadioOfficer" | "SafetyOfficer" | "Purser" | "ChiefCook";

/* Nationality – usar string solta (o backend tem muitos valores). */
export type Nationality = string;

/* ===== Value Objects ===== */
export interface Iso6346Code {
    value?: string;   // backend pode serializar como { value: "XXXX1234567" }
    Value?: string;   // (dependendo do serializer)
    // em alguns casos podes receber só a string; a UI trata disso
}

/* ===== Containers / Cargo ===== */
export interface ContainerDto {
    id: string;
    isoCode: Iso6346Code | string;
    description: string;
    type: ContainerType;
    status: ContainerStatus;
    weightKg: number;
}

export interface CargoManifestEntryDto {
    id: string;
    bay: number;
    row: number;
    tier: number;
    storageAreaName: string;
    container: ContainerDto;
}

export interface CargoManifestDto {
    id: string;
    code: string;
    type: CargoManifestType;
    createdAt: string;   // DateTime
    createdBy: string;
    entries: CargoManifestEntryDto[];
}

/* ===== Crew ===== */
export interface CrewMemberDto {
    id: string;
    name: string;
    role: CrewRole;
    nationality: Nationality;
    citizenId: string;
}

export interface CrewManifestDto {
    id: string;
    totalCrew: number;
    captainName: string;
    crewMembers?: CrewMemberDto[] | null;
}

/* ===== VVN ===== */
export interface PdfDocument { name: string; url?: string }
export interface PdfDocumentCollection { pdfs: PdfDocument[] }

export interface TaskDto {
    id: string;
    title: string;
    description?: string | null;
    status?: string | null;
}

export interface VesselVisitNotificationDto {
    id: string;
    code: string;

    estimatedTimeArrival: string;
    estimatedTimeDeparture: string;
    actualTimeArrival?: string | null;
    actualTimeDeparture?: string | null;
    acceptenceDate?: string | null;

    volume: number;
    documents: PdfDocumentCollection;

    status: string;
    dock?: string | null;
    crewManifest?: CrewManifestDto | null;
    loadingCargoManifest?: CargoManifestDto | null;
    unloadingCargoManifest?: CargoManifestDto | null;
    vesselImo: string;

    tasks: TaskDto[];
}

/* ===== Creating/Updating/Filters (iguais à versão anterior) ===== */
export interface CreatingVesselVisitNotificationDto {
    estimatedTimeArrival: string;
    estimatedTimeDeparture: string;
    volume: number;
    documents?: string | null;
    crewManifest: any;
    loadingCargoManifest?: any | null;
    unloadingCargoManifest?: any | null;
    vesselImo: string;
    emailSar: string;
}

export interface UpdateVesselVisitNotificationDto {
    estimatedTimeArrival?: string | null;
    estimatedTimeDeparture?: string | null;
    volume?: number | null;
    documents?: PdfDocumentCollection | null;
    dock?: string | null;
    crewManifest?: any | null;
    loadingCargoManifest?: any | null;
    unloadingCargoManifest?: any | null;
    imoNumber?: string | null;
}

export interface RejectVesselVisitNotificationDto {
    vvnCode: string;
    reason: string;
}

export interface FilterInProgressPendingVvnStatusDto {
    specificRepresentative?: string | null;
    vesselImoNumber?: string | null;
    estimatedTimeArrival?: string | null;
    estimatedTimeDeparture?: string | null;
}

export interface FilterWithdrawnVvnStatusDto {
    specificRepresentative?: string | null;
    vesselImoNumber?: string | null;
    estimatedTimeArrival?: string | null;
    estimatedTimeDeparture?: string | null;
}

export interface FilterSubmittedVvnStatusDto {
    specificRepresentative?: string | null;
    vesselImoNumber?: string | null;
    estimatedTimeArrival?: string | null;
    estimatedTimeDeparture?: string | null;
    submittedDate?: string | null;
}

export interface FilterAcceptedVvnStatusDto {
    specificRepresentative?: string | null;
    vesselImoNumber?: string | null;
    estimatedTimeArrival?: string | null;
    estimatedTimeDeparture?: string | null;
    submittedDate?: string | null;
    acceptedDate?: string | null;
}
