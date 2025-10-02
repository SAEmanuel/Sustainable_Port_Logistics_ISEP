using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMemberDto
{
    public Guid Id { get; set; }
    public string ShortName { get; set; }
    public string MecanographicNumber { get; private set; }
    public Email Email { get; set; }
    public PhoneNumber Phone { get; set; }
    public Schedule Schedule { get; set; }
    public bool IsActive { get; set; }
    public List<QualificationId> QualificationIds { get; }  // <-- só os IDs

    public StaffMemberDto(
        Guid id,
        string shortName,
        string mecanographicNumber,
        Email email,
        PhoneNumber phone,
        Schedule schedule,
        bool isActive,
        List<QualificationId> qualificationIds)
    {
        Id = id;
        ShortName = shortName;
        MecanographicNumber = mecanographicNumber;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        IsActive = isActive;
        QualificationIds = qualificationIds;
    }
}