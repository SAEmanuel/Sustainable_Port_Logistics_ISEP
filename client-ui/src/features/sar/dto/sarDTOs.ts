import type{
    Nationality,
    Status,
    CitizenId,
    Email,
    PhoneNumber,
    VvnCode
} from "../domain/valueObjects";

export interface sarDTO {
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

export interface CreateSARDTO {
    name : string;
    citizenId : CitizenId;
    nationality : Nationality;
    email : Email;
    phoneNumber : PhoneNumber;
    Sao : string; 
    status : string;
}

export interface UpdateSARDTO {
    email : Email;
    phoneNumber : PhoneNumber;
    status : Status;
}