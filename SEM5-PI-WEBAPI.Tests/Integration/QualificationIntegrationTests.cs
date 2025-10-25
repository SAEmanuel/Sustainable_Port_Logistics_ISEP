using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Tests.Integration;


public class QualificationIntegrationTests
{
    private readonly Mock<IQualificationRepository> _repoMock;
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<ILogger<QualificationService>> _serviceLogger;
    private readonly Mock<ILogger<QualificationsController>> _controllerLogger;

    private readonly QualificationService _service;
    private readonly QualificationsController _controller;

    public QualificationIntegrationTests()
    {
        _repoMock = new Mock<IQualificationRepository>();
        _uowMock = new Mock<IUnitOfWork>();
        _serviceLogger = new Mock<ILogger<QualificationService>>();
        _controllerLogger = new Mock<ILogger<QualificationsController>>();

        _service = new QualificationService(_uowMock.Object, _repoMock.Object, _serviceLogger.Object);
        _controller = new QualificationsController(_service, _controllerLogger.Object);
    }

    #region Helper Methods

    private Qualification CreateQualification(string code = "QLF-001", string name = "Test Qualification")
    {
        return new Qualification(name) { Code = code };
    }

    #endregion

    #region GET Tests

    [Fact]
    public async Task GetAll_ShouldReturnAllQualifications()
    {
        // Arrange
        var qual1 = CreateQualification("QLF-001", "Crane Operator");
        var qual2 = CreateQualification("QLF-002", "Truck Driver");
        
        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification> { qual1, qual2 });

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnValue = Assert.IsType<List<QualificationDto>>(okResult.Value);
        Assert.Equal(2, returnValue.Count);
        Assert.Contains(returnValue, q => q.Code == "QLF-001");
        Assert.Contains(returnValue, q => q.Code == "QLF-002");
    }

    [Fact]
    public async Task GetAll_EmptyRepository_ShouldReturnEmptyList()
    {
        // Arrange
        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification>());

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnValue = Assert.IsType<List<QualificationDto>>(okResult.Value);
        Assert.Empty(returnValue);
    }

    [Fact]
    public async Task GetById_ExistingQualification_ShouldReturnOk()
    {
        // Arrange
        var qualification = CreateQualification();
        
        _repoMock.Setup(r => r.GetByIdAsync(qualification.Id))
            .ReturnsAsync(qualification);

        // Act
        var result = await _controller.GetGetById(qualification.Id.AsGuid());

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(okResult.Value);
        Assert.Equal("QLF-001", value.Code);
        Assert.Equal("Test Qualification", value.Name);
    }

    [Fact]
    public async Task GetById_NonExisting_ShouldReturnNotFound()
    {
        // Arrange
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<QualificationId>()))
            .ReturnsAsync((Qualification)null);

        // Act
        var result = await _controller.GetGetById(Guid.NewGuid());

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetByCode_ExistingQualification_ShouldReturnOk()
    {
        // Arrange
        var qualification = CreateQualification("QLF-001", "Crane Operator");
        
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-001"))
            .ReturnsAsync(qualification);

        // Act
        var result = await _controller.GetQualificationByCode("QLF-001");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(okResult.Value);
        Assert.Equal("QLF-001", value.Code);
    }

    [Fact]
    public async Task GetByCode_NonExisting_ShouldReturnNotFound()
    {
        // Arrange
        _repoMock.Setup(r => r.GetQualificationByCodeAsync(It.IsAny<string>()))
            .ReturnsAsync((Qualification)null);

        // Act
        var result = await _controller.GetQualificationByCode("INVALID");

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetByName_ExistingQualification_ShouldReturnOk()
    {
        // Arrange
        var qualification = CreateQualification("QLF-001", "Crane Operator");
        
        _repoMock.Setup(r => r.GetQualificationByName("Crane Operator"))
            .ReturnsAsync(qualification);

        // Act
        var result = await _controller.GetQualificationByName("Crane Operator");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(okResult.Value);
        Assert.Equal("Crane Operator", value.Name);
    }

    [Fact]
    public async Task GetByName_NonExisting_ShouldReturnNotFound()
    {
        // Arrange
        _repoMock.Setup(r => r.GetQualificationByName(It.IsAny<string>()))
            .ReturnsAsync((Qualification)null);

        // Act
        var result = await _controller.GetQualificationByName("Invalid");

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    #endregion

    #region CREATE Tests

    [Fact]
    public async Task Create_ValidQualification_ShouldReturnCreated()
    {
        // Arrange
        var dto = new CreatingQualificationDto("Crane Operator", "QLF-001");
        
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-001"))
            .ReturnsAsync((Qualification)null);
        _repoMock.Setup(r => r.GetQualificationByName("Crane Operator"))
            .ReturnsAsync((Qualification)null);
        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification>());
        _uowMock.Setup(u => u.CommitAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(createdResult.Value);
        
        Assert.Equal("QLF-001", value.Code);
        Assert.Equal("Crane Operator", value.Name);
        
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Qualification>()), Times.Once);
        _uowMock.Verify(u => u.CommitAsync(), Times.Once);
    }

    [Fact]
    public async Task Create_DuplicateCode_ShouldReturnBadRequest()
    {
        // Arrange
        var dto = new CreatingQualificationDto("New Qual", "QLF-001");
        var existingQual = CreateQualification("QLF-001", "Existing Qual");
        
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-001"))
            .ReturnsAsync(existingQual);
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification> { existingQual });

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Repeated Qualification code", badRequest.Value.ToString()); 
        
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Qualification>()), Times.Never);
    }

    [Fact]
    public async Task Create_DuplicateName_ShouldReturnBadRequest()
    {
        // Arrange
        var dto = new CreatingQualificationDto("Crane Operator", "Q-002");
        var existingQual = CreateQualification("QLF-001", "Crane Operator");
        
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-002"))
            .ReturnsAsync((Qualification)null);
        _repoMock.Setup(r => r.GetQualificationByName("Crane Operator"))
            .ReturnsAsync(existingQual);
        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification> { existingQual });

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Repeated Qualification name", badRequest.Value.ToString());
        
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Qualification>()), Times.Never);
    }

    [Fact]
    public async Task Create_EmptyName_ShouldReturnBadRequest()
    {
        // Arrange
        var dto = new CreatingQualificationDto("", "QLF-001");
        
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification>());

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Qualification>()), Times.Never);
    }

    [Fact]
    public async Task Create_NullCode_ShouldSucceed()
    {
        // Arrange
        var dto = new CreatingQualificationDto("Test Qual", null);
        
        _repoMock.Setup(r => r.GetQualificationByName("Test Qual"))
            .ReturnsAsync((Qualification)null);
        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification>());
        _uowMock.Setup(u => u.CommitAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _controller.Create(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(createdResult.Value);
        
        Assert.NotNull(value.Code);
        Assert.Equal("Test Qual", value.Name);
    }

    #endregion

    #region UPDATE Tests

    [Fact]
    public async Task Update_ValidQualification_ShouldReturnOk()
    {
        // Arrange
        var existingQual = CreateQualification("QLF-001", "Old Name"); 
        var dto = new CreatingQualificationDto("Updated Name", "QLF-001"); 
    
        _repoMock.Setup(r => r.GetByIdAsync(existingQual.Id))
            .ReturnsAsync(existingQual);
        _repoMock.Setup(r => r.GetQualificationByName("Updated Name"))
            .ReturnsAsync((Qualification)null);
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-001")) // ✅ ADICIONA ESTE MOCK
            .ReturnsAsync(existingQual); 
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification> { existingQual });
        _uowMock.Setup(u => u.CommitAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _controller.Update(existingQual.Id.AsGuid(), dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<QualificationDto>(okResult.Value);
        Assert.Equal("Updated Name", value.Name);
        Assert.Equal("QLF-001", value.Code); // ✅ Código mantém-se
    
        _uowMock.Verify(u => u.CommitAsync(), Times.Once);
    }

    [Fact]
    public async Task Update_NonExisting_ShouldReturnNotFound()
    {
        // Arrange
        var dto = new CreatingQualificationDto("Test Name", "QLF-001");
        
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<QualificationId>()))
            .ReturnsAsync((Qualification)null);
        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification>());

        // Act
        var result = await _controller.Update(Guid.NewGuid(), dto);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
        
        _uowMock.Verify(u => u.CommitAsync(), Times.Never);
    }

    [Fact]
    public async Task Update_DuplicateName_ShouldReturnBadRequest()
    {
        // Arrange
        var existingQual1 = CreateQualification("QLF-001", "Qualification 1"); 
        var existingQual2 = CreateQualification("QLF-002", "Qualification 2");
        var dto = new CreatingQualificationDto("Qualification 2", "QLF-001"); 
    
        _repoMock.Setup(r => r.GetByIdAsync(existingQual1.Id))
            .ReturnsAsync(existingQual1);
        _repoMock.Setup(r => r.GetQualificationByName("Qualification 2"))
            .ReturnsAsync(existingQual2); 
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification> { existingQual1, existingQual2 });

        // Act
        var result = await _controller.Update(existingQual1.Id.AsGuid(), dto);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains("Repeated Qualification name", badRequest.Value.ToString());
    }

    [Fact]
    public async Task Update_EmptyName_ShouldReturnBadRequest()
    {
        // Arrange
        var existingQual = CreateQualification("QLF-001", "Old Name");
        var dto = new CreatingQualificationDto("", "QLF-001");
        
        _repoMock.Setup(r => r.GetByIdAsync(existingQual.Id))
            .ReturnsAsync(existingQual);
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification> { existingQual });

        // Act
        var result = await _controller.Update(existingQual.Id.AsGuid(), dto);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    #endregion
}