using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs.GetByStatus;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VesselVisitNotificationController : ControllerBase
{
    private readonly IVesselVisitNotificationService _service;
    private readonly ILogger<VesselVisitNotificationController> _logger;
    private readonly IResponsesToFrontend _refrontend;

    public VesselVisitNotificationController(
        IVesselVisitNotificationService service,
        ILogger<VesselVisitNotificationController> logger,
        IResponsesToFrontend refrontend)
    {
        _service = service;
        _logger = logger;
        _refrontend = refrontend;
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpPost]
    public async Task<ActionResult<VesselVisitNotificationDto>> CreateAsync(
        [FromBody] CreatingVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("API Request: Add VVN with body = {@Dto}", dto);

        try
        {
            var vvnDto = await _service.AddAsync(dto);
            _logger.LogInformation("API Response (201): VVN created with ID = {Id}", vvnDto.Id);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }

    //[Authorize(Roles = "PortAuthorityOfficer,LogisticsOperator,ShippingAgentRepresentative")]
    [HttpGet("id/{id:guid}")]
    public async Task<ActionResult<VesselVisitNotificationDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Fetching VVN with ID = {Id}", id);
        try
        {
            var vvnDto = await _service.GetByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogInformation("API Response (200): VVN with ID = {Id} -> FOUND", id);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): VVN with ID = {Id} -> NOT FOUND. {Msg}", id, e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    // ===== Actions by ID/Code =====
    // [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPut("{id:guid}/withdraw")]
    public async Task<ActionResult<VesselVisitNotificationDto>> WithdrawByIdAsync(Guid id)
    {
        _logger.LogInformation("API Request: PUT withdraw VVN with ID = {Id}", id);
        try
        {
            var vvnDto = await _service.WithdrawByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogInformation("API Response (200): VVN with ID = {Id} withdrawn. Status = {Status}", id,
                vvnDto.Status);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Withdraw VVN by ID = {Id}. {Msg}", id, e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error withdrawing VVN with ID = {Id}", id);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPut("{code}/withdraw")]
    public async Task<ActionResult<VesselVisitNotificationDto>> WithdrawByCodeAsync(string code)
    {
        _logger.LogInformation("API Request: PUT withdraw VVN with Code = {Code}", code);
        try
        {
            var vvnDto = await _service.WithdrawByCodeAsync(new VvnCode(code));
            _logger.LogInformation("API Response (200): VVN with Code = {Code} withdrawn. Status = {Status}", code,
                vvnDto.Status);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Withdraw VVN by Code = {Code}. {Msg}", code, e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Unexpected error withdrawing VVN with Code = {Code}", code);
            return _refrontend.ProblemResponse("Unexpected Error", e.Message, 500);
        }
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpPut("{code}/submit")]
    public async Task<ActionResult<VesselVisitNotificationDto>> SubmitByCodeAsync(string code)
    {
        _logger.LogInformation("API Request: PUT submit VVN with Code = {Code}", code);
        try
        {
            var vvnDto = await _service.SubmitByCodeAsync(new VvnCode(code));
            _logger.LogInformation("API Response (200): VVN with Code = {Code} submitted. Status = {Status}", code,
                vvnDto.Status);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Submit VVN by Code = {Code}. {Msg}", code, e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error submitting VVN with Code = {Code}", code);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpPut("{id:guid}/submit")]
    public async Task<ActionResult<VesselVisitNotificationDto>> SubmitByIdAsync(Guid id)
    {
        _logger.LogInformation("API Request: PUT submit VVN with ID = {Id}", id);
        try
        {
            var vvnDto = await _service.SubmitByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogInformation("API Response (200): VVN with ID = {Id} submitted. Status = {Status}", id,
                vvnDto.Status);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Submit VVN by ID = {Id}. {Msg}", id, e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error submitting VVN with id = {Id}", id);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpPut("{id:guid}/update")]
    public async Task<ActionResult<VesselVisitNotificationDto>> UpdateAsync(
        Guid id,
        [FromBody] UpdateVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("API Request: PUT update VVN with ID = {Id}. Body = {@Dto}", id, dto);
        try
        {
            var updatedVvn = await _service.UpdateAsync(new VesselVisitNotificationId(id), dto);
            _logger.LogInformation("API Response (200): VVN with ID = {Id} updated. New Status = {Status}", id,
                updatedVvn.Status);
            return Ok(updatedVvn);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Update VVN with ID = {Id}. {Msg}", id, ex.Message);
            return _refrontend.ProblemResponse("Validation Error", ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating VVN with ID = {Id}", id);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPut("accept/id/{id:guid}")]
    public async Task<ActionResult<VesselVisitNotificationDto>> AcceptVvn(Guid id)
    {
        _logger.LogInformation("API Request: PUT accept VVN with ID = {Id}", id);
        try
        {
            var vvn = await _service.GetByIdAsync(new VesselVisitNotificationId(id));
            _logger.LogInformation("Service: Found VVN to accept. ID = {Id}, Code = {Code}", id, vvn.Code);
            var vvnDto = await _service.AcceptVvnAsync(new VvnCode(vvn.Code));
            _logger.LogInformation("API Response (200): VVN with ID = {Id} accepted. Status = {Status}", id,
                vvnDto.Status);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Accept VVN with ID = {Id}. {Msg}", id, ex.Message);
            return _refrontend.ProblemResponse("Validation Error", ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error accepting VVN with id = {Id}", id);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPut("reject/")]
    public async Task<ActionResult<VesselVisitNotificationDto>> RejectVvn(RejectVesselVisitNotificationDto dto)
    {
        _logger.LogInformation("API Request: PUT reject VVN with code = {Code}. Reason = {Reason}", dto.VvnCode,
            dto.Reason);
        try
        {
            var vvnDto = await _service.MarkAsPendingAsync(dto);
            _logger.LogInformation(
                "API Response (200): VVN with code = {Code} marked as PENDING INFORMATION. Status = {Status}",
                dto.VvnCode, vvnDto.Status);
            return Ok(vvnDto);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Reject VVN with code = {Code}. {Msg}", dto.VvnCode, ex.Message);
            return _refrontend.ProblemResponse("Validation Error", ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error rejecting VVN with code = {Code}", dto.VvnCode);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    // ===== Queries by SAR =====
    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/inProgress-pendingInformation/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetInProgressOrPendingVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture)
    {
        _logger.LogInformation(
            "API Request: GET SAR InProgress/Pending VVN. SAR = {SarId}, Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}",
            idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture);

        try
        {
            var dto = new FilterInProgressPendingVvnStatusDto
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture
            };
            var vvDtoList = await _service
                .GetInProgressPendingInformationVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} VVN(s) for SAR = {SarId} (InProgress/Pending).",
                vvDtoList.Count, idSarWhoImAm);

            return Ok(vvDtoList);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (404): SAR = {SarId}. InProgress/Pending query failed. {Msg}", idSarWhoImAm,
                ex.Message);
            return _refrontend.ProblemResponse("Not Found", ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching InProgress/Pending VVN(s) for SAR = {SarId}", idSarWhoImAm);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/withDrawn/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetWithdrawnVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture)
    {
        _logger.LogInformation(
            "API Request: GET SAR Withdrawn VVN. SAR = {SarId}, Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}",
            idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture);

        try
        {
            var dto = new FilterWithdrawnVvnStatusDto
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture
            };
            var vvns = await _service
                .GetWithdrawnVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} withdrawn VVN(s) for SAR = {SarId}.",
                vvns.Count, idSarWhoImAm);

            return Ok(vvns);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (404): SAR = {SarId}. Withdrawn query failed. {Msg}", idSarWhoImAm,
                ex.Message);
            return _refrontend.ProblemResponse("Not Found", ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching Withdrawn VVN(s) for SAR = {SarId}", idSarWhoImAm);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
    [HttpGet("shippingAgentRepresentative/submitted/{id:guid}")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetSubmittedVvnsByFiltersAsync(
        [FromRoute(Name = "id")] Guid idSarWhoImAm,
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture,
        [FromQuery] string? submittedDate)
    {
        _logger.LogInformation(
            "API Request: GET SAR Submitted VVN. SAR = {SarId}, Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}, SubmittedDate = {Submitted}",
            idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture,
            submittedDate);

        try
        {
            var dto = new FilterSubmittedVvnStatusDto
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture,
                SubmittedDate = submittedDate
            };
            var vvns = await _service
                .GetSubmittedVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} submitted VVN(s) for SAR = {SarId}.",
                vvns.Count, idSarWhoImAm);

            return Ok(vvns);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (404): SAR = {SarId}. Submitted query failed. {Msg}", idSarWhoImAm,
                ex.Message);
            return _refrontend.ProblemResponse("Not Found", ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching Submitted VVN(s) for SAR = {SarId}", idSarWhoImAm);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    //[Authorize(Roles = "ShippingAgentRepresentative")]
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
        _logger.LogInformation(
            "API Request: GET SAR Accepted VVN. SAR = {SarId}, Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}, Submitted = {Submitted}, Accepted = {Accepted}",
            idSarWhoImAm, specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture,
            submittedDate, acceptedDate);

        try
        {
            var dto = new FilterAcceptedVvnStatusDto
            {
                SpecificRepresentative = specificRepresentative,
                VesselImoNumber = vesselImoNumber,
                EstimatedTimeArrival = estimatedTimeArrival,
                EstimatedTimeDeparture = estimatedTimeDeparture,
                SubmittedDate = submittedDate,
                AcceptedDate = acceptedDate
            };
            var vvns = await _service
                .GetAcceptedVvnsByShippingAgentRepresentativeIdFiltersAsync(idSarWhoImAm, dto);

            _logger.LogInformation("API Response (200): Found {Count} accepted VVN(s) for SAR = {SarId}.",
                vvns.Count, idSarWhoImAm);

            return Ok(vvns);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (404): SAR = {SarId}. Accepted query failed. {Msg}", idSarWhoImAm,
                ex.Message);
            return _refrontend.ProblemResponse("Not Found", ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching Accepted VVN(s) for SAR = {SarId}", idSarWhoImAm);
            return _refrontend.ProblemResponse("Unexpected Error", ex.Message, 500);
        }
    }

    // ===== ADMIN (ALL) =====

    [HttpGet("all/inProgress-pendingInformation")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetAllInProgressPendingAsync(
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture)
    {
        _logger.LogInformation(
            "API Request: GET ADMIN InProgress/Pending. Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}",
            specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture);

        var dto = new FilterInProgressPendingVvnStatusDto
        {
            SpecificRepresentative = specificRepresentative,
            VesselImoNumber = vesselImoNumber,
            EstimatedTimeArrival = estimatedTimeArrival,
            EstimatedTimeDeparture = estimatedTimeDeparture
        };
        var res = await _service.GetInProgressPendingInformationVvnsByFiltersAsync(dto);

        _logger.LogInformation("API Response (200): ADMIN InProgress/Pending -> {Count} VVN(s) found.", res.Count);

        return Ok(res);
    }

    [HttpGet("all/withDrawn")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetAllWithdrawnAsync(
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture)
    {
        _logger.LogInformation(
            "API Request: GET ADMIN Withdrawn. Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}",
            specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture);

        var dto = new FilterWithdrawnVvnStatusDto
        {
            SpecificRepresentative = specificRepresentative,
            VesselImoNumber = vesselImoNumber,
            EstimatedTimeArrival = estimatedTimeArrival,
            EstimatedTimeDeparture = estimatedTimeDeparture
        };
        var res = await _service.GetWithdrawnVvnsByFiltersAsync(dto);

        _logger.LogInformation("API Response (200): ADMIN Withdrawn -> {Count} VVN(s) found.", res.Count);

        return Ok(res);
    }

    [HttpGet("all/submitted")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetAllSubmittedAsync(
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture,
        [FromQuery] string? submittedDate)
    {
        _logger.LogInformation(
            "API Request: GET ADMIN Submitted. Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}, Submitted = {Submitted}",
            specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture, submittedDate);

        var dto = new FilterSubmittedVvnStatusDto
        {
            SpecificRepresentative = specificRepresentative,
            VesselImoNumber = vesselImoNumber,
            EstimatedTimeArrival = estimatedTimeArrival,
            EstimatedTimeDeparture = estimatedTimeDeparture,
            SubmittedDate = submittedDate
        };
        var res = await _service.GetSubmittedVvnsByFiltersAsync(dto);

        _logger.LogInformation("API Response (200): ADMIN Submitted -> {Count} VVN(s) found.", res.Count);

        return Ok(res);
    }

    [HttpGet("all/accepted")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetAllAcceptedAsync(
        [FromQuery] Guid? specificRepresentative,
        [FromQuery] string? vesselImoNumber,
        [FromQuery] string? estimatedTimeArrival,
        [FromQuery] string? estimatedTimeDeparture,
        [FromQuery] string? submittedDate,
        [FromQuery] string? acceptedDate)
    {
        _logger.LogInformation(
            "API Request: GET ADMIN Accepted. Filters -> Rep = {Rep}, IMO = {Imo}, ETA = {Eta}, ETD = {Etd}, Submitted = {Submitted}, Accepted = {Accepted}",
            specificRepresentative, vesselImoNumber, estimatedTimeArrival, estimatedTimeDeparture, submittedDate,
            acceptedDate);

        var dto = new FilterAcceptedVvnStatusDto
        {
            SpecificRepresentative = specificRepresentative,
            VesselImoNumber = vesselImoNumber,
            EstimatedTimeArrival = estimatedTimeArrival,
            EstimatedTimeDeparture = estimatedTimeDeparture,
            SubmittedDate = submittedDate,
            AcceptedDate = acceptedDate
        };
        var res = await _service.GetAcceptedVvnsByFiltersAsync(dto);

        _logger.LogInformation("API Response (200): ADMIN Accepted -> {Count} VVN(s) found.", res.Count);

        return Ok(res);
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VesselVisitNotificationDto>>> GetAllAccepted()
    {
        _logger.LogInformation("API Request: Get all vessel visit notifications");
        var list = await _service.GetAllAcceptedAsync();
        _logger.LogInformation("API Response (200): Returning {Count} vessel visit notifications", list.Count);
        return Ok(list);
    }
}