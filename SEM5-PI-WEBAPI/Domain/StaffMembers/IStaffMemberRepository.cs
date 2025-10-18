using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public interface IStaffMemberRepository : IRepository<StaffMember, StaffMemberId>
{
    Task<StaffMember?> GetByMecNumberAsync(MecanographicNumber mec);
    Task<List<StaffMember>> GetByNameAsync(string name);
    Task<List<StaffMember>> GetByStatusAsync(bool status);
    Task<List<StaffMember>> GetByQualificationsAsync(List<QualificationId> codes);
    Task<List<StaffMember>> GetByExactQualificationsAsync(List<QualificationId> codes);
    Task<bool> EmailIsInTheSystem(Email email);
    Task<bool> PhoneIsInTheSystem(PhoneNumber phone);
}