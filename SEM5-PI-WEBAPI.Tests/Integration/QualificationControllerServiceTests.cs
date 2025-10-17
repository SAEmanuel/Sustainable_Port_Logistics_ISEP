using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
namespace SEM5_PI_WEBAPI.Tests.Integration;

public class QualificationControllerServiceTests
{
    private readonly Mock<IQualificationRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ILogger<QualificationService>> _serviceLogger = new();
    private readonly Mock<ILogger<QualificationsController>> _controllerLogger = new();

    private readonly IQualificationService _service;
    private readonly QualificationsController _controller;

    public QualificationControllerServiceTests()
    {
        _service = new QualificationService(_uowMock.Object, _repoMock.Object, _serviceLogger.Object);
        _controller = new QualificationsController(_service, _controllerLogger.Object);
    }

    private QualificationDto BuildDto()
    {
        return new QualificationDto(Guid.NewGuid(), "Q-001", "Test Qualification");
    }

    [Fact]
    public async Task GetAll_ShouldReturnOk()
    {
        var qualifications = new List<QualificationDto> { BuildDto(), BuildDto() };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Qualification>()); 

        
        var serviceMock = new Mock<IQualificationService>();
        serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(qualifications);
        
        var controller = new QualificationsController(serviceMock.Object, _controllerLogger.Object);

        var result = await controller.GetAll();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnValue = Assert.IsType<List<QualificationDto>>(okResult.Value);
        Assert.Equal(2, returnValue.Count);
    }

    [Fact]
    public async Task GetGetById_ShouldReturnOk_WhenFound()
    {
        var dto = BuildDto();

        
        var serviceMock = new Mock<IQualificationService>();
        serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(dto);

        var controller = new QualificationsController(serviceMock.Object, _controllerLogger.Object);

        var result = await controller.GetGetById(Guid.NewGuid());

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(okResult.Value);
        Assert.Equal(dto.Id, value.Id);
    }

    [Fact]
    public async Task GetGetById_ShouldReturnNotFound_WhenNull()
    {
        var serviceMock = new Mock<IQualificationService>();
        serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync((QualificationDto)null);

        var controller = new QualificationsController(serviceMock.Object, _controllerLogger.Object);

        var result = await controller.GetGetById(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ShouldReturnCreated_WhenValid()
    {
        var dto = new CreatingQualificationDto("Test Qualification", "Q-001");
        var createdDto = BuildDto();

        var serviceMock = new Mock<IQualificationService>();
        serviceMock.Setup(s => s.AddAsync(dto)).ReturnsAsync(createdDto);

        var controller = new QualificationsController(serviceMock.Object, _controllerLogger.Object);

        var result = await controller.Create(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(createdResult.Value);

        Assert.Equal(createdDto.Id, value.Id);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_OnBusinessRuleValidationException()
    {
        var dto = new CreatingQualificationDto("Test Qualification", "Q-001");

        var serviceMock = new Mock<IQualificationService>();
        serviceMock.Setup(s => s.AddAsync(dto)).ThrowsAsync(new BusinessRuleValidationException("Error"));

        var controller = new QualificationsController(serviceMock.Object, _controllerLogger.Object);

        var result = await controller.Create(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Error", badRequest.Value.ToString());
    }
}
