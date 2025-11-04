using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Containers.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;

[Authorize(Roles = "PortAuthorityOfficer")]
[ApiController]
[Route("api/[controller]")]
public class StorageAreasController : ControllerBase
{
    private readonly ILogger<StorageAreasController> _logger;
    private readonly IStorageAreaService _service;
    private readonly IResponsesToFrontend _refrontend;

    public StorageAreasController(ILogger<StorageAreasController> logger, IStorageAreaService service,  IResponsesToFrontend refrontend)
    {
        _logger = logger;
        _service = service;
        _refrontend = refrontend;
    }

    [HttpGet]
    public async Task<ActionResult<List<StorageAreaDto>>> GetAllAsync()
    {
        _logger.LogInformation("API Request: Get all Storage Areas");

        try
        {
            var listStorageAreaDto = await _service.GetAllAsync();

            _logger.LogInformation("API Response (200): Found {Count} storage areas", listStorageAreaDto.Count);
            return Ok(listStorageAreaDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): No storage areas found. {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("id/{id:guid}", Name = "GetStorageAreaById")]
    public async Task<ActionResult<StorageAreaDto>> GetByIdAsync(Guid id)
    {
        _logger.LogInformation("API Request: Fetch Storage Area with ID = {Id}", id);

        try
        {
            var storageAreaDto = await _service.GetByIdAsync(new StorageAreaId(id));

            _logger.LogInformation("API Response (200): Storage Area with ID = {Id} found", id);
            return Ok(storageAreaDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Storage Area with ID = {Id} not found. {Message}", id, e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("name/{name}")]
    public async Task<ActionResult<StorageAreaDto>> GetByNameAsync(string name)
    {
        _logger.LogInformation("API Request: Fetch Storage Area with Name = {Name}", name);

        try
        {
            var storageAreaDto = await _service.GetByNameAsync(name);

            _logger.LogInformation("API Response (200): Storage Area with Name = {Name} found", name);
            return Ok(storageAreaDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Storage Area with Name = {Name} not found. {Message}", name, e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("distances")]
    public async Task<ActionResult<List<StorageAreaDockDistanceDto>>> GetDistancesToDockAsync(
        [FromQuery] string? name, [FromQuery] Guid? id)
    {
        _logger.LogInformation("API Request: Get distances for Storage Area by {Criteria}",
            name != null ? $"Name = {name}" : $"Id = {id}");

        try
        {
            var distances = await _service.GetDistancesToDockAsync(name, id == null ? null : new StorageAreaId(id.Value));

            _logger.LogInformation("API Response (200): Found {Count} distances for Storage Area", distances.Count);
            return Ok(distances);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Distances not found. {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("physicalresources")]
    public async Task<ActionResult<List<string>>> GetPhysicalResources([FromQuery] string? name, [FromQuery] Guid? id)
    {
        _logger.LogInformation("API Request: Get physical resources for Storage Area by {Criteria}",
            name != null ? $"Name = {name}" : $"Id = {id}");

        try
        {
            var physicalResources =
                await _service.GetPhysicalResourcesAsync(name, id == null ? null : new StorageAreaId(id.Value));

            _logger.LogInformation("API Response (200): Found {Count} physical resources for Storage Area",
                physicalResources.Count);
            return Ok(physicalResources);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Physical resources not found. {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }




    [HttpPost]
    public async Task<ActionResult<StorageAreaDto>> CreateAsync(CreatingStorageAreaDto dto)
    {
        _logger.LogInformation("API Request: Create new Storage Area with Name = {Name}", dto.Name);

        try
        {
            var created = await _service.CreateAsync(dto);

            _logger.LogInformation("API Response (201): Storage Area created with Id = {Id}, Name = {Name}", created.Id, created.Name);

            return CreatedAtRoute(
                "GetStorageAreaById",
                new { id = created.Id },
                created
            );

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (400): Failed to create Storage Area. {Message}", e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API Response (500): Unexpected error while creating Storage Area with Name = {Name}", dto.Name);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    [HttpGet("{id:guid}/grid")]
    public async Task<ActionResult<StorageAreaGridDto>> GetGrid(Guid id)
    {
        _logger.LogInformation("API Request: Get grid for Storage Area Id = {Id}", id);
        try
        {
            var grid = await _service.GetGridAsync(new StorageAreaId(id));
            _logger.LogInformation("API Response (200): Grid returned for Storage Area Id = {Id}", id);
            return Ok(grid);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Grid not found for {Id}. {Message}", id, e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("{id:guid}/container")]
    public async Task<ActionResult<ContainerDto>> GetContainerInPositionX(Guid id,[FromQuery]int bay,[FromQuery]int row, [FromQuery]int tier)
    {
        _logger.LogInformation("API Request: Get container in [{bay}{row}{tier}] information for Storage Area Id = {Id}", id,bay,row,tier);
        try
        {
            var grid = await _service.GetContainerAsync(new StorageAreaId(id),bay,row,tier);
            _logger.LogInformation("API Response (200): Container in [{bay}{row}{tier}] information returned for Storage Area Id = {Id}", id,bay,row,tier);
            return Ok(grid);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Container in  [{bay}{row}{tier}] not found for SA {Id}. {Message}", id,bay,row,tier, e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
}
