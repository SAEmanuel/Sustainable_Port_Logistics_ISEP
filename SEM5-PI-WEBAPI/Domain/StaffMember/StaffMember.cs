using SEM5_PI_WEBAPI.Domain.BusinessShared;

namespace SEM5_PI_WEBAPI.Domain.StaffMember;

public class StaffMember
{
    public Guid Id { get; }
    public string MecanographicNumber { get; }
    public string ShortName { get; set; }
    private Email Email { get; set; }
    private PhoneNumber Phone { get; set; }
    private Schedule Schedule { get; set; }
    private StaffMemberStatus Status { get; set; }

    public StaffMember(Guid id, string mecanographicNumber, string shortName, Email email, PhoneNumber phone,
        Schedule schedule, StaffMemberStatus status)
    {
        Id = id;
        MecanographicNumber = mecanographicNumber;
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        Status = status;
    }
}