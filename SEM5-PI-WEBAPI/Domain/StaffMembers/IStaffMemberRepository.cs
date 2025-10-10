using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public interface IStaffMemberRepository : IRepository<StaffMember, StaffMemberId>
{
    Task<StaffMember?> GetByMecNumberAsync(string mec);
    Task<List<StaffMember>> GetByNameAsync(string name);
    Task<List<StaffMember>> GetByStatusAsync(bool status);
    Task<List<StaffMember>> GetByQualificationsAsync(List<QualificationId> ids);
    Task<List<StaffMember>> GetByExactQualificationsAsync(List<QualificationId> ids);
}