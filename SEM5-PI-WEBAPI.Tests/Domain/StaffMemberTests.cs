using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;

public class StaffMemberTests
{
    private readonly MecanographicNumber validMecNumber = new("1250001");
    private readonly Email validEmail = new("valid@example.com");
    private readonly PhoneNumber validPhone = new("+351914671555");
    private readonly Schedule validSchedule = new(ShiftType.Morning, Schedule.ParseDaysFromBinary("1010101"));
    private readonly QualificationId qualification1 = new(Guid.NewGuid());
    private readonly QualificationId qualification2 = new(Guid.NewGuid());

    [Fact]
    public void CreateStaffMember_ValidData_ShouldInitializeProperties()
    {
        var qualifications = new List<QualificationId>{ qualification1 };
        var staff = new StaffMember("ShortName", validMecNumber, validEmail, validPhone, validSchedule, qualifications);

        Assert.NotNull(staff.Id);
        Assert.Equal("ShortName", staff.ShortName);
        Assert.Equal(validMecNumber, staff.MecanographicNumber);
        Assert.Equal(validEmail, staff.Email);
        Assert.Equal(validPhone, staff.Phone);
        Assert.Equal(validSchedule, staff.Schedule);
        Assert.True(staff.IsActive);
        Assert.Contains(qualification1, staff.Qualifications);
    }

    [Fact]
    public void CreateStaffMember_NullEmail_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() => 
            new StaffMember("Name", validMecNumber, null!, validPhone, validSchedule));
    }

    [Fact]
    public void CreateStaffMember_NullPhone_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StaffMember("Name", validMecNumber, validEmail, null!, validSchedule));
    }

    [Fact]
    public void CreateStaffMember_NullSchedule_ShouldThrow()
    {
        Assert.Throws<BusinessRuleValidationException>(() =>
            new StaffMember("Name", validMecNumber, validEmail, validPhone, null!));
    }

    [Fact]
    public void UpdateShortName_ValidName_ShouldUpdate()
    {
        var staff = new StaffMember("OldName", validMecNumber, validEmail, validPhone, validSchedule);
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
        var staff = new StaffMember("ValidName", validMecNumber, validEmail, validPhone, validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdateShortName(invalidName!));
    }

    [Fact]
    public void UpdateEmail_ValidEmail_ShouldUpdate()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        var newEmail = new Email("newemail@example.com");

        staff.UpdateEmail(newEmail);

        Assert.Equal(newEmail, staff.Email);
    }

    [Fact]
    public void UpdateEmail_NullEmail_ShouldThrow()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdateEmail(null!));
    }

    [Fact]
    public void UpdatePhone_ValidPhone_ShouldUpdate()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        var newPhone = new PhoneNumber("987654321");

        staff.UpdatePhone(newPhone);

        Assert.Equal(newPhone, staff.Phone);
    }

    [Fact]
    public void UpdatePhone_NullPhone_ShouldThrow()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdatePhone(null!));
    }

    [Fact]
    public void UpdateSchedule_ValidSchedule_ShouldUpdate()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        var newSchedule = new Schedule(ShiftType.Evening, Schedule.ParseDaysFromBinary("0101010"));

        staff.UpdateSchedule(newSchedule);

        Assert.Equal(newSchedule, staff.Schedule);
    }

    [Fact]
    public void UpdateSchedule_NullSchedule_ShouldThrow()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        Assert.Throws<BusinessRuleValidationException>(() => staff.UpdateSchedule(null!));
    }

    [Fact]
    public void ToggleStatus_ShouldToggleIsActiveFlag()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        bool initialStatus = staff.IsActive;

        staff.ToggleStatus();

        Assert.NotEqual(initialStatus, staff.IsActive);
    }

    [Fact]
    public void AddQualification_Valid_ShouldAddQualification()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        
        staff.AddQualification(qualification1);
        staff.AddQualification(qualification2);

        Assert.Contains(qualification1, staff.Qualifications);
        Assert.Contains(qualification2, staff.Qualifications);
    }

    [Fact]
    public void AddQualification_Duplicate_ShouldThrow()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        staff.AddQualification(qualification1);

        Assert.Throws<BusinessRuleValidationException>(() => staff.AddQualification(qualification1));
    }

    [Fact]
    public void RemoveQualification_Valid_ShouldRemoveQualification()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        staff.AddQualification(qualification1);
        staff.AddQualification(qualification2);

        staff.RemoveQualification(qualification1);

        Assert.DoesNotContain(qualification1, staff.Qualifications);
        Assert.Contains(qualification2, staff.Qualifications);
    }

    [Fact]
    public void RemoveQualification_NotFound_ShouldThrow()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);

        Assert.Throws<BusinessRuleValidationException>(() => staff.RemoveQualification(qualification1));
    }

    [Fact]
    public void Equals_SameId_ShouldReturnTrue()
    {
        var id = Guid.NewGuid();
        var staff1 = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        var staff2 = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        typeof(StaffMember).GetProperty("Id")!.SetValue(staff1, new StaffMemberId(id));
        typeof(StaffMember).GetProperty("Id")!.SetValue(staff2, new StaffMemberId(id));

        Assert.True(staff1.Equals(staff2));
    }

    [Fact]
    public void Equals_DifferentId_ShouldReturnFalse()
    {
        var staff1 = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);
        var staff2 = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);

        Assert.False(staff1.Equals(staff2));
    }

    [Fact]
    public void Equals_Null_ShouldReturnFalse()
    {
        var staff = new StaffMember("Name", validMecNumber, validEmail, validPhone, validSchedule);

        Assert.False(staff.Equals(null));
    }
}
