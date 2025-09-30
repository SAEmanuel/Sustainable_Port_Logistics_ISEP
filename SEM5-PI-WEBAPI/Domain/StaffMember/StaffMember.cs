using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StaffMember;

public class StaffMember : Entity<StaffMemberId>
{
    
    [MaxLength(20)]
    public string ShortName { get; set; }
    public string? MecanographicNumber { get; private set; }
    private Email Email { get; set; }
    private PhoneNumber Phone { get; set; }
    private Schedule Schedule { get; set; }
    private StaffMemberStatus Status { get; set; }
    
    private readonly List<Qualification> _qualifications = new();
    public IReadOnlyCollection<Qualification> Qualifications => _qualifications.AsReadOnly();

    public StaffMember(string shortName, Email email, PhoneNumber phone,
        Schedule schedule, StaffMemberStatus status)
    {
        Id = new StaffMemberId(Guid.NewGuid());
        ShortName = shortName;
        Email = email;
        Phone = phone;
        Schedule = schedule;
        Status = status;
    }

    public void UpdateShortName(string newShortName)
    {
        if (string.IsNullOrWhiteSpace(newShortName))
            throw new ArgumentException("ShortName cannot be empty");
        ShortName = newShortName;
    }

    public void UpdateEmail(Email newEmail)
    {
        Email = newEmail ?? throw new ArgumentNullException(nameof(newEmail));
    }

    public void UpdatePhone(PhoneNumber newPhone)
    {
        Phone = newPhone ?? throw new ArgumentNullException(nameof(newPhone));
    }

    public void UpdateSchedule(Schedule newSchedule)
    {
        Schedule = newSchedule ?? throw new ArgumentNullException(nameof(newSchedule));
    }

    public void UpdateStatus(StaffMemberStatus newStatus)
    {
        Status = newStatus;
    }
    
    public void AddQualification(Qualification qualification)
    {
        if (qualification == null)
            throw new ArgumentNullException(nameof(qualification));
        if (!_qualifications.Contains(qualification))
            _qualifications.Add(qualification);
    }

    public void RemoveQualification(Qualification qualification)
    {
        if (qualification == null)
            throw new ArgumentNullException(nameof(qualification));
        _qualifications.Remove(qualification);
    }
    
    public override bool Equals(object obj)
    {
        if (obj is StaffMember other)
            return Id == other.Id;
        return false;
    }

    public override int GetHashCode() => Id.GetHashCode();
    
}

