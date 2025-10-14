using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VesselVisitNotificationController : ControllerBase
{
    private readonly IVesselVisitNotificationService _service;
    private readonly ILogger<VesselVisitNotificationController> _logger;

    public VesselVisitNotificationController(IVesselVisitNotificationService service,
        ILogger<VesselVisitNotificationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<VesselVisitNotificationDto>> CreateAsync(
        [FromBody] CreatingVesselVisitNotificationDto dto)
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

    [HttpPut("{id:guid}/withdraw")]
    public async Task<ActionResult<VesselVisitNotificationDto>> WithdrawByIdAsync(Guid id)
    {
        _logger.LogInformation("API Request: PUT withdraw VVN with ID = {Id}", id);

        try
        {
            var vvnDto = await _service.WithdrawByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogInformation("API Response (200): VVN with ID = {Id} successfully withdrawn", id);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not withdraw VVN with ID = {Id}. Reason: {Message}", id,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error withdrawing VVN with ID = {Id}", id);
            return StatusCode(500, "An unexpected error occurred while withdrawing the VVN.");
        }
    }

    [HttpPut("{code}/withdraw")]
    public async Task<ActionResult<VesselVisitNotificationDto>> WithdrawByCodeAsync(string code)
    {
        _logger.LogInformation("API Request: PUT withdraw VVN with Code = {code}", code);

        try
        {
            var vvnDto = await _service.WithdrawByCodeAsync(new VvnCode(code));
            _logger.LogInformation("API Response (200): VVN with Code = {code} successfully withdrawn", code);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not withdraw VVN with Code = {code}. Reason: {Message}", code,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error withdrawing VVN with Code = {code}", code);
            return StatusCode(500, "An unexpected error occurred while withdrawing the VVN.");
        }
    }

    [HttpPut("{code}/submit")]
    public async Task<ActionResult<VesselVisitNotificationDto>> SubmitByCodeAsync(string code)
    {
        _logger.LogInformation("API Request: PUT submit VVN with Code = {code}", code);

        try
        {
            var vvnDto = await _service.SubmitByCodeAsync(new VvnCode(code));
            _logger.LogInformation("API Response (200): VVN with Code = {code} successfully submitted", code);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not submit VVN with Code = {code}. Reason: {Message}", code,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error submitting VVN with Code = {code}", code);
            return StatusCode(500, "An unexpected error occurred while submitting the VVN.");
        }
    }

    [HttpPut("{id:guid}/submit")]
    public async Task<ActionResult<VesselVisitNotificationDto>> SubmitByIdAsync(Guid id)
    {
        _logger.LogInformation("API Request: PUT submit VVN with id = {id}", id);

        try
        {
            var vvnDto = await _service.SubmitByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogInformation("API Response (200): VVN with id = {id} successfully submitted", id);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not submit VVN with id = {id}. Reason: {Message}", id,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error submitting VVN with id = {id}", id);
            return StatusCode(500, "An unexpected error occurred while submitting the VVN.");
        }
    }


    [HttpPut("{id:guid}/update")]
    public async Task<ActionResult<VesselVisitNotificationDto>> UpdateAsync(Guid id,
        [FromBody] UpdateVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("API Request: PUT update VVN with ID = {Id}", id);

        try
        {
            var updatedVvn = await _service.UpdateAsync(new VesselVisitNotificationId(id), dto);
            _logger.LogInformation("API Response (200): VVN with ID = {Id} updated successfully", id);
            return Ok(updatedVvn);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not update VVN with ID = {Id}. Reason: {Message}", id,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating VVN with ID = {Id}", id);
            return StatusCode(500, "An unexpected error occurred while updating the VVN.");
        }
    }

    [HttpPut("accept/id/{id}")]
    public async Task<ActionResult<VesselVisitNotificationDto>> AcceptVvn(Guid id)
    {
        _logger.LogInformation("API Request: PUT accept VVN with id = {id}", id);

        try
        {
            var vvn = await _service.GetByIdAsync(new VesselVisitNotificationId(id));
            var vvnDto = await _service.AcceptVvnAsync(new VvnCode(vvn.Code));
            _logger.LogInformation("API Response (200): VVN with id = {id} successfully accepted", id);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not accept VVN with id = {id}. Reason: {Message}", id,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error accepting VVN with id = {id}", id);
            return StatusCode(500, "An unexpected error occurred while accepting the VVN.");
        }
    }
    
    [HttpPut("reject/")]
    public async Task<ActionResult<VesselVisitNotificationDto>> RejectVvn(RejectVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("API Request: PUT reject VVN with code = {code}", dto.VvnCode);

        try
        {
            var vvnDto = await _service.MarkAsPendingAsync(dto);
            _logger.LogInformation("API Response (200): VVN with code = {code} successfully rejected", dto.VvnCode);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Could not reject VVN with code = {code}. Reason: {Message}", dto.VvnCode,
                ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error rejecting VVN with code = {id}", dto.VvnCode);
            return StatusCode(500, "An unexpected error occurred while rejecting the VVN.");
        }
    }
}