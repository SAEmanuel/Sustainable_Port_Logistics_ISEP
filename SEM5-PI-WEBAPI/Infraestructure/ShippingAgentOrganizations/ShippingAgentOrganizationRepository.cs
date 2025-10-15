using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Infraestructure.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Infraestructure.ShippingAgentOrganizations
{
    public class ShippingAgentOrganizationRepository : BaseRepository<ShippingAgentOrganization, ShippingAgentOrganizationId>, IShippingAgentOrganizationRepository
    {
        private readonly DddSample1DbContext _context;
        public ShippingAgentOrganizationRepository(DddSample1DbContext context) : base(context.ShippingAgentOrganization)
        {
            _context = context;
        }

        public async Task<ShippingAgentOrganization?> GetByCodeAsync(ShippingOrganizationCode code)
        {
            return await _context.ShippingAgentOrganization
                .FirstOrDefaultAsync(x => x.ShippingOrganizationCode.Value.ToString().ToLower().Trim() == code.Value.ToString().ToLower().Trim());
        }
        public async Task<ShippingAgentOrganization?> GetByLegalNameAsync(string legalName)
        {
            return await _context.ShippingAgentOrganization
                .FirstOrDefaultAsync(x => x.LegalName.ToLower().Trim() == legalName.ToLower().Trim());
        }
        public async Task<ShippingAgentOrganization?> GetByTaxNumberAsync(TaxNumber taxnumber)
        {
            return await _context.ShippingAgentOrganization
                .FirstOrDefaultAsync(x => x.Taxnumber.Value.ToLower().Trim() == taxnumber.Value.ToLower().Trim());
        }
        

        public async Task<List<ShippingAgentOrganization>> GetFilterAsync(string? shippingOrganizationCode,string? legalName,string? altName, string? address, TaxNumber? taxNumber, string? query)
        {
            var normalizedCode = shippingOrganizationCode?.Trim().ToLower();
            var normalizedLegalName = legalName?.Trim().ToLower();
            var normalizedAltName = altName?.Trim().ToLower();
            var normalizedAddress = address?.Trim().ToLower();
            var normalizedTaxNumber = taxNumber?.Value.ToString().Trim().ToLower();
            var normalizedQuery = query?.Trim().ToLower();

            var queryable = _context.ShippingAgentOrganization.AsQueryable();

            if (!string.IsNullOrEmpty(normalizedCode))
                queryable = queryable.Where(v => v.ShippingOrganizationCode.ToString().ToLower().Contains(normalizedCode));

            if (!string.IsNullOrEmpty(normalizedLegalName))
                queryable = queryable.Where(v => v.LegalName.ToLower().Contains(normalizedLegalName));

            if (!string.IsNullOrEmpty(normalizedAltName))
                queryable = queryable.Where(v => v.AltName.ToLower().Contains(normalizedAltName));
                
            if (!string.IsNullOrEmpty(normalizedAddress))
                queryable = queryable.Where(v => v.Address.ToLower().Contains(normalizedAddress));

            if (!string.IsNullOrEmpty(normalizedTaxNumber))
                queryable = queryable.Where(v => v.Taxnumber.Value.ToLower().Contains(normalizedTaxNumber));

            if (!string.IsNullOrEmpty(normalizedQuery))
                queryable = queryable.Where(v =>
                    v.ShippingOrganizationCode.ToString().ToLower().Contains(normalizedQuery) ||
                    v.LegalName.ToLower().Contains(normalizedQuery) ||
                    v.AltName.ToLower().Contains(normalizedQuery) ||
                    v.Address.ToLower().Contains(normalizedQuery) ||
                    v.Taxnumber.Value.ToLower().Contains(normalizedQuery));

            return await queryable.ToListAsync();
        }

    }
}

