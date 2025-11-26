using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;


[ApiController]
[Route("api/[controller]")]
public class VesselController : ControllerBase
{
    
    private readonly ILogger<VesselController> _logger;
    private readonly IVesselService _service;
    private readonly IResponsesToFrontend _refrontend;


    public VesselController(IVesselService service, ILogger<VesselController> logger, IResponsesToFrontend refrontend)
    {
        _service = service;
        _logger = logger;
        _refrontend = refrontend;
    }

    [HttpGet]
    public async Task<ActionResult<List<VesselDto>>> GetAllAsync()
    {
        try
        {
            _logger.LogInformation("API Request: Get All Vessels on DataBase");
            var listVesselDtos = await _service.GetAllAsync();
            _logger.LogWarning("API Response (200): A total of {count} were found -> {@Vessels}", listVesselDtos.Count, listVesselDtos);
            return Ok(listVesselDtos);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): No Vessels found on DataBase");
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
        
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("id/{id:guid}")]
    public async Task<ActionResult<VesselTypeDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Fetching Vessel with ID = {Id}", id);
            
        try
        {
            var vesselDto = await _service.GetByIdAsync(new VesselId(id));
            _logger.LogWarning("API Response (200): Vessel with ID = {Id} -> FOUND", id);
            return Ok(vesselDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): Vessel with ID = {Id} -> NOT FOUND", id);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
    
    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPost]
    public async Task<ActionResult<VesselDto>> CreateAsync(CreatingVesselDto creatingVesselDto)
    {
        try
        {
            _logger.LogInformation("API Request: Add Vessel with body = {@Dto}", creatingVesselDto);

            var vesselDto = await _service.CreateAsync(creatingVesselDto);
            _logger.LogInformation("API Response (201): Vessel created with IMO Number [{IMO}] and System ID [{ID}].", vesselDto.ImoNumber,vesselDto.Id);

            return CreatedAtAction(nameof(GetById), new { id = vesselDto.Id }, vesselDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("imo/{imo}")]
    public async Task<ActionResult<VesselDto>> GetByImoAsync(string imo)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching Vessel with IMO Number = {IMO}", imo);
            
            var vesselDto = await _service.GetByImoNumberAsync(imo);
            
            _logger.LogWarning("API Response (200): Vessel with IMO Number = {IMO} -> FOUND", imo);
            
            return Ok(vesselDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
    
    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("name/{name}")]
    public async Task<ActionResult<List<VesselDto>>> GetByNameAsync(string name)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching Vessel with Name = {NAME}", name);
            
            var vesselListDto = await _service.GetByNameAsync(name);
            
            _logger.LogWarning("API Response (200): Vessel with IMO Number = {NAME} -> FOUND", name);
            
            return Ok(vesselListDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("owner/{owner}")]
    public async Task<ActionResult<VesselDto>> GetByOwnerAsync(string owner)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching Vessel with Owner = {OWNER}", owner);
            
            var vesselListDto = await _service.GetByOwnerAsync(owner);
            
            _logger.LogWarning("API Response (200): Vessel with Owner = {OWNER} -> FOUND", owner);
            
            return Ok(vesselListDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpGet("filter")]
    public async Task<ActionResult<List<VesselDto>>> GetByFilterAsync(string? name, string? imo, string? ownerName,string? query)
    {
        _logger.LogInformation("API Request: Filtering Vessel/s Type/s with filters.");

        try
        {
            var vesselListDto = await _service.GetFilterAsync(name,imo,ownerName,query);
            
            _logger.LogInformation("API Response (200): Found {Count} Vessel/s -> {@Vessels}", vesselListDto.Count,vesselListDto);

            return Ok(vesselListDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
    
    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpPatch("imo/{imo}")]
    public async Task<ActionResult<VesselDto>> PatchByImoAsync(string imo, [FromBody] UpdatingVesselDto? dto)
    {
        if (dto == null) return BadRequest("No changes provided.");

        try
        {
            _logger.LogInformation("API Request: Partial update for Vessel with IMO = {IMO}", imo);

            var vesselDto = await _service.PatchByImoAsync(imo, dto);

            _logger.LogInformation("API Response (200): Vessel with IMO = {IMO} patched successfully", imo);
            return Ok(vesselDto);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }

    [Authorize(Roles = "PortAuthorityOfficer")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        _logger.LogInformation("API Request: Delete Vessel with ID = {Id}", id);

        try
        {
            await _service.DeleteAsync(new VesselId(id));
            _logger.LogInformation("API Response (200): Vessel with ID = {Id} deleted successfully.", id);
            return Ok($"Vessel with ID = {id} deleted successfully.");
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): Vessel with ID = {Id} -> NOT FOUND", id);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
}