using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives
{
    public interface IShippingAgentRepresentativeRepository : IRepository<ShippingAgentRepresentative, ShippingAgentRepresentativeId>
    {
        public Task<ShippingAgentRepresentative?> GetByNameAsync(string name);
        public Task<ShippingAgentRepresentative?> GetByEmailAsync(string email);
        public Task<ShippingAgentRepresentative?> GetByStatusAsync(Status status);
        public Task<List<ShippingAgentRepresentative>> GetFilterAsync(string? name, string? citizenId, string? nationality, string? email, string? phoneNumber,Status status, string? query);
    }
}