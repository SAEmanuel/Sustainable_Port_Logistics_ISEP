using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public class ShippingAgentRepresentativeFactory
{
    public static ShippingAgentRepresentativeDto CreateDto(ShippingAgentRepresentative shippingAgentRepresentative)
    {
        return new ShippingAgentRepresentativeDto(
            shippingAgentRepresentative.Name,
            shippingAgentRepresentative.CitizenId,
            shippingAgentRepresentative.Nationality,
            shippingAgentRepresentative.Email,
            shippingAgentRepresentative.PhoneNumber,
            shippingAgentRepresentative.Status,
            shippingAgentRepresentative.SAO,
            shippingAgentRepresentative.Notifs
        );
    }

    public static ShippingAgentRepresentative CreateEntity(CreatingShippingAgentRepresentativeDto dto)
    {
        if (!Enum.TryParse<Status>(dto.Status, true, out var parsedStatus))
        throw new ArgumentException($"Invalid status '{dto.Status}'. Must be 'activated' or 'deactivated'.");

        return new ShippingAgentRepresentative(
            dto.Name,
            dto.CitizenId,
            dto.Nationality,
            dto.Email,
            dto.PhoneNumber,
            parsedStatus,
            new ShippingOrganizationCode(dto.Sao)
        );
    }

}