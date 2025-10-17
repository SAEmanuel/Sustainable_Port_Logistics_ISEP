using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using SEM5_PI_WEBAPI.Domain.BusinessShared;

namespace SEM5_PI_WEBAPI.Tests.Integration;

public class StaffMemberControllerServiceTests
{
    private readonly Mock<IStaffMemberService> _serviceMock = new();
    private readonly Mock<ILogger<StaffMembersController>> _loggerMock = new();

    private readonly StaffMembersController _controller;

    public StaffMemberControllerServiceTests()
    {
        _controller = new StaffMembersController(_serviceMock.Object, _loggerMock.Object);
    }

    private StaffMemberDto BuildDto()
    {
        return new StaffMemberDto(Guid.NewGuid(), "TestName", "1234567", "test@example.com", "+1234567890",
            new ScheduleDto(ShiftType.Morning, "1010101"), true, new List<string> { "QLF-001" });
    }

    [Fact]
    public async Task GetAll_ShouldReturnOk_WithListOfStaffMembers()
    {
        var list = new List<StaffMemberDto> { BuildDto(), BuildDto() };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

        var result = await _controller.GetAll();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<StaffMemberDto>>(okResult.Value);
        Assert.Equal(2, value.Count);
    }

    [Fact]
    public async Task GetById_ShouldReturnOk_WhenStaffMemberFound()
    {
        var dto = BuildDto();
        _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<StaffMemberId>())).ReturnsAsync(dto);

        var result = await _controller.GetById(Guid.NewGuid());

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(okResult.Value);
        Assert.Equal(dto.Id, value.Id);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenStaffMemberNotFound()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<StaffMemberId>())).ReturnsAsync((StaffMemberDto)null);

        var result = await _controller.GetById(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ShouldReturnCreated_WhenInputValid()
    {
        var dto = new CreatingStaffMemberDto("Test", "test@example.com", "+351912856565", new ScheduleDto(ShiftType.Morning, "1010101"), true, new List<string>());
        var resultDto = BuildDto();
        _serviceMock.Setup(s => s.AddAsync(dto)).ReturnsAsync(resultDto);

        var result = await _controller.Create(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<StaffMemberDto>(createdResult.Value);
        Assert.Equal(resultDto.Id, value.Id);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenBusinessRuleValidationException()
    {
        var dto = new CreatingStaffMemberDto("Test", "test@example.com", "+351912856565", new ScheduleDto(ShiftType.Morning, "1010101"), true, new List<string>());
        _serviceMock.Setup(s => s.AddAsync(dto)).ThrowsAsync(new BusinessRuleValidationException("Error"));

        var result = await _controller.Create(dto);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Error", badRequestResult.Value.ToString());
    }
}
