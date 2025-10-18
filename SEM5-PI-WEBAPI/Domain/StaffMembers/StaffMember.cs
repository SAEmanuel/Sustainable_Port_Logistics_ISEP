using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMember : Entity<StaffMemberId>, IAggregateRoot
{
    private readonly int _maxLengthShortName = 20;
    
    public string ShortName { get; private set; }
    public MecanographicNumber MecanographicNumber { get; private set; }
    public Email Email { get; private set; }
    public PhoneNumber Phone { get; private set; }
    public Schedule Schedule { get; private set; }
    public bool IsActive { get; set; }

    
    private readonly List<QualificationId> _qualifications = new();
    public IReadOnlyCollection<QualificationId> Qualifications => _qualifications.AsReadOnly();

    protected StaffMember() { }

    public StaffMember(
        string shortName,
        MecanographicNumber mecanographicNumber,
        Email email,
        PhoneNumber phone,
        Schedule schedule,
        IEnumerable<QualificationId>? qualifications = null)
    {
        Id = new StaffMemberId(Guid.NewGuid());
        ShortName = shortName;
        MecanographicNumber = mecanographicNumber;
        Email = email ?? throw new BusinessRuleValidationException("Email is required.");
        Phone = phone ?? throw new BusinessRuleValidationException("Phone number is required.");
        Schedule = schedule ?? throw new BusinessRuleValidationException("Schedule is required.");
        IsActive = true;

        if (qualifications != null)
            _qualifications = new List<QualificationId>(qualifications);
    }

    public void UpdateShortName(string newShortName)
    {
        if (string.IsNullOrWhiteSpace(newShortName) || newShortName.Length > _maxLengthShortName)
            throw new BusinessRuleValidationException("ShortName cannot be empty and must have at most 20 characters.");
        ShortName = newShortName;
    }

    public void UpdateEmail(Email newEmail)
    {
        Email = newEmail ?? throw new BusinessRuleValidationException("Invalid email!");
    }

    public void UpdatePhone(PhoneNumber newPhone)
    {
        Phone = newPhone ?? throw new BusinessRuleValidationException("Invalid Phone number!");
    }

    public void UpdateSchedule(Schedule newSchedule)
    {
        Schedule = newSchedule ?? throw new BusinessRuleValidationException("Invalid Schedule!");
    }

    public void ToggleStatus()
    {
        IsActive = !IsActive;
    }
    

    public void AddQualification(QualificationId qualification)
    {
        if (_qualifications.Contains(qualification))
            throw new BusinessRuleValidationException("Duplicated Qualification, not added.");
        _qualifications.Add(qualification);
    }

    public void RemoveQualification(QualificationId qualification)
    {
        if (!_qualifications.Remove(qualification))
            throw new BusinessRuleValidationException("Qualification not found. Not removed!");
    }
    
    public void SetQualifications(IEnumerable<QualificationId> qualificationIds)
    {
        _qualifications.Clear();
        _qualifications.AddRange(qualificationIds);
    }


    public override bool Equals(object? obj)
    {
        if (obj is StaffMember other)
            return Id == other.Id;
        return false;
    }

    public override int GetHashCode() => Id.GetHashCode();
}
