using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives
{
    public interface IShippingAgentRepresentativeRepository : IRepository<ShippingAgentRepresentative, ShippingAgentRepresentativeId>
    {
        public Task<List<ShippingAgentRepresentative>> GetAllSarBySaoAsync(ShippingOrganizationCode organizationCode);
        public Task<ShippingAgentRepresentative?> GetByNameAsync(string name);
        public Task<ShippingAgentRepresentative?> GetByEmailAsync(string email);
        public Task<ShippingAgentRepresentative?> GetByCitizenIdAsync(string cId);
        public Task<ShippingAgentRepresentative?> GetByStatusAsync(Status status);
        public Task<ShippingAgentRepresentative?> GetBySaoAsync(ShippingOrganizationCode code);

        public Task<List<ShippingAgentRepresentative>> GetFilterAsync(string? name, string? citizenId, string? nationality, string? email, string? phoneNumber,Status? status,ShippingOrganizationCode? sao, string? query);
    }
}