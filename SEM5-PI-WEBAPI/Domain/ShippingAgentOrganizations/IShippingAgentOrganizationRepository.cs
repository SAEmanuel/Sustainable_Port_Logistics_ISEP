using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations
{
    public interface IShippingAgentOrganizationRepository : IRepository<ShippingAgentOrganization, ShippingAgentOrganizationId>
    {
        public Task<ShippingAgentOrganization?> GetByCodeAsync(ShippingOrganizationCode code);
        public Task<ShippingAgentOrganization> GetByTaxNumberAsync(TaxNumber taxnumber);
        public Task<ShippingAgentOrganization> GetByLegalNameAsync(string legalName);
        public Task<List<ShippingAgentOrganization>> GetFilterAsync(string? code,string? legalname,string? altName,string? addresss, TaxNumber? taxnumber,string? query);
    }
}