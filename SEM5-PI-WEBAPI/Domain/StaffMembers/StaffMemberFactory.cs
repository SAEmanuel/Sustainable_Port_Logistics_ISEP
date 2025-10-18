using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMemberFactory
{
    public static StaffMember CreateStaffMember(
        CreatingStaffMemberDto dto,
        MecanographicNumber mecanographicNumber,
        IEnumerable<QualificationId> qualificationIds)
    {
        var email = new Email(dto.Email);
        var phone = new PhoneNumber(dto.Phone);
        var schedule = dto.Schedule.ToDomain();

        return new StaffMember(
            dto.ShortName,
            mecanographicNumber,
            email,
            phone,
            schedule,
            qualificationIds
        );
    }

    public static StaffMemberDto CreateStaffMemberDto(
        StaffMember staffMember,
        List<string> qualificationCodes)
    {
        var scheduleDto = new ScheduleDto(
            staffMember.Schedule.Shift,
            staffMember.Schedule.DaysToBinary()
        );

        return new StaffMemberDto(
            staffMember.Id.AsGuid(),
            staffMember.ShortName,
            staffMember.MecanographicNumber.ToString(),
            staffMember.Email.Address,
            staffMember.Phone.Number,
            scheduleDto,
            staffMember.IsActive,
            qualificationCodes
        );
    }

    public static List<StaffMemberDto> CreateStaffMemberDtoList(
        List<StaffMember> staffMembers,
        Dictionary<Guid, List<string>> qualificationCodesByStaffId)
    {
        return staffMembers.Select(sm =>
        {
            var qualificationCodes = qualificationCodesByStaffId.TryGetValue(sm.Id.AsGuid(), out var codes)
                ? codes
                : new List<string>();

            return CreateStaffMemberDto(sm, qualificationCodes);
        }).ToList();
    }
}