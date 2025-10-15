using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Infraestructure.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Infraestructure.ShippingAgentRepresentatives
{
    public class ShippingAgentRepresentativeRepository : BaseRepository<ShippingAgentRepresentative, ShippingAgentRepresentativeId>, IShippingAgentRepresentativeRepository
    {
        private readonly DddSample1DbContext _context;
        public ShippingAgentRepresentativeRepository(DddSample1DbContext context) : base(context.ShippingAgentRepresentative)
        {
            _context = context;
        }

        public async Task<List<ShippingAgentRepresentative>> GetAllSarBySaoAsync(ShippingOrganizationCode organizationCode)
        {
            return await _context.ShippingAgentRepresentative.Where(s => s.SAO.Value == organizationCode.Value).ToListAsync();
        }

        public async Task<ShippingAgentRepresentative?> GetByNameAsync(string name)
        {
            return await _context.ShippingAgentRepresentative
                .FirstOrDefaultAsync(x => x.Name.ToLower().Trim() == name.ToLower().Trim());
        }

        public async Task<ShippingAgentRepresentative?> GetByCitizenIdAsync(string cId)
        {
            return await _context.ShippingAgentRepresentative
                .FirstOrDefaultAsync(x => x.CitizenId.ToLower().Trim() == cId.ToLower().Trim());
        }
        
        public async Task<ShippingAgentRepresentative?> GetByEmailAsync(string email)
        {
            return await _context.ShippingAgentRepresentative
                .FirstOrDefaultAsync(x => x.Email.ToLower().Trim() == email.ToLower().Trim());
        }

        public async Task<ShippingAgentRepresentative?> GetByStatusAsync(Status status)
        {
            return await _context.ShippingAgentRepresentative
                .FirstOrDefaultAsync(x => x.Status == status);
        }

        public async Task<ShippingAgentRepresentative?> GetBySaoAsync(ShippingOrganizationCode sao)
        {
            return await _context.ShippingAgentRepresentative
                .FirstOrDefaultAsync(x => x.SAO.Value.ToString().ToLower().Trim() == sao.Value.ToString().ToLower().Trim());
        }

        public async Task<List<ShippingAgentRepresentative>> GetFilterAsync(string? name, string? citizenId, string? nationality, string? email, string? phoneNumber,Status? status,ShippingOrganizationCode? sao, string? query)
        {
            var normalizedName = name?.Trim().ToLower();
            var normalizedCitizendId = citizenId?.Trim().ToLower();
            var normalizedNationality = nationality?.Trim().ToLower();
            var normalizedEmail = email?.Trim().ToLower();
            var normalizedPhoneNumber = phoneNumber?.Trim().ToLower();
            var normalizedQuery = query?.Trim().ToLower();

            var queryable = _context.ShippingAgentRepresentative.AsQueryable();

            if (!string.IsNullOrEmpty(normalizedName))
                queryable = queryable.Where(v => v.Name.ToLower().Contains(normalizedName));

            if (!string.IsNullOrEmpty(normalizedCitizendId))
                queryable = queryable.Where(v => v.CitizenId.ToLower().Contains(normalizedCitizendId));

            if (!string.IsNullOrEmpty(normalizedNationality))
                queryable = queryable.Where(v => v.Nationality.ToLower().Contains(normalizedNationality));

            if (!string.IsNullOrEmpty(normalizedEmail))
                queryable = queryable.Where(v => v.Email.ToLower().Contains(normalizedEmail));

            if (!string.IsNullOrEmpty(normalizedPhoneNumber))
                queryable = queryable.Where(v => v.PhoneNumber.ToLower().Contains(normalizedPhoneNumber));

            if (status != null)
                queryable = queryable.Where(v => v.Status == status);

            if (sao != null)
                queryable = queryable.Where(v => v.SAO == sao);

            if (!string.IsNullOrEmpty(normalizedQuery))
                queryable = queryable.Where(v =>
                    v.Name.ToLower().Contains(normalizedQuery) ||
                    v.CitizenId.ToLower().Contains(normalizedQuery) ||
                    v.Nationality.ToLower().Contains(normalizedQuery) ||
                    v.Email.ToLower().Contains(normalizedQuery) ||
                    v.PhoneNumber.ToLower().Contains(normalizedQuery) ||
                    v.Status == status ||
                    v.SAO == sao);

            return await queryable.ToListAsync();
        }

      
    }
}

