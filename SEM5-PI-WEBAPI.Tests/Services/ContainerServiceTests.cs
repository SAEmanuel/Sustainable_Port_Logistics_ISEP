using Microsoft.Extensions.Logging;
using Moq;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Containers.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Tests.Services
{
    public class ContainerServiceTests
    {
        private readonly Mock<IUnitOfWork> _uowMock = new();
        private readonly Mock<IContainerRepository> _containerRepoMock = new();
        private readonly Mock<ILogger<ContainerService>> _loggerMock = new();

        private readonly ContainerService _service;

        public ContainerServiceTests()
        {
            _service = new ContainerService(
                _uowMock.Object,
                _loggerMock.Object,
                _containerRepoMock.Object
            );
        }
        
        [Fact]
        public async Task CreateAsync_ShouldCreateContainer_WhenValid()
        {
            var dto = new CreatingContainerDto(
                "MSCU6639870",
                "General purpose container for dry goods",
                ContainerType.General,
                23000
            );

            _containerRepoMock.Setup(r => r.GetByIsoNumberAsync(It.IsAny<Iso6346Code>()))
                .ReturnsAsync((EntityContainer)null);

            _containerRepoMock.Setup(r => r.AddAsync(It.IsAny<EntityContainer>()))
                .ReturnsAsync((EntityContainer c) => c);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.CreateAsync(dto);

            Assert.NotNull(result);
            Assert.Equal(dto.IsoCode, result.IsoCode.Value);
            Assert.Equal(dto.Type, result.Type);
            Assert.Equal(dto.Description, result.Description);
            _containerRepoMock.Verify(r => r.AddAsync(It.IsAny<EntityContainer>()), Times.Once);
            _uowMock.Verify(u => u.CommitAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_ShouldThrow_WhenIsoAlreadyExists()
        {
            var dto = new CreatingContainerDto(
                "MSCU6639870",
                "Already existing container",
                ContainerType.General,
                22000
            );

            _containerRepoMock.Setup(r => r.GetByIsoNumberAsync(It.IsAny<Iso6346Code>()))
                .ReturnsAsync(new EntityContainer(dto.IsoCode, dto.Description, dto.Type, dto.WeightKg));

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.CreateAsync(dto));

            Assert.Contains("already exists", ex.Message);
        }
        

        [Fact]
        public async Task GetAllAsync_ShouldReturnList_WhenExists()
        {
            var containers = new List<EntityContainer>
            {
                new("MSCU6639870", "Dry goods container", ContainerType.General, 23000),
                new("CSIU4400699", "Refrigerated container for perishables", ContainerType.Reefer, 25000)
            };

            _containerRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(containers);

            var result = await _service.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.Contains(result, c => c.Type == ContainerType.Reefer);
        }

        [Fact]
        public async Task GetAllAsync_ShouldThrow_WhenEmpty()
        {
            _containerRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<EntityContainer>());

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetAllAsync());

            Assert.Contains("No Vessel/s", ex.Message);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturn_WhenExists()
        {
            var id = new ContainerId(Guid.NewGuid());
            var container = new EntityContainer("CSIU4400699", "Standard container", ContainerType.General, 22000);

            _containerRepoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(container);

            var result = await _service.GetByIdAsync(id);

            Assert.Equal(container.Description, result.Description);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrow_WhenNotFound()
        {
            var id = new ContainerId(Guid.NewGuid());

            _containerRepoMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((EntityContainer)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByIdAsync(id));
            Assert.Contains("No Container Found", ex.Message);
        }

        [Fact]
        public async Task GetByIsoAsync_ShouldReturn_WhenExists()
        {
            var iso = "CSIU4400699";
            var container = new EntityContainer(iso, "General cargo", ContainerType.General, 24000);

            _containerRepoMock.Setup(r => r.GetByIsoNumberAsync(It.IsAny<Iso6346Code>()))
                .ReturnsAsync(container);

            var result = await _service.GetByIsoAsync(iso);

            Assert.Equal(container.ISOId.Value, result.IsoCode.Value);
        }

        [Fact]
        public async Task GetByIsoAsync_ShouldThrow_WhenNotFound()
        {
            _containerRepoMock.Setup(r => r.GetByIsoNumberAsync(It.IsAny<Iso6346Code>()))
                .ReturnsAsync((EntityContainer)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() => _service.GetByIsoAsync("CSIU4400699"));

            Assert.Contains("No Container Found", ex.Message);
        }
        

        [Fact]
        public async Task PatchByIsoAsync_ShouldUpdateContainer_WhenValid()
        {
            var iso = "CSIU4400699";
            var container = new EntityContainer(iso, "Initial description", ContainerType.General, 20000);

            var updateDto = new UpdatingContainerDto(
                "Updated description",
                ContainerType.Reefer,
                ContainerStatus.Full,
                25000
            );

            _containerRepoMock.Setup(r => r.GetByIsoNumberAsync(It.IsAny<Iso6346Code>()))
                .ReturnsAsync(container);

            _uowMock.Setup(u => u.CommitAsync()).ReturnsAsync(1);

            var result = await _service.PatchByIsoAsync(iso, updateDto);

            Assert.Equal(updateDto.Description, result.Description);
            Assert.Equal(updateDto.Type, result.Type);
            Assert.Equal(updateDto.Status, result.Status);
            Assert.Equal(updateDto.WeightKg, result.WeightKg);
        }

        [Fact]
        public async Task PatchByIsoAsync_ShouldThrow_WhenContainerNotFound()
        {
            var updateDto = new UpdatingContainerDto("Updated", ContainerType.Reefer, ContainerStatus.Full, 20000);

            _containerRepoMock.Setup(r => r.GetByIsoNumberAsync(It.IsAny<Iso6346Code>()))
                .ReturnsAsync((EntityContainer)null);

            var ex = await Assert.ThrowsAsync<BusinessRuleValidationException>(() =>
                _service.PatchByIsoAsync("BBCU5100617", updateDto));

            Assert.Contains("No Container found", ex.Message);
        }
    }
}
