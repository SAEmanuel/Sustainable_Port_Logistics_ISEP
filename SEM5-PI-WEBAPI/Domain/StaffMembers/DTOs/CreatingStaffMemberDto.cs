using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;

public class CreatingStaffMemberDto
{
    public string ShortName { get; set; }
    public Email Email { get; set; }
    public PhoneNumber Phone { get; set; }
    public Schedule Schedule { get; set; }
    public bool IsActive { get; set; }
    public List<string>? QualificationCodes { get; set; }

    public CreatingStaffMemberDto(string shortName, Email email, PhoneNumber phone, Schedule schedule, bool isActive, List<string>? qualificationCodes)
    {
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        IsActive = isActive;
        QualificationCodes = qualificationCodes;
    }
}