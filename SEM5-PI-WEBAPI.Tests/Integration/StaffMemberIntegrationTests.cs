using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.BusinessShared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using Microsoft.AspNetCore.Mvc;

namespace SEM5_PI_WEBAPI.Tests.Integration;


public class StaffMemberIntegrationTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IStaffMemberRepository> _staffRepoMock;
    private readonly Mock<IQualificationRepository> _qualRepoMock;
    private readonly StaffMemberService _service;
    private readonly StaffMembersController _controller;

    public StaffMemberIntegrationTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _staffRepoMock = new Mock<IStaffMemberRepository>();
        _qualRepoMock = new Mock<IQualificationRepository>();
        
        var serviceLogger = new Mock<ILogger<StaffMemberService>>().Object;
        _service = new StaffMemberService(_unitOfWorkMock.Object, _staffRepoMock.Object, 
            _qualRepoMock.Object, serviceLogger);
        
        var controllerLogger = new Mock<ILogger<StaffMembersController>>().Object;
        _controller = new StaffMembersController(_service, controllerLogger);
    }

    #region CREATE Tests

    [Fact]
    public async Task CreateStaffMember_ValidData_ReturnsCreatedResult()
    {
        // Arrange
        var qualification = new Qualification("Test Qual") { Code = "QLF-001" };
    
        _qualRepoMock.Setup(x => x.GetQualificationByCodeAsync("QLF-001"))
            .ReturnsAsync(qualification);
        _qualRepoMock.Setup(x => x.GetByIdAsync(qualification.Id))
            .ReturnsAsync(qualification);
        _staffRepoMock.Setup(x => x.EmailIsInTheSystem(It.IsAny<Email>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.PhoneIsInTheSystem(It.IsAny<PhoneNumber>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<StaffMember>()); 
        _unitOfWorkMock.Setup(x => x.CommitAsync())
            .ReturnsAsync(1);

        var dto = new CreatingStaffMemberDto(
            "TestUser",
            "test@example.com",
            "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            new List<string> { "QLF-001" }
        );

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(createdResult.Value);
    
        Assert.Equal("TestUser", value.ShortName);
        Assert.Equal("test@example.com", value.Email);
        Assert.Contains("QLF-001", value.QualificationCodes);
    
        _staffRepoMock.Verify(x => x.AddAsync(It.IsAny<StaffMember>()), Times.Once);
        _unitOfWorkMock.Verify(x => x.CommitAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateStaffMember_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.EmailIsInTheSystem(It.IsAny<Email>()))
            .ReturnsAsync(true); 

        var dto = new CreatingStaffMemberDto(
            "TestUser",
            "duplicate@example.com",
            "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            null
        );

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleValidationException>(
            async () => await _service.AddAsync(dto)
        );
        
        _staffRepoMock.Verify(x => x.AddAsync(It.IsAny<StaffMember>()), Times.Never);
    }

    [Fact]
    public async Task CreateStaffMember_DuplicatePhone_ReturnsBadRequest()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.EmailIsInTheSystem(It.IsAny<Email>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.PhoneIsInTheSystem(It.IsAny<PhoneNumber>()))
            .ReturnsAsync(true); 

        var dto = new CreatingStaffMemberDto(
            "TestUser",
            "test@example.com",
            "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            null
        );

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleValidationException>(
            async () => await _service.AddAsync(dto)
        );
        
        _staffRepoMock.Verify(x => x.AddAsync(It.IsAny<StaffMember>()), Times.Never);
    }

    [Fact]
    public async Task CreateStaffMember_InvalidQualification_ThrowsException()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.EmailIsInTheSystem(It.IsAny<Email>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.PhoneIsInTheSystem(It.IsAny<PhoneNumber>()))
            .ReturnsAsync(false);
        _qualRepoMock.Setup(x => x.GetQualificationByCodeAsync("INVALID"))
            .ReturnsAsync((Qualification)null); // ❌ Qualification não existe

        var dto = new CreatingStaffMemberDto(
            "TestUser",
            "test@example.com",
            "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            new List<string> { "INVALID" }
        );

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BusinessRuleValidationException>(
            async () => await _service.AddAsync(dto)
        );
        Assert.Contains("Invalid Qualification Code", exception.Message);
    }

    [Fact]
    public async Task CreateStaffMember_WithMultipleQualifications_Succeeds()
    {
        // Arrange
        var qual1 = new Qualification("Crane Operator") { Code = "QLF-001" };
        var qual2 = new Qualification("Truck Driver") { Code = "QLF-002" };
        
        _qualRepoMock.Setup(x => x.GetQualificationByCodeAsync("QLF-001"))
            .ReturnsAsync(qual1);
        _qualRepoMock.Setup(x => x.GetQualificationByCodeAsync("QLF-002"))
            .ReturnsAsync(qual2);
        _qualRepoMock.Setup(x => x.GetByIdAsync(qual1.Id))
            .ReturnsAsync(qual1);
        _qualRepoMock.Setup(x => x.GetByIdAsync(qual2.Id))
            .ReturnsAsync(qual2);
        _staffRepoMock.Setup(x => x.EmailIsInTheSystem(It.IsAny<Email>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.PhoneIsInTheSystem(It.IsAny<PhoneNumber>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<StaffMember>());
        _unitOfWorkMock.Setup(x => x.CommitAsync())
            .ReturnsAsync(1);

        var dto = new CreatingStaffMemberDto(
            "MultiQualUser",
            "multi@example.com",
            "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            new List<string> { "QLF-001", "QLF-002" }
        );

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(createdResult.Value);
        Assert.Equal(2, value.QualificationCodes.Count);
        Assert.Contains("QLF-001", value.QualificationCodes);
        Assert.Contains("QLF-002", value.QualificationCodes);
    }

    [Fact]
    public async Task CreateStaffMember_GeneratesMecanographicNumber()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.EmailIsInTheSystem(It.IsAny<Email>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.PhoneIsInTheSystem(It.IsAny<PhoneNumber>()))
            .ReturnsAsync(false);
        _staffRepoMock.Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<StaffMember>());
        _unitOfWorkMock.Setup(x => x.CommitAsync())
            .ReturnsAsync(1);

        var dto = new CreatingStaffMemberDto(
            "TestUser",
            "test@example.com",
            "+351912345678",
            new ScheduleDto(ShiftType.Morning, "1111111"),
            true,
            null
        );

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(createdResult.Value);
        
        Assert.Matches(@"^1\d{6}$", value.MecanographicNumber);
    }

    #endregion

    #region GET Tests

    [Fact]
    public async Task GetAll_ReturnsAllStaffMembers()
    {
        // Arrange
        var staff1 = CreateStaffMember("User1", "user1@example.com", "+351911111111");
        var staff2 = CreateStaffMember("User2", "user2@example.com", "+351922222222");
        
        _staffRepoMock.Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<StaffMember> { staff1, staff2 });

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<StaffMemberDto>>(okResult.Value);
        Assert.Equal(2, value.Count);
    }

    [Fact]
    public async Task GetAll_EmptyRepository_ReturnsEmptyList()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<StaffMember>());

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<StaffMemberDto>>(okResult.Value);
        Assert.Empty(value);
    }

    [Fact]
    public async Task GetById_ExistingStaff_ReturnsStaff()
    {
        // Arrange
        var staff = CreateStaffMember("TestUser", "test@example.com", "+351912345678");
        
        _staffRepoMock.Setup(x => x.GetByIdAsync(staff.Id))
            .ReturnsAsync(staff);

        // Act
        var result = await _controller.GetById(staff.Id.AsGuid());

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(okResult.Value);
        Assert.Equal("TestUser", value.ShortName);
    }

    [Fact]
    public async Task GetById_NonExisting_ReturnsNotFound()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<StaffMemberId>()))
            .ReturnsAsync((StaffMember)null);

        // Act
        var result = await _controller.GetById(Guid.NewGuid());

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetByMecanographicNumber_ExistingStaff_ReturnsStaff()
    {
        // Arrange
        var staff = CreateStaffMember("TestUser", "test@example.com", "+351912345678");
        
        _staffRepoMock.Setup(x => x.GetByMecNumberAsync(It.IsAny<MecanographicNumber>()))
            .ReturnsAsync(staff);

        // Act
        var result = await _controller.GetByMecanographicNumber(staff.MecanographicNumber.Value);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(okResult.Value);
        Assert.Equal("TestUser", value.ShortName);
    }

    [Fact]
    public async Task GetByName_ReturnsMatchingStaff()
    {
        // Arrange
        var staff1 = CreateStaffMember("John Doe", "john@example.com", "+351911111111");
        var staff2 = CreateStaffMember("Jane Doe", "jane@example.com", "+351922222222");
        
        _staffRepoMock.Setup(x => x.GetByNameAsync("Doe"))
            .ReturnsAsync(new List<StaffMember> { staff1, staff2 });

        // Act
        var result = await _controller.GetByName("Doe");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<StaffMemberDto>>(okResult.Value);
        Assert.Equal(2, value.Count);
        Assert.All(value, v => Assert.Contains("Doe", v.ShortName));
    }

    [Fact]
    public async Task GetByStatus_Active_ReturnsOnlyActive()
    {
        // Arrange
        var staff1 = CreateStaffMember("ActiveUser", "active@example.com", "+351911111111");
        var staff2 = CreateStaffMember("InactiveUser", "inactive@example.com", "+351922222222");
        staff2.ToggleStatus(); // Torna inativo
        
        _staffRepoMock.Setup(x => x.GetByStatusAsync(true))
            .ReturnsAsync(new List<StaffMember> { staff1 });

        // Act
        var result = await _controller.GetByStatus(true);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<StaffMemberDto>>(okResult.Value);
        Assert.Single(value);
        Assert.True(value[0].IsActive);
    }

    [Fact]
    public async Task GetByQualifications_ReturnsMatchingStaff()
    {
        // Arrange
        var qual = new Qualification("Crane") { Code = "QLF-001" };
        var staff1 = CreateStaffMember("User1", "user1@example.com", "+351911111111");
        staff1.AddQualification(qual.Id);
        
        _qualRepoMock.Setup(x => x.GetQualificationByCodeAsync("QLF-001"))
            .ReturnsAsync(qual);
        _qualRepoMock.Setup(x => x.GetByIdAsync(qual.Id))
            .ReturnsAsync(qual);
        _staffRepoMock.Setup(x => x.GetByQualificationsAsync(It.IsAny<List<QualificationId>>()))
            .ReturnsAsync(new List<StaffMember> { staff1 });

        var codesDto = new CodesListDto(new List<string>()) { QualificationsCodes = new List<string> { "QLF-001" } };

        // Act
        var result = await _controller.GetByQualifications(codesDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<StaffMemberDto>>(okResult.Value);
        Assert.Single(value);
    }

    #endregion

    #region UPDATE Tests

    [Fact]
    public async Task UpdateStaffMember_ValidData_ReturnsUpdated()
    {
        // Arrange
        var staff = CreateStaffMember("OldName", "old@example.com", "+351912345678");
        
        _staffRepoMock.Setup(x => x.GetByMecNumberAsync(It.IsAny<MecanographicNumber>()))
            .ReturnsAsync(staff);
        _unitOfWorkMock.Setup(x => x.CommitAsync())
            .ReturnsAsync(1);

        var dto = new UpdateStaffMemberDto
        {
            MecNumber = staff.MecanographicNumber.Value,
            ShortName = "NewName"
        };

        // Act
        var result = await _controller.Update(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(okResult.Value);
        Assert.Equal("NewName", value.ShortName);
        
        _unitOfWorkMock.Verify(x => x.CommitAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateStaffMember_NonExisting_ThrowsException()
    {
        // Arrange
        _staffRepoMock.Setup(x => x.GetByMecNumberAsync(It.IsAny<MecanographicNumber>()))
            .ReturnsAsync((StaffMember)null);

        var dto = new UpdateStaffMemberDto
        {
            MecNumber = "9999999",
            ShortName = "NewName"
        };

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleValidationException>(
            async () => await _service.UpdateAsync(dto)
        );
    }

    [Fact]
    public async Task UpdateStaffMember_AddQualifications_Succeeds()
    {
        // Arrange
        var qual1 = new Qualification("Crane") { Code = "QLF-001" };
        var qual2 = new Qualification("Truck") { Code = "QLF-002" };
        var staff = CreateStaffMember("TestUser", "test@example.com", "+351912345678");
        staff.AddQualification(qual1.Id);
        
        _staffRepoMock.Setup(x => x.GetByMecNumberAsync(It.IsAny<MecanographicNumber>()))
            .ReturnsAsync(staff);
        _qualRepoMock.Setup(x => x.GetQualificationByCodeAsync("QLF-002"))
            .ReturnsAsync(qual2);
        _qualRepoMock.Setup(x => x.GetByIdAsync(qual1.Id))
            .ReturnsAsync(qual1);
        _qualRepoMock.Setup(x => x.GetByIdAsync(qual2.Id))
            .ReturnsAsync(qual2);
        _unitOfWorkMock.Setup(x => x.CommitAsync())
            .ReturnsAsync(1);

        var dto = new UpdateStaffMemberDto
        {
            MecNumber = staff.MecanographicNumber.Value,
            QualificationCodes = new List<string> { "QLF-002" },
            AddQualifications = true
        };

        // Act
        var result = await _controller.Update(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(okResult.Value);
        Assert.Equal(2, value.QualificationCodes.Count);
    }

    [Fact]
    public async Task ToggleStatus_ChangesActiveFlag()
    {
        // Arrange
        var staff = CreateStaffMember("TestUser", "test@example.com", "+351912345678");
        var initialStatus = staff.IsActive;
        
        _staffRepoMock.Setup(x => x.GetByMecNumberAsync(It.IsAny<MecanographicNumber>()))
            .ReturnsAsync(staff);
        _unitOfWorkMock.Setup(x => x.CommitAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _controller.ToggleStatus(staff.MecanographicNumber.Value);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(okResult.Value);
        Assert.NotEqual(initialStatus, value.IsActive);
    }

    #endregion

    #region Helper Methods

    private StaffMember CreateStaffMember(string name, string email, string phone)
    {
        var mecanographicNumber = new MecanographicNumber("1250001");
    
        return new StaffMember(
            name,
            mecanographicNumber,
            new Email(email),
            new PhoneNumber(phone),
            new Schedule(ShiftType.Morning, WeekDays.AllWeek),
            null
        );
    }

    #endregion
}