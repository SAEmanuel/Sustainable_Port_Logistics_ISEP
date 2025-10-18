using Microsoft.Extensions.Logging;

namespace SEM5_PI_WEBAPI.Tests.Services;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using Xunit;

public class StaffMemberServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IStaffMemberRepository> _staffRepoMock = new();
    private readonly Mock<IQualificationRepository> _qualRepoMock = new();
    private readonly Mock<ILogger<StaffMemberService>> _loggerMock = new();
    private readonly StaffMemberService _service;

    public StaffMemberServiceTests()
    {
        
        _service = new StaffMemberService(_unitOfWorkMock.Object,
                                            _staffRepoMock.Object, 
                                            _qualRepoMock.Object, _loggerMock.Object);
    }

    private StaffMember CreateStaffMember(string mec = "1234567")
    {
        return new StaffMember("TestUser",
            new MecanographicNumber(mec),
            new Email("test@example.com"),
            new PhoneNumber("+351912345678"),
            new Schedule(ShiftType.Morning, WeekDays.AllWeek));
    }

    private Qualification CreateQualification(string code = "QLF-001")
    {
        return new Qualification("Test Qualification")
        {
            Code = code
        };
    }

    [Fact]
    public async Task AddAsync_ShouldReturnDto_WhenValid()
    {
        _staffRepoMock.Setup(r => r.EmailIsInTheSystem(It.IsAny<Email>())).ReturnsAsync(false);
        _staffRepoMock.Setup(r => r.PhoneIsInTheSystem(It.IsAny<PhoneNumber>())).ReturnsAsync(false);
        _staffRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<StaffMember>());

        var qualification = CreateQualification();
        _qualRepoMock.Setup(r => r.GetQualificationByCodeAsync(It.IsAny<string>())).ReturnsAsync(qualification);
        
        _staffRepoMock.Setup(r => r.AddAsync(It.IsAny<StaffMember>()))
            .ReturnsAsync((StaffMember staff) => staff);
        
        _unitOfWorkMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

        _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(qualification);

        var dto = new CreatingStaffMemberDto("TestUser", "test@example.com", "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            new List<string> { qualification.Code });

        var result = await _service.AddAsync(dto);

        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(dto.ShortName, result.ShortName);
        Assert.Equal(dto.Email, result.Email);
    }


    [Fact]
    public async Task GetByIdAsync_ShouldReturnDto_WhenFound()
    {
        var staff = CreateStaffMember();
        var qualification = CreateQualification();

        _staffRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<StaffMemberId>())).ReturnsAsync(staff);
        _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(qualification);

        var result = await _service.GetByIdAsync(new StaffMemberId(staff.Id.Value));

        Assert.NotNull(result);
        Assert.Equal(staff.ShortName, result.ShortName);
    }

    [Fact]
    public async Task ToggleAsync_ShouldReturnDtoWithToggledStatus()
    {
        var staff = CreateStaffMember();
        var qualification = CreateQualification();

        _staffRepoMock.Setup(r => r.GetByMecNumberAsync(It.IsAny<MecanographicNumber>())).ReturnsAsync(staff);
        _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(qualification);
        _unitOfWorkMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);


        var beforeStatus = staff.IsActive;
        var result = await _service.ToggleAsync(staff.MecanographicNumber.Value);

        Assert.NotNull(result);
        Assert.NotEqual(beforeStatus, result.IsActive);
    }

    [Fact]
public async Task GetByMecNumberAsync_ShouldReturnDto_WhenFound()
{
    var staff = CreateStaffMember();
    _staffRepoMock.Setup(r => r.GetByMecNumberAsync(It.IsAny<MecanographicNumber>())).ReturnsAsync(staff);
    _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(CreateQualification());

    var result = await _service.GetByMecNumberAsync(staff.MecanographicNumber.Value);

    Assert.NotNull(result);
    Assert.Equal(staff.ShortName, result.ShortName);
}

