using Microsoft.Extensions.Logging;
using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;

namespace SEM5_PI_WEBAPI.Tests.Controllers;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using Xunit;

public class QualificationsControllerTests
{
    private readonly Mock<IQualificationService> _serviceMock;
    private readonly Mock<ILogger<QualificationsController>> _loggerMock;
    private readonly QualificationsController _controller;

    public QualificationsControllerTests()
    {
        _serviceMock = new Mock<IQualificationService>();
        _loggerMock = new Mock<ILogger<QualificationsController>>();
        _controller = new QualificationsController(_serviceMock.Object, _loggerMock.Object);
    }

    private QualificationDto BuildDto()
    {
        return new QualificationDto(Guid.NewGuid(), "Qualification1", "QLF-001");
    }

    [Fact]
    public async Task GetAll_ShouldReturnOkWithList()
    {
        var list = new List<QualificationDto> { BuildDto(), BuildDto() };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(list);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var val = Assert.IsType<List<QualificationDto>>(ok.Value);
        Assert.Equal(2, val.Count);
    }

    [Fact]
    public async Task GetGetById_ShouldReturnNotFound_WhenNull()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync((QualificationDto?)null);

        var result = await _controller.GetGetById(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetGetById_ShouldReturnDto_WhenFound()
    {
        var dto = BuildDto();
        _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<QualificationId>())).ReturnsAsync(dto);

        var result = await _controller.GetGetById(Guid.NewGuid());

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var okValue = Assert.IsType<QualificationDto>(okResult.Value);
        Assert.Equal(dto.Id, okValue.Id);
    }

    [Fact]
    public async Task GetGetById_ShouldReturnBadRequest_OnBusinessRuleValidationException()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<QualificationId>())).ThrowsAsync(new BusinessRuleValidationException("Error"));

        var result = await _controller.GetGetById(Guid.NewGuid());

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Error", bad.Value.ToString());
    }

    [Fact]
    public async Task GetQualificationByCode_ShouldReturnNotFound_WhenNull()
    {
        _serviceMock.Setup(s => s.GetByCodeAsync(It.IsAny<string>())).ReturnsAsync((QualificationDto?)null);

        var result = await _controller.GetQualificationByCode("QLF-001");

        var nf = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Contains("Qualification not found", nf.Value.ToString());
    }

    [Fact]
    public async Task GetQualificationByCode_ShouldReturnOk_WhenFound()
    {
        var dto = BuildDto();
        _serviceMock.Setup(s => s.GetByCodeAsync(It.IsAny<string>())).ReturnsAsync(dto);

        var result = await _controller.GetQualificationByCode("QLF-001");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var val = Assert.IsType<QualificationDto>(ok.Value);
        Assert.Equal(dto.Id, val.Id);
    }

    [Fact]
    public async Task GetQualificationByCode_ShouldReturnBadRequest_OnBusinessRuleValidationException()
    {
        _serviceMock.Setup(s => s.GetByCodeAsync(It.IsAny<string>())).ThrowsAsync(new BusinessRuleValidationException("Error"));

        var result = await _controller.GetQualificationByCode("QLF-001");

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Error", bad.Value.ToString());
    }

    [Fact]
    public async Task GetQualificationByName_ShouldReturnNotFound_WhenNull()
    {
        _serviceMock.Setup(s => s.GetByNameAsync(It.IsAny<string>())).ReturnsAsync((QualificationDto?)null);

        var result = await _controller.GetQualificationByName("Qualification1");

        var nf = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Contains("Qualification not found", nf.Value.ToString());
    }

    [Fact]
    public async Task GetQualificationByName_ShouldReturnOk_WhenFound()
    {
        var dto = BuildDto();
        _serviceMock.Setup(s => s.GetByNameAsync(It.IsAny<string>())).ReturnsAsync(dto);

        var result = await _controller.GetQualificationByName("Qualification1");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var val = Assert.IsType<QualificationDto>(ok.Value);
        Assert.Equal(dto.Id, val.Id);
    }

    [Fact]
    public async Task GetQualificationByName_ShouldReturnBadRequest_OnBusinessRuleValidationException()
    {
        _serviceMock.Setup(s => s.GetByNameAsync(It.IsAny<string>())).ThrowsAsync(new BusinessRuleValidationException("Error"));

        var result = await _controller.GetQualificationByName("Qualification1");

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Error", bad.Value.ToString());
    }

    [Fact]
    public async Task Create_ShouldReturnCreatedAtActionResult()
    {
        var creatingDto = new CreatingQualificationDto { Name = "Qualification1", Code = "QLF-001" };
        var dto = BuildDto();

        _serviceMock.Setup(s => s.AddAsync(creatingDto)).ReturnsAsync(dto);

        var result = await _controller.Create(creatingDto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var val = Assert.IsType<QualificationDto>(created.Value);
        Assert.Equal(dto.Id, val.Id);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_OnBusinessRuleValidationException()
    {
        var creatingDto = new CreatingQualificationDto { Name = "Qualification1", Code = "QLF-001" };

        _serviceMock.Setup(s => s.AddAsync(creatingDto)).ThrowsAsync(new BusinessRuleValidationException("Invalid"));

        var result = await _controller.Create(creatingDto);

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Invalid", bad.Value.ToString());
    }

    [Fact]
    public async Task Update_ShouldReturnOk_WhenFound()
    {
        var id = Guid.NewGuid();
        var updateDto = new UpdateQualificationDto { Name = "Qualification Updated", Code = "QLF-002" };
        var dto = BuildDto();

        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<QualificationId>(), updateDto)).ReturnsAsync(dto);

        var result = await _controller.Update(id, updateDto);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var val = Assert.IsType<QualificationDto>(ok.Value);
        Assert.Equal(dto.Id, val.Id);
    }

    [Fact]
    public async Task Update_ShouldReturnNotFound_WhenMissing()
    {
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<QualificationId>(), It.IsAny<UpdateQualificationDto>())).ReturnsAsync((QualificationDto?)null);

        var result = await _controller.Update(Guid.NewGuid(), new UpdateQualificationDto());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_ShouldReturnBadRequest_OnBusinessRuleValidationException()
    {
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<QualificationId>(), It.IsAny<UpdateQualificationDto>()))
            .ThrowsAsync(new BusinessRuleValidationException("Error"));

        var result = await _controller.Update(Guid.NewGuid(), new UpdateQualificationDto());

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Error", bad.Value.ToString());
    }
}
