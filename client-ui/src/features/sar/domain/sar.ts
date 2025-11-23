import type {
    CreateSARDTO,
    UpdateSARDTO,
} from "../dto/sarDTOs";

import type{
    Nationality,
    Status,
    CitizenId,
    Email,
    PhoneNumber,
    VvnCode
} from "../domain/valueObjects";

export type CreateSARRequest = CreateSARDTO;
export type UpdateSARRequest = UpdateSARDTO;

export interface sar {
    id : string
    name :string
    citizenId :CitizenId
    nationality :Nationality
    email  :Email
    phoneNumber  :PhoneNumber
    sao  : string
    notifs : VvnCode[]
    status  : Status
}




