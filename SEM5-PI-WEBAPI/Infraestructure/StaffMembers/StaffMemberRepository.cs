using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.Shared;

namespace SEM5_PI_WEBAPI.Infraestructure.StaffMembers;

public class StaffMemberRepository : BaseRepository<StaffMember, StaffMemberId>, IStaffMemberRepository
{
    public StaffMemberRepository(DddSample1DbContext context):base(context.StaffMember)
    {
    }
}