[Fact]
public async Task GetByNameAsync_ShouldReturnDtos()
{
    var staffList = new List<StaffMember> { CreateStaffMember(), CreateStaffMember("1234568") };
    _staffRepoMock.Setup(r => r.GetByNameAsync(It.IsAny<string>())).ReturnsAsync(staffList);
    _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(CreateQualification());

    var result = await _service.GetByNameAsync("test");

    Assert.Equal(2, result.Count);
}

[Fact]
public async Task GetByStatusAsync_ShouldReturnDtos()
{
    var staffList = new List<StaffMember> { CreateStaffMember(), CreateStaffMember("1234568") };
    _staffRepoMock.Setup(r => r.GetByStatusAsync(It.IsAny<bool>())).ReturnsAsync(staffList);
    _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(CreateQualification());

    var result = await _service.GetByStatusAsync(true);

    Assert.Equal(2, result.Count);
}

[Fact]
public async Task GetByQualificationsAsync_ShouldReturnDtos()
{
    var codes = new List<string> { "QLF-001" };
    var qualificationId = new QualificationId(Guid.NewGuid());
    var staffList = new List<StaffMember> { CreateStaffMember() };

    _qualRepoMock.Setup(r => r.GetQualificationByCodeAsync(It.IsAny<string>()))
        .ReturnsAsync(CreateQualification());
    _staffRepoMock.Setup(r => r.GetByQualificationsAsync(It.IsAny<List<QualificationId>>()))
        .ReturnsAsync(staffList);
    _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(CreateQualification());

    var result = await _service.GetByQualificationsAsync(codes);

    Assert.Single(result);
}

[Fact]
public async Task GetByExactQualificationsAsync_ShouldReturnDtos()
{
    var codes = new List<string> { "QLF-001" };
    var qualificationId = new QualificationId(Guid.NewGuid());
    var staffList = new List<StaffMember> { CreateStaffMember() };

    _qualRepoMock.Setup(r => r.GetQualificationByCodeAsync(It.IsAny<string>()))
        .ReturnsAsync(CreateQualification());
    _staffRepoMock.Setup(r => r.GetByExactQualificationsAsync(It.IsAny<List<QualificationId>>()))
        .ReturnsAsync(staffList);
    _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(CreateQualification());

    var result = await _service.GetByExactQualificationsAsync(codes);

    Assert.Single(result);
}

[Fact]
public async Task UpdateAsync_ShouldUpdateAndReturnDto_WhenValid()
{
    var staff = CreateStaffMember();
    var qualification = CreateQualification();

    _staffRepoMock.Setup(r => r.GetByMecNumberAsync(It.IsAny<MecanographicNumber>())).ReturnsAsync(staff);
    _qualRepoMock.Setup(r => r.GetQualificationByCodeAsync(It.IsAny<string>())).ReturnsAsync(qualification);
    _unitOfWorkMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);
    _qualRepoMock.Setup(q => q.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(qualification);

    var updateDto = new UpdateStaffMemberDto
    {
        MecNumber = staff.MecanographicNumber.Value,
        ShortName = "NewName",
        Email = "newemail@example.com",
        Phone = "+351900000000",
        Schedule = new ScheduleDto(ShiftType.Evening, "0101010"),
        IsActive = false,
        QualificationCodes = new List<string> { qualification.Code },
        AddQualifications = true
    };

    var result = await _service.UpdateAsync(updateDto);

    Assert.NotNull(result);
    Assert.Equal(updateDto.ShortName, result.ShortName);
    Assert.Equal(updateDto.Email, result.Email);
    Assert.Equal(updateDto.IsActive.Value, result.IsActive);
}

[Fact]
public async Task UpdateAsync_ShouldThrow_WhenAddQualificationsNullAndQualificationCodesSet()
{
    var staff = CreateStaffMember();
    _staffRepoMock.Setup(r => r.GetByMecNumberAsync(It.IsAny<MecanographicNumber>())).ReturnsAsync(staff);

    var updateDto = new UpdateStaffMemberDto
    {
        MecNumber = staff.MecanographicNumber.Value,
        QualificationCodes = new List<string> { "QLF-001" }
    };

    await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.UpdateAsync(updateDto));
}

}

