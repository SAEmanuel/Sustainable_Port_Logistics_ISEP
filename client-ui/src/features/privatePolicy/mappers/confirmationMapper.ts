import type { ConfirmationDto } from "../dto/privacyPolicyDtos";
import type { Confirmation } from "../domain/confirmation";

export function mapConfirmationDto(dto:ConfirmationDto): Confirmation{
    return {
        id: dto.id,
        userEmail: dto.userEmail,
        versionPrivacyPolicy : dto.versionPrivacyPolicy,
        isAccepted: dto.isAccepted,
        accpetedAtTime: dto.accpetedAtTime ? new Date(dto.accpetedAtTime) : null
    }
}
