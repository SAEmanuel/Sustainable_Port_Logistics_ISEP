using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StorageAreasController : ControllerBase
{
    private readonly ILogger<StorageAreasController> _logger;
    private readonly IStorageAreaService _service;

    public StorageAreasController(ILogger<StorageAreasController> logger, IStorageAreaService service)
    {
        _logger = logger;
        _service = service;
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
            return NotFound(e.Message);
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
            return NotFound(e.Message);
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
            return NotFound(e.Message);
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
            return NotFound(e.Message);
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
            return BadRequest(e.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API Response (500): Unexpected error while creating Storage Area with Name = {Name}", dto.Name);
            return StatusCode(500, "An unexpected error occurred.");
        }
    }
}
