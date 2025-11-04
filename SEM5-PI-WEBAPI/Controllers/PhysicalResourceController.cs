using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Controllers;

[Authorize(Roles = "LogisticsOperator")]
[ApiController]
[Route("api/[controller]")]
public class PhysicalResourceController : ControllerBase
{
    private static readonly string[] AllowedUpdateFields =
        { "description", "operationalCapacity", "setupTime", "qualificationId" };

    private readonly IPhysicalResourceService _service;
    private readonly ILogger<PhysicalResourceController> _logger;

    public PhysicalResourceController(IPhysicalResourceService service, ILogger<PhysicalResourceController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetAll()
    {
        _logger.LogInformation("API Request: Get all Physical Resources.");
        var list = await _service.GetAllAsync();
        _logger.LogInformation("API Response (200): Returning {Count} Physical Resources.", list.Count);
        return Ok(list);
    }

    [HttpGet("get/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByID(Guid id)
    {
        _logger.LogInformation("API Request: Get Physical Resource by ID = {Id}", id);
        try
        {
            var phy = await _service.GetByIdAsync(new PhysicalResourceId(id));
            if (phy == null)
            {
                _logger.LogWarning("API Response (404): Physical Resource with ID = {Id} not found.", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Physical Resource with ID = {Id} found.", id);
            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to get Physical Resource with ID = {Id}. Reason: {Message}", id, e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("get/code/{code}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByCode(string code)
    {
        _logger.LogInformation("API Request: Get Physical Resource by Code = {Code}", code);
        try
        {
            var phy = await _service.GetByCodeAsync(new PhysicalResourceCode(code));
            if (phy == null)
            {
                _logger.LogWarning("API Response (404): Physical Resource with Code = {Code} not found.", code);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Physical Resource with Code = {Code} found.", code);
            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to get Physical Resource with Code = {Code}. Reason: {Message}", code, e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("get/description/{description}")]
    public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByDescription(string description)
    {
        _logger.LogInformation("API Request: Get Physical Resources by Description = {Description}", description);
        try
        {
            var phy = await _service.GetByDescriptionAsync(description);
            if (phy == null || phy.Count == 0)
            {
                _logger.LogWarning("API Response (404): No Physical Resources found with Description = {Description}", description);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Returning {Count} Physical Resources with Description = {Description}", phy.Count, description);
            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("get/status/{status}")]
    public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByStatus(PhysicalResourceStatus status)
    {
        _logger.LogInformation("API Request: Get Physical Resources by Status = {Status}", status);
        try
        {
            var phy = await _service.GetByStatusAsync(status);
            if (phy == null || phy.Count == 0)
            {
                _logger.LogWarning("API Response (404): No Physical Resources found with Status = {Status}", status);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Returning {Count} Physical Resources with Status = {Status}", phy.Count, status);
            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("get/type/{type}")]
    public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByType(PhysicalResourceType type)
    {
        _logger.LogInformation("API Request: Get Physical Resources by Type = {Type}", type);
        try
        {
            var phy = await _service.GetByTypeAsync(type);
            if (phy == null || phy.Count == 0)
            {
                _logger.LogWarning("API Response (404): No Physical Resources found with Type = {Type}", type);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Returning {Count} Physical Resources with Type = {Type}", phy.Count, type);
            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("get/qualification/{qualification}")]
    public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetByQualification(Guid qualification)
    {
        _logger.LogInformation("API Request: Get Physical Resources by Qualification ID = {Qualification}", qualification);
        try
        {
            var phy = await _service.GetByQualificationAsync(new QualificationId(qualification));
            if (phy == null || phy.Count == 0)
            {
                _logger.LogWarning("API Response (404): No Physical Resources found with Qualification ID = {Qualification}", qualification);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Returning {Count} Physical Resources with Qualification ID = {Qualification}", phy.Count, qualification);
            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<PhysicalResourceDTO>> Create(CreatingPhysicalResourceDto dto)
    {
        _logger.LogInformation("API Request: Create new Physical Resource with data {@Dto}", dto);
        try
        {
            var phy = await _service.AddAsync(dto);
            _logger.LogInformation("API Response (201): Physical Resource created with ID = {Id}", phy.Id);
            return CreatedAtAction(nameof(GetByID), new { id = phy.Id }, phy);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPatch("update/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> Update(Guid id, JObject body)
    {
        _logger.LogInformation("API Request: Update Physical Resource with ID = {Id}", id);
        var invalid = body.Properties()
            .Select(p => p.Name)
            .Where(name => !AllowedUpdateFields.Contains(name, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (invalid.Count > 0)
        {
            _logger.LogWarning("API Response (400): Invalid update fields provided: {Fields}", string.Join(", ", invalid));
            return BadRequest(new { error = "The following field(s) cannot be updated:", fields = invalid });
        }

        var dto = body.ToObject<UpdatingPhysicalResource>();
        try
        {
            var updated = await _service.UpdateAsync(new PhysicalResourceId(id), dto);
            if (updated == null)
            {
                _logger.LogWarning("API Response (404): Physical Resource with ID = {Id} not found for update.", id);
                return NotFound();
            }

            _logger.LogInformation("API Response (200): Physical Resource with ID = {Id} updated successfully.", id);
            return Ok(updated);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPatch("deactivate/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> Deactivate(Guid id)
    {
        _logger.LogInformation("API Request: Deactivate Physical Resource with ID = {Id}", id);
        try
        {
            var deactivatedPR = await _service.DeactivationAsync(new PhysicalResourceId(id));
            if (deactivatedPR == null)
            {
                _logger.LogWarning("API Response (404): Physical Resource with ID = {Id} not found for deactivation.", id);
                return NotFound(new { error = "Physical resource not found." });
            }

            _logger.LogInformation("API Response (200): Physical Resource with ID = {Id} deactivated successfully.", id);
            return Ok(deactivatedPR);
        }
        catch (Exception e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPatch("reactivate/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> Activate(Guid id)
    {
        _logger.LogInformation("API Request: Reactivate Physical Resource with ID = {Id}", id);
        try
        {
            var activatedPR = await _service.ReactivationAsync(new PhysicalResourceId(id));
            if (activatedPR == null)
            {
                _logger.LogWarning("API Response (404): Physical Resource with ID = {Id} not found for reactivation.", id);
                return NotFound(new { error = "Physical resource not found." });
            }

            _logger.LogInformation("API Response (200): Physical Resource with ID = {Id} reactivated successfully.", id);
            return Ok(activatedPR);
        }
        catch (Exception e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { error = e.Message });
        }
    }
}
