using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Dock.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Controllers;


[ApiController]
[Route("api/[controller]")]
public class DockController : ControllerBase
{
    private readonly ILogger<DockController> _logger;
    private readonly IDockService _service;

    public DockController(IDockService service, ILogger<DockController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<DockDto>>> GetAllAsync()
    {
        try
        {
            _logger.LogInformation("API Request: Get All Docks on DataBase");
            var listDtos = await _service.GetAllAsync();
            _logger.LogWarning("API Response (200): A total of {count} docks were found -> {@Docks}", listDtos.Count, listDtos);
            return Ok(listDtos);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): No Docks found on DataBase");
            return NotFound(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("id/{id:guid}")]
    public async Task<ActionResult<DockDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Fetching Dock with ID = {Id}", id);
        try
        {
            var dto = await _service.GetByIdAsync(new DockId(id));
            _logger.LogWarning("API Response (200): Dock with ID = {Id} -> FOUND", id);
            return Ok(dto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Response (404): Dock with ID = {Id} -> NOT FOUND", id);
            return NotFound(ex.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPost]
    public async Task<ActionResult<DockDto>> CreateAsync([FromBody] RegisterDockDto dto)
    {
        try
        {
            _logger.LogInformation("API Request: Add Dock with body = {@Dto}", dto);
            var created = await _service.CreateAsync(dto);
            _logger.LogInformation("API Response (201): Dock created with Code [{Code}] and System ID [{ID}].", created.Code, created.Id);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("code/{code}")]
    public async Task<ActionResult<DockDto>> GetByCodeAsync(string code)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching Dock with Code = {Code}", code);
            var dto = await _service.GetByCodeAsync(code);
            _logger.LogWarning("API Response (200): Dock with Code = {Code} -> FOUND", code);
            return Ok(dto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("vesseltype/{vesselTypeId}")]
    public async Task<ActionResult<List<DockDto>>> GetByVesselTypeAsync(string vesselTypeId)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching Docks with VesselType = {VT}", vesselTypeId);
            var list = await _service.GetByVesselTypeAsync(vesselTypeId);
            _logger.LogWarning("API Response (200): Docks with VesselType = {VT} -> FOUND ({Count})", vesselTypeId, list.Count);
            return Ok(list);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("filter")]
    public async Task<ActionResult<List<DockDto>>> GetByFilterAsync(
        [FromQuery] string? code,
        [FromQuery] string? vesselTypeId,
        [FromQuery] string? location,
        [FromQuery] string? query,
        [FromQuery] string? status)
    {
        _logger.LogInformation("API Request: Filtering Docks with provided filters.");
        try
        {
            var list = await _service.GetFilterAsync(code, vesselTypeId, location, query, status);
            _logger.LogInformation("API Response (200): Found {Count} Docks -> {@Docks}", list.Count, list);
            return Ok(list);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("location")]
    public async Task<ActionResult<List<DockDto>>> GetByLocationAsync([FromQuery] string value)
    {
        try
        {
            var list = await _service.GetByLocationAsync(value);
            return Ok(list);
        }
        catch (BusinessRuleValidationException e)
        {
            return NotFound(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPatch("code/{code}")]
    public async Task<ActionResult<DockDto>> PatchByCodeAsync(string code, [FromBody] UpdateDockDto? dto)
    {
        if (dto == null) return BadRequest("No changes provided.");
        try
        {
            _logger.LogInformation("API Request: Partial update for Dock with Code = {Code}", code);
            var updated = await _service.PatchByCodeAsync(code, dto);
            _logger.LogInformation("API Response (200): Dock with Code = {Code} patched successfully", code);
            return Ok(updated);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(e.Message);
        }
    }
    
    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("physical-code/{code}")]
    public async Task<ActionResult<DockDto>> GetByPhysicalResourceCode(string code)
    {
        try
        {
            var dto = await _service.GetByPhysicalResourceCodeAsync(code);
            return Ok(dto);
        }
        catch (BusinessRuleValidationException e)
        {
            return NotFound(e.Message);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("codes")]
    public async Task<ActionResult<List<string>>> GetAllCodes()
    {
        var list = await _service.GetAllDockCodesAsync();
        return Ok(list);
    }
}
