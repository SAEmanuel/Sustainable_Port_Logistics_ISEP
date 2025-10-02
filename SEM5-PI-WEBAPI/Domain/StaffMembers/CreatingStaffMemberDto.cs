using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class CreatingStaffMemberDto
{
    public string ShortName { get; set; }
    public Email Email { get; set; }
    public PhoneNumber Phone { get; set; }
    public Schedule Schedule { get; set; }
    public bool IsActive { get; set; }
    public List<Qualification> Qualifications { get; }

    public CreatingStaffMemberDto(string shortName, Email email, PhoneNumber phone, Schedule schedule, bool isActive, List<Qualification> qualifications)
    {
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        IsActive = isActive;
        Qualifications = qualifications;
    }
}