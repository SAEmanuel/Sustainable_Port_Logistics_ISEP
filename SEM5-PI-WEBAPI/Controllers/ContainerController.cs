using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ContainerController : ControllerBase
{
    private readonly ContainerService _service;
    private readonly ILogger<ContainerController> _logger;

    public ContainerController(ContainerService service,ILogger<ContainerController> logger)
    {
        _service = service;
        _logger = logger;
    }

    
    [HttpGet]
    public async Task<ActionResult<List<ContainerDto>>> GetAllAsync()
    {
        try
        {
            _logger.LogInformation("API Request: Get All Containers on DataBase");
            
            var listContainersDtos = await _service.GetAllAsync();
            
            _logger.LogWarning("API Response (200): A total of {count} Containers were found -> {@Container}", listContainersDtos.Count, listContainersDtos);
            return Ok(listContainersDtos);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): No Containers found on DataBase");
            return NotFound(e.Message);
        }
    }
    
    
    [HttpGet("id/{id:guid}")]
    public async Task<ActionResult<ContainerDto>> GetById(Guid id)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching Container with ID = {Id}", id);
            var vesselDto = await _service.GetByIdAsync(new ContainerId(id));
            _logger.LogWarning("API Response (200): Container with ID = {Id} -> FOUND", id);
            return Ok(vesselDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Response (404): Container with ID = {Id} -> NOT FOUND", id);
            return NotFound(ex.Message);
        }
    }
    
    
    [HttpPost]
    public async Task<ActionResult<ContainerDto>> CreateAsync(CreatingContainerDto creatingContainerDto)
    {
        try
        {
            _logger.LogInformation("API Request: Add Container with body = {@Dto}", creatingContainerDto);

            var containerDto = await _service.CreateAsync(creatingContainerDto);
            _logger.LogInformation("API Response (201): Container created with ISO Number [{ISO}] and System ID [{ID}].", containerDto.IsoCode,containerDto.Id);

            return CreatedAtAction(nameof(GetById), new { id = containerDto.Id }, containerDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): {Message}", e.Message);
            return BadRequest(e.Message);
        }
    }
}