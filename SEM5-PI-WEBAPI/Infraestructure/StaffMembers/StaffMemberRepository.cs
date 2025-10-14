using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.StaffMembers;

public class StaffMemberRepository : BaseRepository<StaffMember, StaffMemberId>, IStaffMemberRepository
{
    private readonly DbSet<StaffMember> _staffMembers;

    public StaffMemberRepository(DddSample1DbContext context) : base(context.StaffMember)
    {
        _staffMembers = context.StaffMember;
    }

    public async Task<List<StaffMember>> GetAllAsync()
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .ToListAsync();
    }

    public async Task<StaffMember?> GetByIdAsync(StaffMemberId id)
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<StaffMember?> GetByMecNumberAsync(MecanographicNumber mec)
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .FirstOrDefaultAsync(s => s.MecanographicNumber.Equals(mec));
    }

    public async Task<List<StaffMember>> GetByNameAsync(string name)
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .Where(s => s.ShortName.ToLower().Contains(name.ToLower()))
            .ToListAsync();
    }


    public async Task<List<StaffMember>> GetByStatusAsync(bool status)
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .Where(s => s.IsActive == status)
            .ToListAsync();
    }

    public async Task<List<StaffMember>> GetByQualificationsAsync(List<QualificationId> ids)
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .Where(s => s.Qualifications.Any(q => ids.Contains(q)))
            .ToListAsync();
    }

    public async Task<List<StaffMember>> GetByExactQualificationsAsync(List<QualificationId> ids)
    {
        return await _staffMembers
            .Include(s => s.Qualifications)
            .Where(s =>
                s.Qualifications.Count == ids.Count &&
                ids.All(qualId => s.Qualifications.Any(q => q == qualId))
            )
            .ToListAsync();
    }
}