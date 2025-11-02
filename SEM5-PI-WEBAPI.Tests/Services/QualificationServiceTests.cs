using Microsoft.Extensions.Logging;
using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;

namespace SEM5_PI_WEBAPI.Tests.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using Xunit;
using FluentAssertions;

public class QualificationServiceTests
{
    private readonly Mock<IQualificationRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<QualificationService>> _loggerMock = new();
    private readonly QualificationService _service;

    public QualificationServiceTests()
    {
        
        _service = new QualificationService(_unitOfWorkMock.Object, _repoMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnListOfQualifications()
    {
        var qualifications = new List<Qualification>
        {
            new Qualification("Chef") { Code = "QLF-001" },
            new Qualification("Driver") { Code = "QLF-002" }
        };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(qualifications);

        var result = await _service.GetAllAsync();

        result.Should().HaveCount(2);
        result.First().Name.Should().Be("Chef");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnQualification_WhenFound()
    {
        var id = new QualificationId(Guid.NewGuid());
        var qualification = new Qualification("Designer") { Code = "QLF-003" };
        _repoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(qualification);

        var result = await _service.GetByIdAsync(id);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Designer");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldThrowBusinessRuleValidationException_WhenNotFound()
    {
        var id = new QualificationId(Guid.NewGuid());
        _repoMock.Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync((Qualification?)null);

        await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
            _service.GetByIdAsync(id));
    }


    [Fact]
    public async Task AddAsync_ShouldCreateQualification_WhenValid()
    {
        var dto = new CreatingQualificationDto("CraneOperator", null);

        _repoMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Qualification>());

        _repoMock.Setup(r => r.AddAsync(It.IsAny<Qualification>()))
            .ReturnsAsync(new Qualification("CraneOperator"));

        _unitOfWorkMock.Setup(u => u.CommitAsync())
            .ReturnsAsync(1);

        var result = await _service.AddAsync(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be("CraneOperator");
        result.Code.Should().StartWith("QLF-");

        _repoMock.Verify(r => r.AddAsync(It.IsAny<Qualification>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(), Times.Once);
    }

    [Fact]
    public async Task AddAsync_ShouldThrowException_WhenNameIsRepeated()
    {
        var dto = new CreatingQualificationDto("Engineer", "QLF-005");
        var existing = new List<Qualification> { new Qualification("Engineer") { Code = "QLF-001" } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(existing);

        Func<Task> act = async () => await _service.AddAsync(dto);

        await act.Should().ThrowAsync<BusinessRuleValidationException>()
            .WithMessage("Repeated Qualification name!");
    }

    [Fact]
    public async Task GetByCodeAsync_ShouldReturnQualification_WhenExists()
    {
        var qualification = new Qualification("Engineer") { Code = "QLF-010" };
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-010")).ReturnsAsync(qualification);

        var result = await _service.GetByCodeAsync("QLF-010");

        result.Code.Should().Be("QLF-010");
        result.Name.Should().Be("Engineer");
    }

    [Fact]
    public async Task GetByCodeAsync_ShouldThrowException_WhenNotFound()
    {
        _repoMock.Setup(r => r.GetQualificationByCodeAsync("QLF-999"))
            .ReturnsAsync((Qualification?)null);

        Func<Task> act = async () => await _service.GetByCodeAsync("QLF-999");

        await act.Should().ThrowAsync<BusinessRuleValidationException>()
            .WithMessage("No qualification with code QLF-999 was found");
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateFields_WhenValid()
    {
        // Arrange
        var id = new QualificationId(Guid.NewGuid());
        var qualification = new Qualification("CraneOperator") { Code = "QLF-007" }; 
    
        _repoMock.Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync(qualification);
        _repoMock.Setup(r => r.GetQualificationByName("Sts Crane Operator"))
            .ReturnsAsync((Qualification)null); 
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification> { qualification });
        _unitOfWorkMock.Setup(u => u.CommitAsync())
            .ReturnsAsync(1);

        var dto = new UpdateQualificationDto("Sts Crane Operator", "QLF-008");

        // Act
        var result = await _service.UpdateAsync(id, dto);

        // Assert
        result!.Name.Should().Be("Sts Crane Operator");
        result.Code.Should().Be("QLF-008");
        _unitOfWorkMock.Verify(u => u.CommitAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnNull_WhenQualificationDoesNotExist()
    {
        // Arrange
        var id = new QualificationId(Guid.NewGuid());
    
        _repoMock.Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync((Qualification?)null);
        _repoMock.Setup(r => r.GetAllAsync()) 
            .ReturnsAsync(new List<Qualification>());
    
        var dto = new UpdateQualificationDto("Engineer", "QLF-009");

        // Act
        var result = await _service.UpdateAsync(id, dto);

        // Assert
        result.Should().BeNull();
    }
}