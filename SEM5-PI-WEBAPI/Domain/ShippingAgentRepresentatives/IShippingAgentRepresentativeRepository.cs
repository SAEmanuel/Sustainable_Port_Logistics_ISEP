using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives
{
    public interface IShippingAgentRepresentativeRepository : IRepository<ShippingAgentRepresentative, ShippingAgentRepresentativeId>
    {
        public Task<List<ShippingAgentRepresentative>> GetAllSarBySaoAsync(ShippingOrganizationCode organizationCode);
        public Task<ShippingAgentRepresentative?> GetByNameAsync(string name);
        public Task<ShippingAgentRepresentative?> GetByEmailAsync(string email);
        public Task<ShippingAgentRepresentative?> GetByCitizenIdAsync(CitizenId cId);
        public Task<ShippingAgentRepresentative?> GetByStatusAsync(Status status);
        public Task<ShippingAgentRepresentative?> GetBySaoAsync(ShippingOrganizationCode code);

        public Task<List<ShippingAgentRepresentative>> GetFilterAsync(string? name, CitizenId? citizenId, Nationality? nationality, string? email, PhoneNumber? phoneNumber,Status? status,ShippingOrganizationCode? sao, string? query);
    }
}