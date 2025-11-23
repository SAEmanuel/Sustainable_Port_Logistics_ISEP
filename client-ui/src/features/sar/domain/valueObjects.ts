export type Nationality = string;

export type Status = "activated" | "deactivated";

export interface CitizenId{
    passportNumber :string
}

export interface Email{
    address : string
}

export interface PhoneNumber{
    number : string
}


export interface VvnCode{
    code : string
    sequenceNumber : number
    yearNumber: number
}