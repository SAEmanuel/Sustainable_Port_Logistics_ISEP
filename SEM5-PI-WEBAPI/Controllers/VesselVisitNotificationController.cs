using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VesselVisitNotificationController : ControllerBase
{
    private readonly VesselVisitNotificationService _service;
    private readonly ILogger<VesselVisitNotificationController> _logger;

    public VesselVisitNotificationController(VesselVisitNotificationService service,ILogger<VesselVisitNotificationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<VesselVisitNotificationDto>> CreateAsync(CreatingVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("API Request: Add VVN with body = {@Dto}", dto);
            
        try
        {
            var vvnDto = await _service.AddAsync(dto);
            _logger.LogInformation("API Response (201): VVN created with ID = {Id}", vvnDto.Id);
            return CreatedAtAction(nameof(GetById), new { id = vvnDto.Id }, vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): {Message}", e.Message);
            return BadRequest(e.Message);
        }
    }
    
    [HttpGet("id/{id:guid}")]
    public async Task<ActionResult<VesselVisitNotificationDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Fetching VVN with ID = {Id}", id);
            
        try
        {
            var vvnDto = await _service.GetByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogWarning("API Response (200): VVN with ID = {Id} -> FOUND", id);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (404): VVN with ID = {Id} -> NOT FOUND", id);
            return NotFound(ex.Message);
        }
    }

}