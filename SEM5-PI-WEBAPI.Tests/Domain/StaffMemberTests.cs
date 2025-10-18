using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Tests.Domain;

public class StaffMemberTests
{
    private readonly MecanographicNumber _validMecNumber = new("1250001");
    private readonly Email _validEmail = new("valid@example.com");
    private readonly PhoneNumber _validPhone = new("+351914671555");
    private readonly Schedule _validSchedule = new(ShiftType.Morning, Schedule.ParseDaysFromBinary("1010101"));
    private readonly QualificationId _qualification1 = new(Guid.NewGuid());
    private readonly QualificationId _qualification2 = new(Guid.NewGuid());

    [Fact]
    public void CreateStaffMember_ValidData_ShouldInitializeProperties()
    {
        var qualifications = new List<QualificationId>{ _qualification1 };
        var staff = new StaffMember("ShortName", _validMecNumber, _validEmail, _validPhone, _validSchedule, qualifications);

        Assert.NotNull(staff.Id);
        Assert.Equal("ShortName", staff.ShortName);
        Assert.Equal(_validMecNumber, staff.MecanographicNumber);
        Assert.Equal(_validEmail, staff.Email);
        Assert.Equal(_validPhone, staff.Phone);
        Assert.Equal(_validSchedule, staff.Schedule);
        Assert.True(staff.IsActive);
        Assert.Contains(_qualification1, staff.Qualifications);
    }

    [Fact]
    public void CreateStaffMember_NullEmail_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() => 
            new StaffMember("Name", _validMecNumber, null!, _validPhone, _validSchedule));
    }

    [Fact]
    public void CreateStaffMember_NullPhone_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StaffMember("Name", _validMecNumber, _validEmail, null!, _validSchedule));
    }

    [Fact]
    public void CreateStaffMember_NullSchedule_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, null!));
    }

    [Fact]
    public void UpdateShortName_ValidName_ShouldUpdate()
    {
        var staff = new StaffMember("OldName", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        staff.UpdateShortName("NewName");

        Assert.Equal("NewName", staff.ShortName);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("           ")]
    [InlineData("ThisNameIsWayTooLongToBeValidBecauseItExceedsTwentyChars")]
    public void UpdateShortName_InvalidName_ShouldThrow(string invalidName)
    {
        var staff = new StaffMember("ValidName", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdateShortName(invalidName));
    }

    [Fact]
    public void UpdateEmail_ValidEmail_ShouldUpdate()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        var newEmail = new Email("newemail@example.com");

        staff.UpdateEmail(newEmail);

        Assert.Equal(newEmail, staff.Email);
    }

    [Fact]
    public void UpdateEmail_NullEmail_ShouldThrow()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdateEmail(null!));
    }

    [Fact]
    public void UpdatePhone_ValidPhone_ShouldUpdate()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        var newPhone = new PhoneNumber("+351987654321");

        staff.UpdatePhone(newPhone);

        Assert.Equal(newPhone, staff.Phone);
    }

    [Fact]
    public void UpdatePhone_NullPhone_ShouldThrow()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdatePhone(null!));
    }

    [Fact]
    public void UpdateSchedule_ValidSchedule_ShouldUpdate()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        var newSchedule = new Schedule(ShiftType.Evening, Schedule.ParseDaysFromBinary("0101010"));

        staff.UpdateSchedule(newSchedule);

        Assert.Equal(newSchedule, staff.Schedule);
    }

    [Fact]
    public void UpdateSchedule_NullSchedule_ShouldThrow()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdateSchedule(null!));
    }

    [Fact]
    public void ToggleStatus_ShouldToggleIsActiveFlag()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        bool initialStatus = staff.IsActive;

        staff.ToggleStatus();

        Assert.NotEqual(initialStatus, staff.IsActive);
    }

    [Fact]
    public void AddQualification_Valid_ShouldAddQualification()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        
        staff.AddQualification(_qualification1);
        staff.AddQualification(_qualification2);

        Assert.Contains(_qualification1, staff.Qualifications);
        Assert.Contains(_qualification2, staff.Qualifications);
    }

    [Fact]
    public void AddQualification_Duplicate_ShouldThrow()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        staff.AddQualification(_qualification1);

        Assert.Throws<BusinessRuleValidationException>(() => staff.AddQualification(_qualification1));
    }

    [Fact]
    public void RemoveQualification_Valid_ShouldRemoveQualification()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        staff.AddQualification(_qualification1);
        staff.AddQualification(_qualification2);

        staff.RemoveQualification(_qualification1);

        Assert.DoesNotContain(_qualification1, staff.Qualifications);
        Assert.Contains(_qualification2, staff.Qualifications);
    }

    [Fact]
    public void RemoveQualification_NotFound_ShouldThrow()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);

        Assert.Throws<BusinessRuleValidationException>(() => staff.RemoveQualification(_qualification1));
    }

    [Fact]
    public void Equals_SameId_ShouldReturnTrue()
    {
        var id = Guid.NewGuid();
        var staff1 = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        var staff2 = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        typeof(StaffMember).GetProperty("Id")!.SetValue(staff1, new StaffMemberId(id));
        typeof(StaffMember).GetProperty("Id")!.SetValue(staff2, new StaffMemberId(id));

        Assert.True(staff1.Equals(staff2));
    }

    [Fact]
    public void Equals_DifferentId_ShouldReturnFalse()
    {
        var staff1 = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);
        var staff2 = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);

        Assert.False(staff1.Equals(staff2));
    }

    [Fact]
    public void Equals_Null_ShouldReturnFalse()
    {
        var staff = new StaffMember("Name", _validMecNumber, _validEmail, _validPhone, _validSchedule);

        Assert.False(staff.Equals(null));
    }
}