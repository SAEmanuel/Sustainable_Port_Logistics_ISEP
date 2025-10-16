namespace SEM5_PI_WEBAPI.Tests.Services;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using Xunit;

public class StaffMemberServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IStaffMemberRepository> _repoMock;
    private readonly Mock<IQualificationRepository> _qualRepoMock;
    private readonly StaffMemberService _service;

    public StaffMemberServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _repoMock = new Mock<IStaffMemberRepository>();
        _qualRepoMock = new Mock<IQualificationRepository>();
        _service = new StaffMemberService(_unitOfWorkMock.Object, _repoMock.Object, _qualRepoMock.Object);
    }

    private StaffMember MakeStaff(string mec = "1234567")
    {
        return new StaffMember("Test", new MecanographicNumber(mec), new Email("test@test.com"),
            new PhoneNumber("+351912345678"),
            new Schedule(ShiftType.Morning, WeekDays.AllWeek));
    }

    private Qualification MakeQualification(string code)
    {
        Qualification q = new Qualification("Test");
        q.UpdateCode("QLF-001");
        return q;
    }

    [Fact]
    public async Task GetAllAsync_ReturnsDtos()
    {
        var staffList = new List<StaffMember> { MakeStaff(), MakeStaff("1244567") };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(staffList);
        _qualRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<QualificationId>()))
            .ReturnsAsync(new Qualification("Test") { Code = "QLF-001" });

        var dtos = await _service.GetAllAsync();

        Assert.Equal(2, dtos.Count);
        Assert.All(dtos, d => Assert.NotNull(d.Id));
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<StaffMemberId>())).ReturnsAsync((StaffMember?)null);

        var result = await _service.GetByIdAsync(new StaffMemberId(Guid.NewGuid()));

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsDto_WhenFound()
    {
        var staff = MakeStaff();
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<StaffMemberId>())).ReturnsAsync(staff);
        _qualRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<QualificationId>()))
            .ReturnsAsync(new Qualification("Test") { Code = "QLF-001" });

        var result = await _service.GetByIdAsync(new StaffMemberId(Guid.NewGuid()));

        Assert.NotNull(result);
        Assert.Equal(staff.ShortName, result.ShortName);
    }

    [Fact]
    public async Task AddAsync_ThrowsIfEmailIsRepeated()
    {
        _repoMock.Setup(r => r.EmailIsInTheSystem(It.IsAny<Email>())).ReturnsAsync(true);

        var dto = new CreatingStaffMemberDto("Test", "test@test.com", "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"), true, new List<string>());

        await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
            _service.AddAsync(dto));
    }

    [Fact]
    public async Task AddAsync_ReturnsDto_WhenValid()
    {
        _repoMock.Setup(r => r.EmailIsInTheSystem(It.IsAny<Email>())).ReturnsAsync(false);
        _repoMock.Setup(r => r.PhoneIsInTheSystem(It.IsAny<PhoneNumber>())).ReturnsAsync(false);
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<StaffMember>());
        _qualRepoMock.Setup(r => r.GetQualificationByCodeAsync(It.IsAny<string>()))
            .ReturnsAsync(new Qualification("Test") { Code = "QLF-001"});

        _repoMock.Setup(r => r.AddAsync(It.IsAny<StaffMember>())).Returns(Task.CompletedTask as Task<StaffMember>);
        _unitOfWorkMock.Setup(u => u.CommitAsync()).Returns(Task.CompletedTask as Task<int>);

        var dto = new CreatingStaffMemberDto("Test", "test@test.com", "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"), true, new List<string> { "QLF-001" });

        var result = await _service.AddAsync(dto);

        Assert.NotNull(result.Id);
        Assert.Equal("Test", result.ShortName);
        Assert.Contains("test@test.com", result.Email);
    }


    [Fact]
    public async Task ToggleAsync_ReturnsNull_WhenNotFound()
    {
        _repoMock.Setup(r => r.GetByMecNumberAsync(It.IsAny<MecanographicNumber>())).ReturnsAsync((StaffMember?)null);

        var result = await _service.ToggleAsync("1234567");

        Assert.Null(result);
    }

    [Fact]
    public async Task ToggleAsync_TogglesStatusAndReturnsDto()
    {
        var staff = MakeStaff();
        _repoMock.Setup(r => r.GetByMecNumberAsync(It.IsAny<MecanographicNumber>())).ReturnsAsync(staff);
        _qualRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<QualificationId>()))
            .ReturnsAsync(new Qualification("Test") { Code = "QLF-001" });
        _unitOfWorkMock.Setup(u => u.CommitAsync()).Returns((Task<int>)Task.CompletedTask);

        var result = await _service.ToggleAsync("1234567");

        Assert.NotNull(result);
        Assert.Equal(staff.ShortName, result.ShortName);
    }
}
