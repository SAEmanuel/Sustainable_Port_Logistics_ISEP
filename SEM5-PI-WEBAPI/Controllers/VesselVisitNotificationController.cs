using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs.GetByStatus;

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

    [Authorize(Roles = "ShippingAgentRepresentative")]
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

    [Authorize(Roles = "PortAuthorityOfficer,LogisticsOperator,ShippingAgentRepresentative")]
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

    [Authorize(Roles = "PortAuthorityOfficer")]
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

    [Authorize(Roles = "PortAuthorityOfficer")]
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

    [Authorize(Roles = "ShippingAgentRepresentative")]
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

    [Authorize(Roles = "ShippingAgentRepresentative")]
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

    [Authorize(Roles = "ShippingAgentRepresentative")]
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

    [Authorize(Roles = "PortAuthorityOfficer")]
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
    
    [Authorize(Roles = "PortAuthorityOfficer")]
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

    [Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/inProgress-pendingInformation/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetInProgressOrPendingVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture)
    {
        try
        {
            _logger.LogInformation(
                "API Request: Fetching VVNs (InProgress & PendingInformation) for SAR {SAR_ID} with filters: rep={Rep}, IMO={IMO}, ETA={ETA}, ETD={ETD}",
                idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture);

            var dto = new FilterInProgressPendingVvnStatusDto
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture
            };

            var vvDtoList = await _service.GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} VVNs for SAR {SAR_ID}", vvDtoList.Count, idSarWhoImAm);

            return Ok(vvDtoList);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (404): {Message}", ex.Message);
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching VVNs for SAR {SAR_ID}", idSarWhoImAm);
            return StatusCode(500, "An unexpected error occurred while fetching VVNs.");
        }
    }

    
    [Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/withDrawn/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetWithdrawnVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture)
    {
        try
        {
            _logger.LogInformation(
                "API Request: Fetching Withdrawn VVNs for SAR {SAR_ID} with filters: rep={Rep}, IMO={IMO}, ETA={ETA}, ETD={ETD}",
                idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture);

            var dto = new FilterWithdrawnVvnStatusDto
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture
            };

            var vvns = await _service.GetWithdrawnVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} withdrawn VVNs for SAR {SAR_ID}.", vvns.Count, idSarWhoImAm);
            return Ok(vvns);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Response (404): No withdrawn VVNs found for SAR {SAR_ID}. Reason: {Msg}", idSarWhoImAm, ex.Message);
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching withdrawn VVNs for SAR {SAR_ID}", idSarWhoImAm);
            return StatusCode(500, "An unexpected error occurred while retrieving withdrawn VVNs.");
        }
    }


    [Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/submitted/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetSubmittedVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture,
        [FromQuery] string? submittedDate)
    {
        try
        {
            _logger.LogInformation(
                "API Request: Fetching Submitted VVNs for SAR {SAR_ID} with filters: rep={Rep}, IMO={IMO}, ETA={ETA}, ETD={ETD}, SubmittedDate={SubmittedDate}",
                idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture,submittedDate);

            var dto = new FilterSubmittedVvnStatusDto()
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture,
                SubmittedDate = submittedDate
            };

            var vvns = await _service.GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} submitted VVNs for SAR {SAR_ID}.", vvns.Count, idSarWhoImAm);
            return Ok(vvns);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Response (404): No submitted VVNs found for SAR {SAR_ID}. Reason: {Msg}", idSarWhoImAm, ex.Message);
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching submitted VVNs for SAR {SAR_ID}", idSarWhoImAm);
            return StatusCode(500, "An unexpected error occurred while retrieving submitted VVNs.");
        }
    }


    [Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/accepted/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetAcceptedVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture,
        [FromQuery] string? submittedDate,
        [FromQuery] string? acceptedDate)
    {
        try
        {
            _logger.LogInformation(
                "API Request: Fetching Accepted VVNs for SAR {SAR_ID} with filters: rep={Rep}, IMO={IMO}, ETA={ETA}, ETD={ETD}, SubmittedDate={SubmittedDate}, AcceptedDate={AcceptedDate}",
                idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture,submittedDate,acceptedDate);

            var dto = new FilterAcceptedVvnStatusDto()
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture,
                SubmittedDate = submittedDate,
                AcceptedDate = acceptedDate
            };

            var vvns = await _service.GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} accepted VVNs for SAR {SAR_ID}.", vvns.Count, idSarWhoImAm);
            return Ok(vvns);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Response (404): No accepted VVNs found for SAR {SAR_ID}. Reason: {Msg}", idSarWhoImAm, ex.Message);
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching accepted VVNs for SAR {SAR_ID}", idSarWhoImAm);
            return StatusCode(500, "An unexpected error occurred while retrieving accepted VVNs.");
        }
    }
}