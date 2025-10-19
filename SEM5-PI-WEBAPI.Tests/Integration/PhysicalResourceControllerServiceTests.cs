using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json.Linq;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Integration
{
    public class PhysicalResourceServiceControllerTests
    {
        private readonly Mock<IPhysicalResourceRepository> _repoMock = new();
        private readonly Mock<IQualificationRepository> _qualMock = new();
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<ILogger<PhysicalResourceService>> _serviceLogger = new();
        private readonly Mock<ILogger<PhysicalResourceController>> _controllerLogger = new();

        private readonly PhysicalResourceService _service;
        private readonly PhysicalResourceController _controller;

        public PhysicalResourceServiceControllerTests()
        {
            _service = new PhysicalResourceService(_uowMock.Object, _repoMock.Object, _qualMock.Object, _serviceLogger.Object);
            _controller = new PhysicalResourceController(_service, _controllerLogger.Object);
        }

        private PhysicalResourceDTO CreateDto()
        {
            return new PhysicalResourceDTO(
                Guid.NewGuid(),
                new PhysicalResourceCode("TRUCK-0001"),
                "Truck A",
                25.0,
                10.0,
                PhysicalResourceType.Truck,
                PhysicalResourceStatus.Available,
                Guid.NewGuid()
            );
        }

        // --- GET ALL ---
        [Fact]
        public async Task GetAll_ShouldReturnOk_WhenResourcesExist()
        {
            var resources = new List<EntityPhysicalResource>
            {
                new EntityPhysicalResource(
                    new PhysicalResourceCode("TRUCK-0001"),
                    "Truck A",
                    25.0,
                    10.0,
                    PhysicalResourceType.Truck,
                    null)
            };

            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(resources);

            var result = await _controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var data = Assert.IsType<List<PhysicalResourceDTO>>(ok.Value);
            Assert.Single(data);
        }

        // --- GET BY ID ---
        [Fact]
        public async Task GetById_ShouldReturnBadRequest_WhenResourceMissing()
        {
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<PhysicalResourceId>()))
                .ReturnsAsync((EntityPhysicalResource?)null);

            var result = await _controller.GetByID(Guid.NewGuid());

            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("No physical resource found", bad.Value!.ToString());
        }


        // --- CREATE ---
        [Fact]
        public async Task Create_ShouldReturnCreated_WhenValid()
        {
            var dto = new CreatingPhysicalResourceDto(
                "Truck A", 25.0, 10.0, PhysicalResourceType.Truck, "QUAL-001");

            var entity = new EntityPhysicalResource(
                new PhysicalResourceCode("TRUCK-0001"),
                dto.Description,
                dto.OperationalCapacity,
                dto.SetupTime,
                dto.PhysicalResourceType,
                null);

            _qualMock.Setup(q => q.GetQualificationByCodeAsync(dto.QualificationCode!))
                     .ReturnsAsync(new Qualification("Test"));

            _repoMock.Setup(r => r.AddAsync(It.IsAny<EntityPhysicalResource>())).ReturnsAsync(entity);
            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _controller.Create(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var value = Assert.IsType<PhysicalResourceDTO>(created.Value);
            Assert.Equal(dto.Description, value.Description);
        }

        [Fact]
        public async Task Create_ShouldReturnBadRequest_WhenQualificationInvalid()
        {
            var dto = new CreatingPhysicalResourceDto(
                "Truck A", 25.0, 10.0, PhysicalResourceType.Truck, "INVALID");

            _qualMock.Setup(q => q.GetQualificationByCodeAsync(dto.QualificationCode!))
                     .ReturnsAsync((Qualification)null);

            var result = await _controller.Create(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("does not exist", bad.Value!.ToString());
        }

        // --- DEACTIVATE ---
        [Fact]
        public async Task Deactivate_ShouldReturnOk_WhenSuccess()
        {
            var entity = new EntityPhysicalResource(
                new PhysicalResourceCode("TRUCK-0001"),
                "Truck A",
                25.0,
                10.0,
                PhysicalResourceType.Truck,
                null);

            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<PhysicalResourceId>()))
                     .ReturnsAsync(entity);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _controller.Deactivate(Guid.NewGuid());

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var dto = Assert.IsType<PhysicalResourceDTO>(ok.Value);
            Assert.Equal(entity.Description, dto.Description);
        }

        [Fact]
        public async Task Deactivate_ShouldReturnBadRequest_WhenAlreadyInactive()
        {
            var entity = new EntityPhysicalResource(
                new PhysicalResourceCode("TRUCK-0001"),
                "Truck A",
                25.0,
                10.0,
                PhysicalResourceType.Truck,
                null);

            entity.UpdateStatus(PhysicalResourceStatus.Unavailable);

            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<PhysicalResourceId>()))
                     .ReturnsAsync(entity);

            var result = await _controller.Deactivate(Guid.NewGuid());

            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("already deactivated", bad.Value!.ToString());
        }
    }
}
