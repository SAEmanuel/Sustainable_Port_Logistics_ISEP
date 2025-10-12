using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]

public class PhysicalResourceController : ControllerBase
{
    private static readonly string[] AllowedUpdateFields = 
        { "description", "operationalCapacity", "setupTime", "qualificationId" };

    
    private readonly PhysicalResourceService  _service;

    public PhysicalResourceController(PhysicalResourceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PhysicalResourceDTO>>> GetAll()
    {
        return await _service.GetAllAsync();
    }

    [HttpGet("get/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByID(Guid id)
    {
        try
        {
            var phy = await _service.GetByIdAsync(new PhysicalResourceId(id));

            if (phy == null)
            {
                return NotFound(new { error = "Physical resource not found." });
            }
        
            return phy;
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
        
        
    }

    [HttpGet("get/code/{code}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByCode(string code)
    {
        try
        {
            var phy = await _service.GetByCodeAsync(new PhysicalResourceCode(code));

            if (phy == null)
            {
                return NotFound(new { error = "Physical resource not found." }); 
            }
            
            return phy;
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("get/description/{description}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByDescription(string description)
    {
        try
        {
            var phy = await _service.GetByDescriptionAsync(description);

            if (phy == null || phy.Count == 0)
            {
                return NotFound(new { error = "Physical resource(s) not found." }); 
            }

            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("get/status/{status}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByStatus(PhysicalResourceStatus status)
    {
        try
        {
            var phy = await _service.GetByStatusAsync(status);

            if (phy == null || phy.Count == 0)
            {
                return NotFound(new { error = "Physical resource(s) not found." }); 
            }

            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("get/type/{type}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByType(PhysicalResourceType type)
    {
        try
        {
            var phy = await _service.GetByTypeAsync(type);

            if (phy == null || phy.Count == 0)
            {
                return NotFound(new { error = "Physical resource(s) not found." }); 
            }

            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("get/qualification/{qualification}")]
    public async Task<ActionResult<PhysicalResourceDTO>> GetByQualification(Guid qualification)
    {
        try
        {
            var phy = await _service.GetByQualificationAsync(new QualificationId(qualification));

            if (phy.Count == 0)
            {
                return NotFound(new { error = "Physical resource(s) not found." }); 
            }

            return Ok(phy);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    

    [HttpPost]
    public async Task<ActionResult<PhysicalResourceDTO>> Create(CreatingPhysicalResourceDTO dto)
    {
        try
        {
            var phy = await _service.AddAsync(dto);
            
            return CreatedAtAction(nameof(GetByID), new { id = phy.Id }, phy);
        }
        catch (BusinessRuleValidationException e)
        {
           return BadRequest(new { error = e.Message });
        }
    }
    

    [HttpPatch("update/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> Update(Guid id, JObject body)
    {
        var invalid = body.Properties()
            .Select(p => p.Name)
            .Where(name => !AllowedUpdateFields.Contains(name, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (invalid.Count > 0)
            return BadRequest(new
            {
                error = "The following field(s) cannot be updated:",
                fields = invalid
            });

        var dto = body.ToObject<UpdatingPhysicalResource>();

        try
        {
            var updated = await _service.UpdateAsync(new PhysicalResourceId(id), dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpPatch("deactivate/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> Deactivate(Guid id)
    {
        try
        {
            var deactivatedPR = await _service.DeactivationAsync(new PhysicalResourceId(id));
            if (deactivatedPR == null)
                return NotFound(new { error = "Physical resource not found." });
        
            return deactivatedPR;
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPatch("reactivate/{id}")]
    public async Task<ActionResult<PhysicalResourceDTO>> Activate(Guid id)
    {
        try
        {
            var activatedPR = await _service.ReactivationAsync(new PhysicalResourceId(id));
            if (activatedPR == null)
                return NotFound(new { error = "Physical resource not found." });
        
            return activatedPR;
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    
}