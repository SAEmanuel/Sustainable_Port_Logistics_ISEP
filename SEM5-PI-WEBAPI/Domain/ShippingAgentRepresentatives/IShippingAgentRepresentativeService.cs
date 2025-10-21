using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

public interface IShippingAgentRepresentativeService
{
    Task<List<ShippingAgentRepresentativeDto>> GetAllAsync();
    Task<ShippingAgentRepresentativeDto> GetByIdAsync(ShippingAgentRepresentativeId id);
    Task<ShippingAgentRepresentativeDto> GetByNameAsync(string name);
    Task<ShippingAgentRepresentativeDto> GetByEmailAsync(EmailAddress email);
    Task<ShippingAgentRepresentativeDto> GetByCitizenId(CitizenId cId);
    Task<ShippingAgentRepresentativeDto> GetByStatusAsync(Status status);
    Task<ShippingAgentRepresentativeDto> GetBySaoAsync(ShippingOrganizationCode code);
    Task<ShippingAgentRepresentativeDto> AddAsync(CreatingShippingAgentRepresentativeDto dto);
    Task<ShippingAgentRepresentativeDto> PatchByNameAsync(string name, UpdatingShippingAgentRepresentativeDto dto);
    Task<ShippingAgentRepresentativeDto> AddNotificationAsync(string representativeName, string vvnCode);
}